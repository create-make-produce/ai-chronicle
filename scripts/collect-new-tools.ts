// =============================================
// AI Chronicle - ジョブA+B
// 新着ツール発見 + AIによるデータ構造化
// =============================================
// 実行: tsx scripts/collect-new-tools.ts
// GitHub Actions: 毎日UTC 02:00
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else {
  loadEnv();
}

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { fetchLatestAIPosts, fetchLatestPosts, isAITool, type ProductHuntPost } from '../src/lib/product-hunt';
import {
  fetchHtml,
  htmlToText,
  extractMeta,
  guessFaviconUrl,
  truncateForAI,
} from '../src/lib/scraper';
import { generateId } from '../src/lib/uuid';
import { slugify, slugifyFromUrl } from '../src/lib/slug';
import { createNews } from '../src/lib/news-generator';

interface ExtractedToolData {
  is_ai_tool: boolean;
  tool_name: string | null;
  tagline: string | null;
  description: string | null;
  company_name: string | null;
  has_free_plan: boolean | null;
  starting_price_usd: number | null;
  category_hint: string | null;
  tags: string[] | null;
  has_api: boolean | null;
  supported_languages: string[] | null;
}

const CATEGORY_MAP: Record<string, string> = {
  'text-generation': 'text-generation',
  text: 'text-generation',
  writing: 'text-generation',
  chat: 'text-generation',
  'image-generation': 'image-generation',
  image: 'image-generation',
  'video-generation': 'video-generation',
  video: 'video-generation',
  coding: 'coding',
  code: 'coding',
  developer: 'coding',
  audio: 'audio',
  music: 'audio',
  voice: 'audio',
  speech: 'audio',
  'data-analysis': 'data-analysis',
  data: 'data-analysis',
  analytics: 'data-analysis',
  productivity: 'productivity',
  workflow: 'productivity',
  automation: 'productivity',
};

// =============================================
// 失敗IDの管理（scrape_logsを利用）
// =============================================

const FAILED_IDS_JOB = 'collect_failed_ids';

/**
 * 前回以前に失敗したProduct Hunt IDを取得
 */
