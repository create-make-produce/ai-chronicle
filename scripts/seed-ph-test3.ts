// =============================================
// AI Chronicle - PH Top 3 テスト（DBクリアなし）
// =============================================
// 実行: tsx scripts/seed-ph-test3.ts
// 注意: DBはクリアしません。テスト用（3件のみ）
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { fetchTopAIPosts, type ProductHuntPost } from '../src/lib/product-hunt';
import { fetchHtml, htmlToText, extractMeta, guessFaviconUrl, truncateForAI } from '../src/lib/scraper';
import { generateId } from '../src/lib/uuid';
import { slugify, slugifyFromUrl } from '../src/lib/slug';

// =====================
// 型定義
// =====================

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

interface TranslatedData {
  tagline_ja: string | null;
  description_ja: string | null;
  search_keywords: string;
}

// =====================
// カテゴリマップ（collect-new-tools.tsと完全一致）
// =====================

const CATEGORY_MAP: Record<string, string> = {
  'text-generation': 'text-generation', text: 'text-generation', writing: 'text-generation', chat: 'text-generation',
  'image-generation': 'image-generation', image: 'image-generation',
  'video-generation': 'video-generation', video: 'video-generation',
  coding: 'coding', code: 'coding', developer: 'coding',
  audio: 'audio', music: 'audio', voice: 'audio', speech: 'audio',
  'data-analysis': 'data-analysis', data: 'data-analysis', analytics: 'data-analysis',
  productivity: 'productivity', workflow: 'productivity', automation: 'productivity',
};

// =====================
// STEP 0: DB クリア
// =====================

async function clearDatabase(db: D1Client): Promise<void> {
  console.log('🗑️  DBクリア中（categoriesは保持）...');
  // FK参照順を考慮して削除
  const tables = [
    'tool_tags',
    'tool_note_articles',
    'tool_launches',
    'news',
    'pricing_plans',
    'scrape_logs',
    'contacts',
    'tags',
    'tools',
  ];
  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`);
      console.log(`  ✅ ${table} クリア`);
    } catch (e) {
      // テーブルが存在しない場合は無視
      console.log(`  ⏭️  ${table} スキップ（存在しないか空）`);
    }
  }
  console.log('✅ DBクリア完了\n');
}

// =====================
// ユーティリティ
// =====================

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/** "Claude by Anthropic" → "Claude" */
function cleanPHName(phName: string): string {
  return phName.replace(/\s+by\s+.+$/i, '').trim();
}

// =====================
// AI処理（collect-new-tools.tsと同一ロジック）
// =====================

async function extractToolData(
  post: ProductHuntPost,
  pageText: string | null
): Promise<ExtractedToolData> {
  const prompt = `以下のツール情報を分析してください。JSONのみ出力。

【Product Hunt情報】
- 名前: ${post.name}
- タグライン: ${post.tagline}
- 説明: ${post.description ?? '（なし）'}
- 公式サイト: ${post.website ?? '（不明）'}
- トピック: ${post.topics.map(t => t.name).join(', ')}

【公式サイトテキスト】
${pageText ? truncateForAI(pageText, 8000) : '（取得失敗）'}

AIツール定義：機械学習・LLM・画像生成AI・音声AI・コード補完AIを核心機能として使用するソフトウェア。

{"is_ai_tool":true/false,"tool_name":"製品名のみ（会社名は含めない・例: Claude by AnthropicならClaudeのみ）またはnull","tagline":"英語キャッチコピーまたはnull","description":"3文以内英語またはnull","company_name":"会社名またはnull","has_free_plan":true/false/null,"starting_price_usd":数値またはnull,"category_hint":"text-generation/image-generation/video-generation/coding/audio/data-analysis/productivity/other","tags":["タグ"],"has_api":true/false/null,"supported_languages":["en"]またはnull}`;

  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  return parseJsonResponse<ExtractedToolData>(sanitized);
}

async function translateToJapanese(
  phName: string,
  tagline: string | null,
  description: string | null
): Promise<TranslatedData> {
  // taglineもdescriptionもない場合は最小限の情報を返す
  if (!tagline && !description) {
    return {
      tagline_ja: null,
      description_ja: null,
      search_keywords: cleanPHName(phName),
    };
  }

  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。

【ツール名（Product Hunt正式名）】: ${phName}

【翻訳対象】
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}

tagline_jaルール：「[カテゴリ] [キャッチコピー]」形式、25文字以内、句読点なし
description_jaルール：最大4文、合計200文字以内、「。」を文末につけその直後に改行文字（\\nのみ・<br>禁止）を入れる、会社名・製品名・バージョン禁止
search_keywordsルール：製品名のみ（機能説明・会社名・バージョン番号は絶対に入れない）英語の製品名とカタカナ読みのみ 例: "Fathom,ファザム" / "Claude,クロード" / "ChatGPT,チャットGPT" / "Midjourney,ミッドジャーニー"

{"tagline_ja":"翻訳結果またはnull","description_ja":"翻訳結果またはnull","search_keywords":"keyword1,keyword2,..."}`;

  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  const result = parseJsonResponse<{
    tagline_ja: string | null;
    description_ja: string | null;
    search_keywords: string | null;
  }>(sanitized);

  return {
    tagline_ja: result.tagline_ja ?? null,
    description_ja: result.description_ja ?? null,
    search_keywords: result.search_keywords ?? cleanPHName(phName),
  };
}

