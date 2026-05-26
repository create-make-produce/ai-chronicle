// =============================================
// AI Chronicle - PH Top 100 AIツール シード
// =============================================
// 実行: tsx scripts/seed-ph-top100.ts
// 注意: categoriesテーブル以外のデータを全削除してから登録します
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { judgePublish } from '../src/lib/tool-publish';
import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { translateToJapanese } from '../src/lib/translate';
import { fetchTopAIPosts, type ProductHuntPost } from '../src/lib/product-hunt';
import { fetchHtml, htmlToText, extractFaviconUrl, truncateForAI } from '../src/lib/scraper';
import { generateId } from '../src/lib/uuid';
import { slugify, slugifyFromUrl } from '../src/lib/slug';
import puppeteer, { type Browser } from 'puppeteer';

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

// TranslatedData型はsrc/lib/translate.tsのTranslatedToolDataを使用

// =====================
// カテゴリマップ（collect-new-tools.tsと完全一致）
// =====================

const CATEGORY_MAP: Record<string, string> = {
  'text-generation': 'text-generation', text: 'text-generation', writing: 'text-generation', chat: 'text-generation',
  'image-generation': 'image-generation', image: 'image-generation',
  'video-generation': 'image-generation', video: 'image-generation',
  coding: 'coding', code: 'coding', developer: 'coding',
  audio: 'audio', music: 'audio', voice: 'audio', speech: 'audio',
  'data-analysis': 'research', data: 'research', analytics: 'research', analysis: 'research',
  productivity: 'productivity', workflow: 'productivity', automation: 'productivity',
  research: 'research',
  marketing: 'marketing', seo: 'marketing', advertising: 'marketing', social: 'marketing',
  agent: 'productivity', autonomous: 'productivity', workflow_ai: 'productivity',
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

/**
 * PuppeteerでPH製品ページからApp Store/Play StoreのPHリダイレクトURLを取得
 */
async function fetchAppLinksWithPuppeteer(
  browser: Browser,
  postUrl: string
): Promise<{ ios_url: string | null; android_url: string | null }> {
  const empty = { ios_url: null, android_url: null };
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // 投稿ページから製品ページURLを探す
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const productUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      const link = links.find(a => (a as HTMLAnchorElement).href.match(/producthunt\.com\/products\/[^/?#]+$/));
      return link ? (link as HTMLAnchorElement).href : null;
    });

    if (!productUrl) return empty;

    // 製品ページを開いてApp Store/Play StoreのhrefをDOM取得
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const appLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="producthunt.com/r/"]'));
      let ios_url: string | null = null;
      let android_url: string | null = null;
      for (const a of anchors) {
        const text = a.textContent ?? '';
        const href = (a as HTMLAnchorElement).href;
        if (!ios_url && text.includes('App Store')) ios_url = href;
        if (!android_url && text.includes('Play Store')) android_url = href;
      }
      return { ios_url, android_url };
    });

    return appLinks;
  } catch (e) {
    return empty;
  } finally {
    if (page) await page.close();
  }
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
以下は is_ai_tool: false とすること：PyTorch/TensorFlowなどのMLフレームワーク・ライブラリ、TPU/GPU/NPUなどのハードウェア・チップ、開発者専用SDK・API単体（UIなし）、学術論文・データセット・ベンチマーク、企業向けクラウドプラットフォーム・管理コンソール機能・インフラサービス。

【カテゴリ判定ルール（上から順に判定し、最初に該当したものを選ぶ）】
1. image-generation: 画像生成・動画生成・動画編集・映像変換・字幕・SNS動画作成が主機能 → 迷わずimage-generation
2. audio: 音声生成・音楽生成・文字起こし・声クローン・ポッドキャストが主機能 → audio
3. coding: コード生成・補完・デバッグ・テスト・開発支援が主機能 → coding
4. text-generation: テキスト生成・ライティング・翻訳・要約・チャットが主機能 → text-generation
5. productivity: 業務効率化・タスク管理・会議要約・メール自動化・ワークフロー・カスタマーサポート自動化・スケジュール管理
6. research: Web検索・情報収集・リサーチ・データ分析・表データ解析・グラフ化・売上分析・予測分析・要約が主目的
7. marketing: SNS投稿作成・広告コピー生成・SEO記事・メールマーケティング・LP改善・集客・販売促進が主目的。文章生成が手段でも目的がマーケティングならここ
8. other: 明らかにAIツールだが上記いずれにも当てはまらない場合のみ