async function loadFailedProductHuntIds(db: D1Client): Promise<string[]> {
  const row = await db.first<{ errors: string | null }>(
    `SELECT errors FROM scrape_logs WHERE job_name = ? ORDER BY started_at DESC LIMIT 1`,
    [FAILED_IDS_JOB]
  );
  if (!row || !row.errors) return [];
  try {
    const parsed = JSON.parse(row.errors) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 失敗IDリストを保存（上書き）
 */
async function saveFailedProductHuntIds(db: D1Client, ids: string[]): Promise<void> {
  if (ids.length === 0) {
    // 失敗IDがゼロになったらレコードを削除してクリーン
    await db.execute(`DELETE FROM scrape_logs WHERE job_name = ?`, [FAILED_IDS_JOB]);
    console.log('  ✅ 失敗IDログをクリア（全件成功）');
    return;
  }
  // 既存レコードがあれば更新、なければ挿入
  const existing = await db.first<{ id: string }>(
    `SELECT id FROM scrape_logs WHERE job_name = ? LIMIT 1`,
    [FAILED_IDS_JOB]
  );
  if (existing) {
    await db.execute(
      `UPDATE scrape_logs SET errors = ?, started_at = datetime('now'), finished_at = datetime('now') WHERE id = ?`,
      [JSON.stringify(ids), existing.id]
    );
  } else {
    await db.execute(
      `INSERT INTO scrape_logs (id, job_name, status, errors, started_at, finished_at) VALUES (?, ?, 'error', ?, datetime('now'), datetime('now'))`,
      [generateId('log'), FAILED_IDS_JOB, JSON.stringify(ids)]
    );
  }
  console.log(`  📝 失敗IDログ更新: ${ids.length}件 → 次回優先処理`);
}

/**
 * 失敗したIDのPostをProduct Hunt APIから取得
 */
async function fetchPostsByIds(ids: string[]): Promise<ProductHuntPost[]> {
  if (ids.length === 0) return [];
  // 全件取得してIDでフィルタ（GraphQLのIDフィルタが使えない場合の代替）
  const all = await fetchLatestPosts();
  const found = all.filter(p => ids.includes(p.id));
  console.log(`  → 失敗ID ${ids.length}件中 ${found.length}件を再取得`);
  return found;
}

// =============================================
// ツールデータ処理
// =============================================

async function discoverNewTools(db: D1Client): Promise<ProductHuntPost[]> {
  console.log('🔍 Product Huntから新着AIツールを取得中...');
  const posts = await fetchLatestAIPosts();
  console.log(`  → ${posts.length}件のAI関連投稿を検出`);

  const newPosts: ProductHuntPost[] = [];
  for (const post of posts) {
    const existing = await db.first<{ count: number }>(
      'SELECT COUNT(*) AS count FROM tools WHERE product_hunt_id = ?',
      [post.id]
    );
    if (!existing || existing.count === 0) {
      newPosts.push(post);
    }
  }
  console.log(`  → うち未登録: ${newPosts.length}件`);
  return newPosts.slice(0, CONFIG.MAX_NEW_TOOLS_PER_RUN);
}

async function extractToolData(
  post: ProductHuntPost,
  pageText: string | null
): Promise<ExtractedToolData> {
  const prompt = `以下のツール情報を分析してください。
JSONのみを出力し、マークダウンや説明文は出力しないでください。

【Product Hunt情報】
- 名前: ${post.name}
- タグライン: ${post.tagline}
- 説明: ${post.description ?? '（なし）'}
- 公式サイト: ${post.website ?? '（不明）'}
- トピック: ${post.topics.map((t) => t.name).join(', ')}

【公式サイトのテキスト（抜粋）】
${pageText ? truncateForAI(pageText, 8000) : '（取得失敗）'}

【重要】まず is_ai_tool を判定してください。
AIツールの定義：機械学習・大規模言語モデル・画像生成AI・音声AI・コード補完AI等の人工知能技術を核心機能として使用するソフトウェア。
AIツールではない例：ハードウェア製品、NAS/ストレージ機器、単なるSaaSツール（AI機能なし）、ゲーム、メディアプレイヤー。

【出力形式】
{
  "is_ai_tool": true または false,
  "tool_name": "ツール名（正式名称）またはnull",
  "tagline": "1行のキャッチコピー（英語）またはnull",
  "description": "3文以内の機能説明（英語）またはnull",
  "company_name": "開発会社名またはnull",
  "has_free_plan": true/false/null,
  "starting_price_usd": 最安の有料プラン月額USD価格の数値またはnull,
  "category_hint": "text-generation / image-generation / video-generation / coding / audio / data-analysis / productivity / other のいずれか",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "has_api": true/false/null,
  "supported_languages": ["en", "ja"] のような言語コード配列またはnull
}

is_ai_tool が false の場合、他の項目はすべて null で構いません。`;

  const raw = await callAI(prompt);
  return parseJsonResponse<ExtractedToolData>(raw);
}

async function translateToJapanese(
  tagline: string | null,
  description: string | null
): Promise<{ tagline_ja: string | null; description_ja: string | null }> {
  if (!tagline && !description) {
    return { tagline_ja: null, description_ja: null };
  }

  const prompt = `以下の英語テキストを自然な日本語に翻訳してください。
JSONのみを出力し、マークダウンや説明文は出力しないでください。

【翻訳対象】
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}

【日本語表記ルール・厳守】
tagline_ja のルール：
  - 「[ツールの種類・カテゴリ（名詞1〜4語）] [キャッチコピー]」の順番で書く
  - 例：「画像生成AI 思い通りのビジュアルを一瞬で」「コーディング支援 開発速度を10倍に」
  - 末尾に句読点（。や、）を絶対につけない
  - 25文字以内

description_ja のルール：
  - 2〜3文で自然な説明
  - 各文の末尾に句読点（。）を絶対につけない
  - 文末は体言止め（名詞で終わる）か、「〜できる」「〜可能」「〜に対応」などで終わる
  - 例：「テキストから高品質な画像を生成できるAIツール。スタイルの細かい指定や商用利用にも対応」

【出力形式】
{
  "tagline_ja": "翻訳結果（ルール厳守）",
  "description_ja": "翻訳結果（ルール厳守）"
}

翻訳対象がnullまたは空の場合は対応する出力値もnullにしてください。`;

  const raw = await callAI(prompt);
  return parseJsonResponse<{
    tagline_ja: string | null;
    description_ja: string | null;
  }>(raw);
}

function calculateConfidence(extracted: ExtractedToolData): number {
  let score = 0;
  if (extracted.tool_name) score += 20;
  if (extracted.starting_price_usd !== null || extracted.has_free_plan !== null) score += 20;
  if (extracted.description && extracted.description.length >= 100) score += 20;
  if (extracted.category_hint) score += 15;
  if (extracted.company_name) score += 15;
  if (extracted.supported_languages && extracted.supported_languages.length > 0) score += 10;
  return score / 100;
}

async function resolveCategoryId(db: D1Client, hint: string | null): Promise<string | null> {
  const normalized = hint ? CATEGORY_MAP[hint.toLowerCase().trim()] ?? 'other' : 'other';
  const cat = await db.first<{ id: string }>('SELECT id FROM categories WHERE slug = ?', [normalized]);
  return cat?.id ?? null;
}

async function generateUniqueSlug(db: D1Client, baseText: string, fallbackUrl: string | null): Promise<string> {
  let base = slugify(baseText);
  if (!base && fallbackUrl) base = slugifyFromUrl(fallbackUrl);
  if (!base) base = 'tool';

  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await db.first<{ count: number }>('SELECT COUNT(*) AS count FROM tools WHERE slug = ?', [slug]);
    if (!existing || existing.count === 0) return slug;
    counter++;
    slug = `${base}-${counter}`;
    if (counter > 20) return `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
}

async function processSingleTool(
  db: D1Client,
  post: ProductHuntPost
): Promise<{ success: boolean; toolId?: string; skipped?: boolean; error?: string }> {
  try {
    console.log(`\n📦 処理中: ${post.name}`);

    let pageText: string | null = null;
    let metaInfo: { title: string | null; description: string | null; ogImage: string | null } = { title: null, description: null, ogImage: null };
    let logoUrl: string | null = null;

    if (post.website) {
      try {
        const html = await fetchHtml(post.website);
        pageText = htmlToText(html);
        metaInfo = extractMeta(html);
        logoUrl = metaInfo.ogImage ?? guessFaviconUrl(post.website);
      } catch (error) {
        console.warn(`  ⚠️ 公式サイト取得失敗: ${error instanceof Error ? error.message : String(error)}`);
        logoUrl = post.thumbnail?.url ?? null;
      }
    } else {
      logoUrl = post.thumbnail?.url ?? null;
    }

    const extracted = await extractToolData(post, pageText);

    if (!extracted.is_ai_tool) {
      console.log(`  ⏭️ スキップ: AIツールではないと判定（${post.name}）`);
      return { success: true, skipped: true };
    }

    const confidence = calculateConfidence(extracted);
    console.log(`  ✓ AI抽出完了（確信度: ${(confidence * 100).toFixed(0)}%）`);

    const translated = await translateToJapanese(
      extracted.tagline ?? post.tagline,
      extracted.description ?? post.description
    );
    console.log(`  ✓ 翻訳完了`);

    const categoryId = await resolveCategoryId(db, extracted.category_hint);
    const slug = await generateUniqueSlug(db, extracted.tool_name ?? post.name, post.website);

    const toolId = generateId('tool');
    const isPublished = confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH ? 1 : 0;
    const needsReview = confidence < CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH ? 1 : 0;

    await db.execute(
      `INSERT INTO tools (
        id, slug, name_ja, name_en, tagline_ja, tagline_en,
        description_ja, description_en, official_url, logo_url,
        company_name, category_id, status, is_published,
        has_api, has_free_plan,
        product_hunt_id, product_hunt_url,
        ai_confidence_score, needs_manual_review,
        data_source, source_url,
        language_support,
        last_scraped_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'active', ?,
        ?, ?,
        ?, ?,
        ?, ?,
        'product_hunt_api', ?,
        ?,
        datetime('now'), datetime('now'), datetime('now')
      )`,
      [
        toolId, slug,
        extracted.tool_name ?? post.name, extracted.tool_name ?? post.name,
        translated.tagline_ja, extracted.tagline ?? post.tagline,
        translated.description_ja, extracted.description ?? post.description,
        post.website, logoUrl,
        extracted.company_name, categoryId, isPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.id, post.url,
        confidence, needsReview,
        post.url,
        extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
      ]
    );

    if (extracted.starting_price_usd !== null && extracted.starting_price_usd > 0) {
      await db.execute(
        `INSERT INTO pricing_plans (id, tool_id, plan_name, is_free, price_usd, billing_cycle, price_source_url) VALUES (?, ?, 'Pro', 0, ?, 'monthly', ?)`,
        [generateId('plan'), toolId, extracted.starting_price_usd, post.website]
      );
    }
    if (extracted.has_free_plan === true) {
      await db.execute(
        `INSERT INTO pricing_plans (id, tool_id, plan_name, is_free, price_usd, billing_cycle) VALUES (?, ?, 'Free', 1, 0, 'monthly')`,
        [generateId('plan'), toolId]
      );
    }

    console.log(`  ✅ 登録完了: ${slug}${isPublished ? '（公開）' : '（レビュー待ち）'}`);

    if (isPublished) {
      const category = categoryId ? await db.first<{ name_ja: string }>('SELECT name_ja FROM categories WHERE id = ?', [categoryId]) : null;
      await createNews(db, {
        type: 'new_tool',
        tool: {
          id: toolId, slug,
          name_ja: extracted.tool_name ?? post.name,
          name_en: extracted.tool_name ?? post.name,
          tagline_ja: translated.tagline_ja,
          tagline_en: extracted.tagline ?? post.tagline,
          description_ja: translated.description_ja,
          official_url: post.website,
          category_name_ja: category?.name_ja ?? null,
        },
      });
    }

    return { success: true, toolId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ 失敗: ${msg}`);
    return { success: false, error: msg };
  }
}