// =====================
// ユーティリティ（collect-new-tools.tsと完全一致）
// =====================

function calculateConfidence(extracted: ExtractedToolData): number {
  let score = 0;
  if (extracted.tool_name) score += 20;
  if (extracted.starting_price_usd !== null || extracted.has_free_plan !== null) score += 20;
  if (extracted.description && extracted.description.length >= 100) score += 20;
  if (extracted.category_hint) score += 15;
  if (extracted.company_name) score += 15;
  if (extracted.supported_languages?.length) score += 10;
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
  let slug = base; let counter = 1;
  while (true) {
    const existing = await db.first<{ count: number }>('SELECT COUNT(*) AS count FROM tools WHERE slug = ?', [slug]);
    if (!existing || existing.count === 0) return slug;
    counter++; slug = `${base}-${counter}`;
    if (counter > 20) return `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
}

async function saveToolLaunch(
  db: D1Client,
  toolId: string,
  post: ProductHuntPost,
  taglineJa: string | null
): Promise<void> {
  try {
    const launchDate = (post as any).featuredAt
      ? String((post as any).featuredAt).substring(0, 10)
      : null;
    const url = post.website ?? post.url;
    await db.execute(
      `INSERT OR IGNORE INTO tool_launches
        (id, tool_id, launch_name, tagline, tagline_ja, launch_date, launch_number, thumbnail_url, url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        generateId('launch'), toolId, post.name,
        post.tagline ?? null, taglineJa,
        launchDate, null, post.thumbnail?.url ?? null, url,
      ]
    );
  } catch (error) {
    console.warn(`  ⚠️ ローンチ保存失敗: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// =====================
// 1ツール処理
// =====================

async function processTool(
  db: D1Client,
  post: ProductHuntPost,
  index: number,
  total: number
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  console.log(`\n[${index + 1}/${total}] 📦 ${post.name}  (votes: ${post.votesCount})`);

  try {
    // 公式サイト取得
    let pageText: string | null = null;
    let logoUrl: string | null = null;

    if (post.website) {
      try {
        const html = await fetchHtml(post.website);
        if (html) {
          pageText = htmlToText(html);
          // ロゴはGoogleファビコンサービス優先（og:imageはバナー画像のことが多い）
          logoUrl = guessFaviconUrl(post.website);
        }
      } catch {
        logoUrl = null;
      }
    }

    // Gemini: 情報抽出
    await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
    const extracted = await extractToolData(post, pageText);

    if (!extracted.is_ai_tool) {
      console.log(`  ⏭️ スキップ: AIツール非該当`);
      return { success: true, skipped: true };
    }

    // Gemini: 翻訳 + search_keywords生成
    await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
    const translated = await translateToJapanese(
      post.name,
      extracted.tagline ?? post.tagline,
      extracted.description ?? post.description
    );

    const confidence = calculateConfidence(extracted);
    const categoryId = await resolveCategoryId(db, extracted.category_hint);

    // name_en = 製品名のみ（会社名なし）
    const nameEn = extracted.tool_name ?? cleanPHName(post.name);
    const nameJa = nameEn;
    const slug = await generateUniqueSlug(db, nameEn, post.website);
    const toolId = generateId('tool');

    const officialUrl = post.website ?? null;
    const hasOfficialUrl = !!officialUrl;
    const confidenceOk = confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH;
    const isPublished = hasOfficialUrl && confidenceOk ? 1 : 0;

    if (!hasOfficialUrl) console.log(`  ⚠️ 公式URLなし → 非公開`);

    // tools INSERT（ph_name・search_keywordsあり）
    await db.execute(
      `INSERT INTO tools (
        id, slug, name_ja, name_en, ph_name, search_keywords,
        tagline_ja, tagline_en,
        description_ja, description_en,
        official_url, logo_url, company_name, category_id,
        status, is_published,
        has_api, has_free_plan,
        product_hunt_id, product_hunt_url,
        ai_confidence_score, needs_manual_review,
        data_source, source_url,
        language_support, ios_url, android_url,
        last_scraped_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        'active', ?,
        ?, ?,
        ?, ?,
        ?, ?,
        'product_hunt_api', ?,
        ?, ?, ?,
        datetime('now'), datetime('now'), datetime('now')
      )`,
      [
        toolId, slug, nameJa, nameEn, post.name, translated.search_keywords,
        translated.tagline_ja, extracted.tagline ?? post.tagline,
        translated.description_ja, extracted.description ?? post.description,
        officialUrl, logoUrl, extracted.company_name ?? null, categoryId,
        isPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.id, post.url,
        confidence, isPublished ? 0 : 1,
        post.url,
        extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
        post.ios_url ?? null,
        post.android_url ?? null,
      ]
    );

    // ローンチ保存（tagline_jaは翻訳済みを流用）
    await saveToolLaunch(db, toolId, post, translated.tagline_ja);

    console.log(`  ✅ 登録: ${slug}（${isPublished ? '公開' : '非公開'}）confidence=${Math.round(confidence * 100)}%`);
    console.log(`  🔑 keywords: ${translated.search_keywords}`);

    return { success: true };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ 失敗: ${msg}`);
    return { success: false, error: msg };
  }
}