{"is_ai_tool":true/false,"tool_name":"製品名のみ（会社名は含めない・例: Claude by AnthropicならClaudeのみ）またはnull","tagline":"英語キャッチコピーまたはnull","description":"3文以内英語またはnull","company_name":"会社名またはnull","has_free_plan":true/false/null,"starting_price_usd":数値またはnull,"category_hint":"text-generation（テキスト生成・ライティング・翻訳・要約・チャットボット・文章校正）/image-generation（画像・動画・映像の生成・編集・変換・字幕生成・SNS動画作成）/audio（音声生成・音楽生成・文字起こし・声のクローン・ポッドキャスト編集）/coding（コード生成・補完・レビュー・デバッグ・テスト自動化・開発支援）/productivity（業務効率化・タスク管理・会議要約・メール自動化・ワークフロー・スケジュール管理）/research（情報収集・Web検索・リサーチ・データ分析・グラフ化・売上分析・予測分析・要約）/marketing（SNS投稿・広告コピー・SEO記事・メールマーケティング・LP改善・集客・販売促進）/other（上記いずれにも明確に当てはまらない場合のみ）","tags":["タグ"],"has_api":true/false/null,"supported_languages":["en"]またはnull}`;

  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  return parseJsonResponse<ExtractedToolData>(sanitized);
}


function sanitizeStoreUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.includes('producthunt.com')) return null;
  if (url.includes('apps.apple.com')) return url.replace('/us/', '/jp/');
  if (url.includes('play.google.com')) {
    if (url.includes('hl=')) return url.replace(/hl=[a-z]+/, 'hl=ja');
    return url + (url.includes('?') ? '&' : '?') + 'hl=ja';
  }
  return url;
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


// =====================
// 1ツール処理
// =====================

async function processTool(
  db: D1Client,
  post: ProductHuntPost,
  index: number,
  total: number,
  browser: Browser
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  console.log(`\n[${index + 1}/${total}] 📦 ${post.name}  (votes: ${post.votesCount})`);

  try {
    // 重複チェック（再実行時のスキップ）
    const checkId = post.product_id ?? post.id;
    const dup = await db.first<{ count: number }>(
      `SELECT COUNT(*) AS count FROM tools WHERE product_hunt_id = ?`, [checkId]
    );
    if (dup && dup.count > 0) {
      console.log(`  ⏭️ スキップ: 登録済み`);
      return { success: true, skipped: true };
    }

    // name_en 大文字小文字無視で重複チェック
    const dupByName = await db.first<{ count: number }>(
      `SELECT COUNT(*) AS count FROM tools WHERE LOWER(name_en) = LOWER(?)`, [post.name]
    );
    if (dupByName && dupByName.count > 0) {
      console.log(`  ⏭️ スキップ: 同名ツール登録済み（${post.name}）`);
      return { success: true, skipped: true };
    }

    // 公式サイト取得
    let pageText: string | null = null;
    let logoUrl: string | null = null;

    if (post.website) {
      try {
        const html = await fetchHtml(post.website);
        if (html) {
          pageText = htmlToText(html);
          // 公式サイトのHTMLからファビコンを直接取得
          logoUrl = extractFaviconUrl(html, post.website);
        }
      } catch {
        logoUrl = null; // fetchは失敗でも後でGoogleファビコンをセット
      }
    }

    // fetchが失敗してもGoogleファビコンは生成可能
    if (!logoUrl && post.website) {
      try {
        const u = new URL(post.website);
        logoUrl = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`;
      } catch { /* ignore */ }
    }

    // ChatGPT GPTs・カスタムGPTはスキップ
    if (post.website?.includes('chatgpt.com/g/')) {
      console.log(`  ⏭️ スキップ: ChatGPT GPTs（${post.name}）`);
      return { success: true, skipped: true };
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

    // App Store/Google Play URL取得コメントアウト中
    const iosUrl = null;
    const androidUrl = null;

    const officialUrl = post.website ?? null;
    const hasOfficialUrl = !!officialUrl;
    const confidenceOk = confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH;
    const { isPublished, unpublishCondition, reasons } = judgePublish({ officialUrl, confidenceOk: confidenceOk, logoUrl });
    if (isGithubOnly) console.log(`  ⚠ GitHub URLのため非公開: ${slug}`);
    if (!hasLogo) console.log(`  ⚠ ロゴなしのため非公開: ${slug}`);

    if (!hasOfficialUrl) console.log(`  ⚠️ 公式URLなし → 非公開`);

    const hasAppUrl = !!(iosUrl ?? androidUrl);
    
    const toolStatus = (hasAppUrl && !unpublishCondition) ? 'pending' : 'active';
    if (reasons.length > 0) console.log(`  ⚠ 非公開理由: ${reasons.join(', ')}`);
    const finalPublished = toolStatus === 'pending' ? 0 : isPublished;
    if (hasAppUrl && !unpublishCondition) console.log(`  ⚠ App URL検出のため保留: ${slug}`);

    // tools INSERT（ph_name・ph_slug・search_keywordsあり）
    await db.execute(
      `INSERT INTO tools (
        id, slug, name_ja, name_en, ph_name, ph_slug, search_keywords,
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
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        'product_hunt_api', ?,
        ?, ?, ?,
        datetime('now'), datetime('now'), datetime('now')
      )`,
      [
        toolId, slug, nameJa, nameEn,
        post.name,                          // ph_name（PH正式名）
        post.product_slug ?? null,          // ph_slug（製品照合キー）
        translated.search_keywords,
        translated.tagline_ja, extracted.tagline ?? post.tagline,
        translated.description_ja, extracted.description ?? post.description,
        officialUrl, logoUrl, extracted.company_name ?? null, categoryId,
        toolStatus, finalPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.product_id ?? post.id,
        post.product_url ?? post.url,
        confidence, finalPublished ? 0 : 1,
        post.url,
        extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
        iosUrl,
        androidUrl,
      ]
    );


    console.log(`  ✅ 登録: ${slug}（${finalPublished ? '公開' : hasAppUrl ? '保留' : '非公開'}）confidence=${Math.round(confidence * 100)}%`);
    console.log(`  🔑 keywords: ${translated.search_keywords}`);

    // 同じ会社名の既存ツールと関連AIツール登録
    if (extracted.company_name) {
      const sameCompany = await db.query<{ id: string; name_en: string }>(
        `SELECT id, name_en FROM tools WHERE company_name = ? AND id != ? LIMIT 20`,
        [extracted.company_name, toolId]
      );
      if (sameCompany.length > 0) {
        await db.execute(
          `UPDATE tools SET status = 'pending', is_published = 0 WHERE id = ?`,
          [toolId]
        );
        console.log(`  ⚠ 同会社ツール検出のため保留に変更: ${extracted.company_name}`);
      }
      for (const related of sameCompany) {
        await db.execute(
          `INSERT OR IGNORE INTO tool_relations (id, tool_id_a, tool_id_b, created_at) VALUES (?, ?, ?, datetime('now'))`,
          [generateId('rel'), toolId, related.id]
        );
        await db.execute(
          `INSERT OR IGNORE INTO tool_relations (id, tool_id_a, tool_id_b, created_at) VALUES (?, ?, ?, datetime('now'))`,
          [generateId('rel'), related.id, toolId]
        );
        console.log(`  🔗 関連AI登録: ${related.name_en}（同会社）`);
      }
    }

    return { success: true };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ 失敗: ${msg}`);
    // 429はRPD上限のため呼び出し元でthrow（即中断）
    if (msg.includes('429')) throw error;
    return { success: false, error: msg };
  }
}

// =====================
// main
// =====================

async function main() {
  const COUNT = parseInt(process.argv[2] ?? '300', 10);
  if (isNaN(COUNT) || COUNT < 1) {
    console.error('❌ 件数は正の整数で指定してください（例: npx tsx scripts/seed-ph-top100.ts 300）');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════╗');
  console.log(`║  AI Chronicle - PH Top ${String(COUNT).padEnd(3)} シード   ║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('ℹ️  DBクリアは事前に手動で実行してください\n');

  const db = D1Client.fromEnv();

  // Puppeteerブラウザ起動（全ツールで共有）
  console.log('🌐 Puppeteer起動中...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  // STEP 1: PH Top N取得
  console.log(`📡 Product Hunt AI Top ${COUNT} 取得中...`);
  let posts: ProductHuntPost[];
  try {
    posts = await fetchTopAIPosts(COUNT);
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
    let result: { success: boolean; skipped?: boolean; error?: string };
    try {
      result = await processTool(db, posts[i], i, posts.length, browser);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('429')) {
        console.error('\n⛔ Gemini RPD上限（429）→ 処理中断');
        break;
      }
      result = { success: false, error: msg };
    }

    if (result.skipped) {
      skipped++;
      consecutiveFailures = 0;
    } else if (result.success) {
      added++;
      consecutiveFailures = 0;
    } else {
      errorCount++;
      // 503（一時的な混雑）はカウントせず次のツールへ
      const is503 = result.error?.includes('503');
      if (!is503) {
        consecutiveFailures++;
        if (consecutiveFailures >= ABORT_THRESHOLD) {
          console.error(`\n⛔ エラーが${ABORT_THRESHOLD}件連続 → 処理中断`);
          break;
        }
      } else {
        console.warn('  ⚠️ 503（混雑）→ 次のツールへスキップ');
      }
    }
  }

  await browser.close();

  // STEP 3: 完了サマリー
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  完了                                ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`  ✅ 登録成功: ${added}件`);
  console.log(`  ⏭️  スキップ: ${skipped}件（AI非該当）`);
  console.log(`  ❌ エラー:   ${errorCount}件`);
  console.log('\n次のステップ: GitHub Actions (collect-new-tools) を再開してください');
}

main().catch(e => {
  console.error('🔥 致命的エラー:', e);
  process.exit(1);
});