// =============================================
// メイン処理
// =============================================

async function main() {
  console.log('🚀 AI Chronicle - 新着ツール収集ジョブ開始');
  console.log(`   設定: MAX_NEW_TOOLS_PER_RUN = ${CONFIG.MAX_NEW_TOOLS_PER_RUN}`);
  console.log(`   AI プロバイダー: ${CONFIG.AI_PROVIDER} (${CONFIG.AI_MODEL})`);

  const startedAt = new Date().toISOString();
  const db = D1Client.fromEnv();
  const logId = generateId('log');

  await db.execute(
    `INSERT INTO scrape_logs (id, job_name, status, started_at) VALUES (?, 'collect_new_tools', 'running', ?)`,
    [logId, startedAt]
  );

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Geminiダウン検知カウンター
  let consecutiveGeminiFailures = 0;
  const GEMINI_DOWN_THRESHOLD = 2; // 連続2件失敗でダウン判定

  // 失敗IDを次回に持ち越すリスト
  let failedIds = await loadFailedProductHuntIds(db);
  if (failedIds.length > 0) {
    console.log(`\n⚠️ 前回失敗分: ${failedIds.length}件を優先処理します`);
  }

  try {
    // =============================================
    // STEP 1: 前回失敗分を優先処理
    // =============================================
    if (failedIds.length > 0) {
      console.log('\n--- 前回失敗分の再処理 ---');
      const retryPosts = await fetchPostsByIds(failedIds);

      for (const post of retryPosts) {
        // 既にDBに登録済みなら（別ルートで登録された等）スキップ
        const existing = await db.first<{ count: number }>(
          'SELECT COUNT(*) AS count FROM tools WHERE product_hunt_id = ?',
          [post.id]
        );
        if (existing && existing.count > 0) {
          console.log(`  ⏭️ 既に登録済みのためスキップ: ${post.name}`);
          failedIds = failedIds.filter(id => id !== post.id);
          continue;
        }

        const result = await processSingleTool(db, post);

        if (result.skipped) {
          // AIツールではないと判定 → 失敗リストから除去
          failedIds = failedIds.filter(id => id !== post.id);
          skipped++;
        } else if (result.success) {
          // 成功 → 失敗リストから除去
          failedIds = failedIds.filter(id => id !== post.id);
          added++;
          consecutiveGeminiFailures = 0;
        } else {
          // また失敗 → リストに残す（次回へ持ち越し）
          consecutiveGeminiFailures++;
          errors.push(`${post.name}: ${result.error ?? 'unknown'}`);

          if (consecutiveGeminiFailures >= GEMINI_DOWN_THRESHOLD) {
            console.log(`\n🛑 Gemini連続${GEMINI_DOWN_THRESHOLD}件失敗 → サーバーダウンと判断し今回の処理を終了`);
            console.log('   次回スケジュール実行時に自動リトライされます');
            await saveFailedProductHuntIds(db, failedIds);
            const status = added > 0 ? 'partial' : 'error';
            await db.execute(
              `UPDATE scrape_logs SET status = ?, tools_added = ?, errors = ?, finished_at = datetime('now') WHERE id = ?`,
              [status, added, JSON.stringify(errors), logId]
            );
            console.log(`\n========== 結果 ==========`);
            console.log(`  ✅ 新規登録: ${added}件`);
            console.log(`  ⏭️ スキップ（非AIツール）: ${skipped}件`);
            console.log(`  ❌ エラー: ${errors.length}件`);
            console.log(`  🏁 ステータス: ${status}（Geminiダウンのため早期終了）`);
            return;
          }
        }
      }

      // 再処理後の失敗IDリストを保存
      await saveFailedProductHuntIds(db, failedIds);
    }

    // =============================================
    // STEP 2: 通常の新着取得
    // =============================================
    console.log('\n--- 新着ツールの取得 ---');
    const newPosts = await discoverNewTools(db);
    if (newPosts.length === 0) {
      console.log('\n✨ 新規ツールはありませんでした');
    }

    for (const post of newPosts) {
      const result = await processSingleTool(db, post);

      if (result.skipped) {
        skipped++;
      } else if (result.success) {
        added++;
        consecutiveGeminiFailures = 0;
      } else {
        consecutiveGeminiFailures++;
        errors.push(`${post.name}: ${result.error ?? 'unknown'}`);

        // 失敗IDを記録（次回優先処理）
        if (!failedIds.includes(post.id)) {
          failedIds.push(post.id);
        }

        if (consecutiveGeminiFailures >= GEMINI_DOWN_THRESHOLD) {
          console.log(`\n🛑 Gemini連続${GEMINI_DOWN_THRESHOLD}件失敗 → サーバーダウンと判断し今回の処理を終了`);
          console.log('   次回スケジュール実行時に自動リトライされます');

          // 未処理のツールも失敗IDに追加（取りこぼし防止）
          const currentIndex = newPosts.indexOf(post);
          for (const remainingPost of newPosts.slice(currentIndex + 1)) {
            if (!failedIds.includes(remainingPost.id)) {
              failedIds.push(remainingPost.id);
            }
          }
          console.log(`  📝 未処理 ${newPosts.slice(currentIndex + 1).length}件も次回優先リストに追加`);

          await saveFailedProductHuntIds(db, failedIds);
          const status = added > 0 ? 'partial' : 'error';
          await db.execute(
            `UPDATE scrape_logs SET status = ?, tools_added = ?, errors = ?, finished_at = datetime('now') WHERE id = ?`,
            [status, added, JSON.stringify(errors), logId]
          );
          console.log(`\n========== 結果 ==========`);
          console.log(`  ✅ 新規登録: ${added}件`);
          console.log(`  ⏭️ スキップ（非AIツール）: ${skipped}件`);
          console.log(`  ❌ エラー: ${errors.length}件`);
          console.log(`  🏁 ステータス: ${status}（Geminiダウンのため早期終了）`);
          return;
        }
      }
    }

    // 最後に失敗IDリストを保存（全成功なら空になってクリア）
    await saveFailedProductHuntIds(db, failedIds);

    const status = errors.length === 0 ? 'success' : added > 0 ? 'partial' : 'error';
    await db.execute(
      `UPDATE scrape_logs SET status = ?, tools_added = ?, errors = ?, finished_at = datetime('now') WHERE id = ?`,
      [status, added, errors.length > 0 ? JSON.stringify(errors) : null, logId]
    );

    console.log(`\n========== 結果 ==========`);
    console.log(`  ✅ 新規登録: ${added}件`);
    console.log(`  ⏭️ スキップ（非AIツール）: ${skipped}件`);
    console.log(`  ❌ エラー: ${errors.length}件`);
    console.log(`  🏁 ステータス: ${status}`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 致命的エラー:', msg);
    // 致命的エラー時も失敗IDは保存しておく
    await saveFailedProductHuntIds(db, failedIds);
    await db.execute(
      `UPDATE scrape_logs SET status = 'error', errors = ?, finished_at = datetime('now') WHERE id = ?`,
      [JSON.stringify([msg]), logId]
    );
    process.exit(1);
  }
}

main();
