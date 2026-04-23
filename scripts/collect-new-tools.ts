// =============================================
// AI Chronicle - ジョブA+B
// 新着ツール発見 + AIによるデータ構造化
// =============================================
// 実行: tsx scripts/collect-new-tools.ts
// GitHub Actions: 毎日UTC 02:00
// =============================================

// .env.local を明示的に読み込む（Next.js準拠）
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else {
  loadEnv(); // フォールバック：.env を読む（GitHub Actionsでは環境変数で直接渡される）
}

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { fetchLatestAIPosts, type ProductHuntPost } from '../src/lib/product-hunt';
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

// ----------------------------------------
// AI抽出データの型
// ----------------------------------------
interface ExtractedToolData {
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

// カテゴリ正規化用：AIが返すヒント → D1のカテゴリslug
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

// ----------------------------------------
// 1. Product Huntから新着取得
// ----------------------------------------
async function discoverNewTools(db: D1Client): Promise<ProductHuntPost[]> {
  console.log('🔍 Product Huntから新着AIツールを取得中...');
  const posts = await fetchLatestAIPosts();
  console.log(`  → ${posts.length}件のAI関連投稿を検出`);

  // 既存ツールと重複チェック（product_hunt_idで照合）
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

// ----------------------------------------
// 2. AIによるデータ抽出
// ----------------------------------------
async function extractToolData(
  post: ProductHuntPost,
  pageText: string | null
): Promise<ExtractedToolData> {
  const prompt = `以下のAIツールの情報を抽出してください。存在しない情報はnullとしてください。
JSONのみを出力し、マークダウンや説明文は出力しないでください。

【Product Hunt情報】
- 名前: ${post.name}
- タグライン: ${post.tagline}
- 説明: ${post.description ?? '（なし）'}
- 公式サイト: ${post.website ?? '（不明）'}
- トピック: ${post.topics.map((t) => t.name).join(', ')}

【公式サイトのテキスト（抜粋）】
${pageText ? truncateForAI(pageText, 8000) : '（取得失敗）'}

【抽出項目】
以下のJSONフォーマットで回答してください：

{
  "tool_name": "ツール名（正式名称）",
  "tagline": "1行のキャッチコピー（英語）",
  "description": "3文以内の機能説明（英語）",
  "company_name": "開発会社名またはnull",
  "has_free_plan": true/false/null,
  "starting_price_usd": 最安の有料プラン月額USD価格の数値またはnull,
  "category_hint": "text-generation / image-generation / video-generation / coding / audio / data-analysis / productivity / other のいずれか",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "has_api": true/false/null,
  "supported_languages": ["en", "ja"] のような言語コード配列またはnull
}`;

  const raw = await callAI(prompt);
  return parseJsonResponse<ExtractedToolData>(raw);
}

// ----------------------------------------
// 3. 日本語翻訳（tagline/description）
// ----------------------------------------
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

【出力形式】
{
  "tagline_ja": "日本語訳（1行・30文字以内・キャッチコピー調）",
  "description_ja": "日本語訳（2〜3文・自然な説明調）"
}

翻訳対象がnullまたは空の場合は対応する出力値もnullにしてください。`;

  const raw = await callAI(prompt);
  return parseJsonResponse<{
    tagline_ja: string | null;
    description_ja: string | null;
  }>(raw);
}

// ----------------------------------------
// 4. 確信度スコア計算
// ----------------------------------------
function calculateConfidence(extracted: ExtractedToolData): number {
  let score = 0;
  if (extracted.tool_name) score += 20;
  if (extracted.starting_price_usd !== null || extracted.has_free_plan !== null)
    score += 20;
  if (extracted.description && extracted.description.length >= 100) score += 20;
  if (extracted.category_hint) score += 15;
  if (extracted.company_name) score += 15;
  if (extracted.supported_languages && extracted.supported_languages.length > 0)
    score += 10;
  return score / 100;
}

// ----------------------------------------
// 5. カテゴリID解決
// ----------------------------------------
async function resolveCategoryId(
  db: D1Client,
  hint: string | null
): Promise<string | null> {
  const normalized = hint
    ? CATEGORY_MAP[hint.toLowerCase().trim()] ?? 'other'
    : 'other';
  const cat = await db.first<{ id: string }>(
    'SELECT id FROM categories WHERE slug = ?',
    [normalized]
  );
  return cat?.id ?? null;
}

// ----------------------------------------
// 6. スラッグ生成（重複回避）
// ----------------------------------------
async function generateUniqueSlug(
  db: D1Client,
  baseText: string,
  fallbackUrl: string | null
): Promise<string> {
  let base = slugify(baseText);
  if (!base && fallbackUrl) {
    base = slugifyFromUrl(fallbackUrl);
  }
  if (!base) {
    base = 'tool';
  }

  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await db.first<{ count: number }>(
      'SELECT COUNT(*) AS count FROM tools WHERE slug = ?',
      [slug]
    );
    if (!existing || existing.count === 0) return slug;
    counter++;
    slug = `${base}-${counter}`;
    if (counter > 20) {
      return `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }
}