// =====================
// main
// =====================

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  AI Chronicle - PH Top 3 テスト      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('⚠️  categories以外のDBデータを全削除します（3件のみ登録）\n');

  const db = D1Client.fromEnv();

  // STEP 0: DBクリア（本番と同じ）
  await clearDatabase(db);

  // STEP 1: PH Top 3取得
  console.log('📡 Product Hunt AI Top 3 取得中...');
  let posts: ProductHuntPost[];
  try {
    posts = await fetchTopAIPosts(3);
  } catch (e) {
    console.error('❌ PH API取得失敗:', e);
    process.exit(1);
  }
  console.log(`  → ${posts.length}件取得\n`);

  if (posts.length === 0) {
    console.error('❌ 投稿が0件でした。PH APIキーを確認してください');
    process.exit(1);
  }

  // STEP 2: 各ツール処理
  let added = 0, skipped = 0, errorCount = 0;
  let consecutiveFailures = 0;
  const ABORT_THRESHOLD = 3;

  for (let i = 0; i < posts.length; i++) {
    const result = await processTool(db, posts[i], i, posts.length);

    if (result.skipped) {
      skipped++;
      consecutiveFailures = 0;
    } else if (result.success) {
      added++;
      consecutiveFailures = 0;
    } else {
      errorCount++;
      consecutiveFailures++;
      if (consecutiveFailures >= ABORT_THRESHOLD) {
        console.error(`\n⛔ エラーが${ABORT_THRESHOLD}件連続 → 処理中断（Geminiダウンの可能性）`);
        break;
      }
    }
  }

  // STEP 3: 完了サマリー
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  完了                                ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`  ✅ 登録成功: ${added}件`);
  console.log(`  ⏭️  スキップ: ${skipped}件（AI非該当）`);
  console.log(`  ❌ エラー:   ${errorCount}件`);
  console.log('\n✅ テスト完了。問題なければ seed-ph-top100.ts を実行してください（DBクリアあり）');
}

main().catch(e => {
  console.error('🔥 致命的エラー:', e);
  process.exit(1);
});