// ----------------------------------------
// 7. ツールを1件処理
// ----------------------------------------
async function processSingleTool(
  db: D1Client,
  post: ProductHuntPost
): Promise<{ success: boolean; toolId?: string; error?: string }> {
  try {
    console.log(`\n📦 処理中: ${post.name}`);

    // --- 公式サイトのHTMLを取得（失敗してもPH情報だけで続行） ---
    let pageText: string | null = null;
    let metaInfo: { title: string | null; description: string | null; ogImage: string | null } = {
      title: null,
      description: null,
      ogImage: null,
    };
    let logoUrl: string | null = null;

    if (post.website) {
      try {
        const html = await fetchHtml(post.website);
        pageText = htmlToText(html);
        metaInfo = extractMeta(html);
        logoUrl = metaInfo.ogImage ?? guessFaviconUrl(post.website);
      } catch (error) {
        console.warn(
          `  ⚠️ 公式サイト取得失敗: ${error instanceof Error ? error.message : String(error)}`
        );
        logoUrl = post.thumbnail?.url ?? null;
      }
    } else {
      logoUrl = post.thumbnail?.url ?? null;
    }

    // --- AI抽出 ---
    const extracted = await extractToolData(post, pageText);
    const confidence = calculateConfidence(extracted);
    console.log(`  ✓ AI抽出完了（確信度: ${(confidence * 100).toFixed(0)}%）`);

    // --- 日本語翻訳 ---
    const translated = await translateToJapanese(
      extracted.tagline ?? post.tagline,
      extracted.description ?? post.description
    );
    console.log(`  ✓ 翻訳完了`);

    // --- カテゴリ解決 ---
    const categoryId = await resolveCategoryId(db, extracted.category_hint);

    // --- スラッグ生成 ---
    const slug = await generateUniqueSlug(
      db,
      extracted.tool_name ?? post.name,
      post.website
    );

    // --- tools挿入 ---
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
        toolId,
        slug,
        extracted.tool_name ?? post.name,
        extracted.tool_name ?? post.name,
        translated.tagline_ja,
        extracted.tagline ?? post.tagline,
        translated.description_ja,
        extracted.description ?? post.description,
        post.website,
        logoUrl,
        extracted.company_name,
        categoryId,
        isPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.id,
        post.url,
        confidence,
        needsReview,
        post.url,
        extracted.supported_languages
          ? JSON.stringify(extracted.supported_languages)
          : null,
      ]
    );

    // --- 価格プラン（最安有料プランがあれば1件だけ登録） ---
    if (extracted.starting_price_usd !== null && extracted.starting_price_usd > 0) {
      await db.execute(
        `INSERT INTO pricing_plans (
          id, tool_id, plan_name, is_free, price_usd, billing_cycle, price_source_url
        ) VALUES (?, ?, 'Pro', 0, ?, 'monthly', ?)`,
        [
          generateId('plan'),
          toolId,
          extracted.starting_price_usd,
          post.website,
        ]
      );
    }
    if (extracted.has_free_plan === true) {
      await db.execute(
        `INSERT INTO pricing_plans (
          id, tool_id, plan_name, is_free, price_usd, billing_cycle
        ) VALUES (?, ?, 'Free', 1, 0, 'monthly')`,
        [generateId('plan'), toolId]
      );
    }

    console.log(
      `  ✅ 登録完了: ${slug}${isPublished ? '（公開）' : '（レビュー待ち）'}`
    );

    // --- ニュース生成（公開時のみ） ---
    if (isPublished) {
      const category = categoryId
        ? await db.first<{ name_ja: string }>(
            'SELECT name_ja FROM categories WHERE id = ?',
            [categoryId]
          )
        : null;

      await createNews(db, {
        type: 'new_tool',
        tool: {
          id: toolId,
          slug,
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

// ----------------------------------------
// メイン処理
// ----------------------------------------
async function main() {
  console.log('🚀 AI Chronicle - 新着ツール収集ジョブ開始');
  console.log(`   設定: MAX_NEW_TOOLS_PER_RUN = ${CONFIG.MAX_NEW_TOOLS_PER_RUN}`);
  console.log(`   AI プロバイダー: ${CONFIG.AI_PROVIDER} (${CONFIG.AI_MODEL})`);

  const startedAt = new Date().toISOString();
  const db = D1Client.fromEnv();
  const logId = generateId('log');

  // scrape_logsに開始ログ
  await db.execute(
    `INSERT INTO scrape_logs (id, job_name, status, started_at)
     VALUES (?, 'collect_new_tools', 'running', ?)`,
    [logId, startedAt]
  );

  let added = 0;
  const errors: string[] = [];

  try {
    const newPosts = await discoverNewTools(db);
    if (newPosts.length === 0) {
      console.log('\n✨ 新規ツールはありませんでした');
    }

    for (const post of newPosts) {
      const result = await processSingleTool(db, post);
      if (result.success) {
        added++;
      } else {
        errors.push(`${post.name}: ${result.error ?? 'unknown'}`);
      }
    }

    const status =
      errors.length === 0 ? 'success' : added > 0 ? 'partial' : 'error';

    await db.execute(
      `UPDATE scrape_logs SET
         status = ?, tools_added = ?, errors = ?, finished_at = datetime('now')
       WHERE id = ?`,
      [status, added, errors.length > 0 ? JSON.stringify(errors) : null, logId]
    );

    console.log(`\n========== 結果 ==========`);
    console.log(`  ✅ 新規登録: ${added}件`);
    console.log(`  ❌ エラー: ${errors.length}件`);
    console.log(`  🏁 ステータス: ${status}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 致命的エラー:', msg);
    await db.execute(
      `UPDATE scrape_logs SET
         status = 'error', errors = ?, finished_at = datetime('now')
       WHERE id = ?`,
      [JSON.stringify([msg]), logId]
    );
    process.exit(1);
  }
}

main();
