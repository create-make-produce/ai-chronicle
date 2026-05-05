// =============================================
// AI Chronicle - PH製品URL指定シード
// =============================================
// 使い方: npx tsx scripts/seed-ph-product.ts [PH製品URL] ...
// 例: npx tsx scripts/seed-ph-product.ts https://www.producthunt.com/products/chatgpt
// ローカル専用・.gitignore済み
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { fetchHtml, htmlToText, extractFaviconUrl, truncateForAI } from '../src/lib/scraper';
import { generateId } from '../src/lib/uuid';
import { slugify, slugifyFromUrl } from '../src/lib/slug';

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
  'text-generation': 'text-generation', text: 'text-generation', writing: 'text-generation', chat: 'text-generation',
  'image-generation': 'image-generation', image: 'image-generation',
  'video-generation': 'video-generation', video: 'video-generation',
  coding: 'coding', code: 'coding', developer: 'coding',
  audio: 'audio', music: 'audio', voice: 'audio', speech: 'audio',
  'data-analysis': 'data-analysis', data: 'data-analysis', analytics: 'data-analysis',
  productivity: 'productivity', workflow: 'productivity', automation: 'productivity',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function cleanPHName(name: string) { return name.replace(/\s+by\s+.+$/i, '').trim(); }

// =====================
// PH製品ページからHTMLで情報取得
// =====================
interface PHProductInfo {
  name: string;
  tagline: string;
  description: string | null;
  websiteUrl: string | null;
  postId: string | null;
}

async function fetchProductInfoFromHtml(productUrl: string): Promise<PHProductInfo | null> {
  try {
    const res = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    if (!res.ok) { console.error(`  ❌ PH製品ページ取得失敗 (${res.status})`); return null; }
    const html = await res.text();

    // JSON-LDまたはmeta情報から取得
    const nameMatch = html.match(/"name":"([^"]+)"/)
      ?? html.match(/<meta property="og:title" content="([^"]+)"/);
    const taglineMatch = html.match(/"tagline":"([^"]+)"/)
      ?? html.match(/<meta property="og:description" content="([^"]+)"/);
    const websiteMatch = html.match(/"websiteUrl":"(https?:\/\/[^"]+)"/);
    const postIdMatch = html.match(/"postId":(\d+)/);
    const descMatch = html.match(/"description":"((?:[^"\\]|\\.)*)"/);

    const name = nameMatch?.[1]?.replace(/\\u[\dA-F]{4}/gi, c => String.fromCharCode(parseInt(c.slice(2), 16))) ?? null;
    const tagline = taglineMatch?.[1] ?? null;

    if (!name || !tagline) {
      console.error('  ❌ 製品名・タグラインが取得できませんでした');
      return null;
    }

    return {
      name,
      tagline,
      description: descMatch?.[1] ?? null,
      websiteUrl: websiteMatch?.[1] ?? null,
      postId: postIdMatch?.[1] ?? null,
    };
  } catch (e) {
    console.error(`  ❌ HTML取得エラー: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

// =====================
// AI処理
// =====================
async function extractToolData(name: string, tagline: string, description: string | null, websiteUrl: string | null, pageText: string | null): Promise<ExtractedToolData> {
  const prompt = `以下のツール情報を分析してください。JSONのみ出力。
【情報】
- 名前: ${name}
- タグライン: ${tagline}
- 説明: ${description ?? '（なし）'}
- 公式サイト: ${websiteUrl ?? '（不明）'}
AIツール定義：機械学習・LLM・画像生成AI・音声AI・コード補完AIを核心機能として使用するソフトウェア。
【公式サイトテキスト】
${pageText ? truncateForAI(pageText, 8000) : '（取得失敗）'}
{"is_ai_tool":true/false,"tool_name":"製品名のみまたはnull","tagline":"英語キャッチコピーまたはnull","description":"3文以内英語またはnull","company_name":"会社名またはnull","has_free_plan":true/false/null,"starting_price_usd":数値またはnull,"category_hint":"text-generation/image-generation/video-generation/coding/audio/data-analysis/productivity/other","tags":["タグ"],"has_api":true/false/null,"supported_languages":["en"]またはnull}`;
  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, m => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  return parseJsonResponse<ExtractedToolData>(sanitized);
}

async function translateToJapanese(phName: string, tagline: string | null, description: string | null) {
  if (!tagline && !description) return { tagline_ja: null, description_ja: null, search_keywords: cleanPHName(phName) };
  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。
【ツール名】: ${phName}
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}
tagline_jaルール：「[カテゴリ] [キャッチコピー]」形式、25文字以内、句読点なし
description_jaルール：最大4文、合計200文字以内、「。」を文末につけその直後に改行（\\n）
search_keywordsルール：製品名とカタカナ読みのみ 例: "ChatGPT,チャットGPT" / "Claude,クロード"
{"tagline_ja":"翻訳結果またはnull","description_ja":"翻訳結果またはnull","search_keywords":"keyword1,keyword2,..."}`;
  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, m => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  const result = parseJsonResponse<{ tagline_ja: string | null; description_ja: string | null; search_keywords: string | null }>(sanitized);
  return {
    tagline_ja: result.tagline_ja ?? null,
    description_ja: result.description_ja ?? null,
    search_keywords: result.search_keywords ?? cleanPHName(phName),
  };
}

function calculateConfidence(e: ExtractedToolData): number {
  let score = 0;
  if (e.tool_name) score += 20;
  if (e.starting_price_usd !== null || e.has_free_plan !== null) score += 20;
  if (e.description && e.description.length >= 100) score += 20;
  if (e.category_hint) score += 15;
  if (e.company_name) score += 15;
  if (e.supported_languages?.length) score += 10;
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
// 1製品処理
// =====================
async function processProductUrl(db: D1Client, productUrl: string): Promise<void> {
  const slugMatch = productUrl.match(/\/products\/([^/?#]+)/);
  if (!slugMatch) { console.error(`❌ 製品URLが不正: ${productUrl}`); return; }
  const productSlug = slugMatch[1];
  console.log(`\n📦 処理中: ${productSlug}`);

  // 重複チェック
  const dup = await db.first<{ count: number }>(`SELECT COUNT(*) AS count FROM tools WHERE ph_slug = ?`, [productSlug]);
  if (dup && dup.count > 0) { console.log(`  ⏭️ スキップ: "${productSlug}" は登録済み`); return; }

  // PH製品ページからHTML取得
  const product = await fetchProductInfoFromHtml(productUrl);
  if (!product) return;
  console.log(`  📋 ${product.name}: ${product.tagline}`);
  console.log(`  🌐 websiteUrl: ${product.websiteUrl ?? 'なし'}`);

  const officialUrl = product.websiteUrl ?? null;

  // 公式サイト取得
  let pageText: string | null = null;
  let logoUrl: string | null = null;
  if (officialUrl) {
    try {
      const html = await fetchHtml(officialUrl);
      if (html) { pageText = htmlToText(html); logoUrl = extractFaviconUrl(html, officialUrl); }
    } catch { /* 403等は無視 */ }
  }

  // Gemini処理
  await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
  const extracted = await extractToolData(product.name, product.tagline, product.description, officialUrl, pageText);

  await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
  const translated = await translateToJapanese(product.name, extracted.tagline ?? product.tagline, extracted.description ?? product.description);

  const confidence = calculateConfidence(extracted);
  const categoryId = await resolveCategoryId(db, extracted.category_hint);
  const nameEn = extracted.tool_name ?? cleanPHName(product.name);
  const slug = await generateUniqueSlug(db, nameEn, officialUrl);
  const toolId = generateId('tool');
  const isPublished = officialUrl && confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH ? 1 : 0;

  await db.execute(
    `INSERT INTO tools (
      id, slug, name_ja, name_en, ph_name, ph_slug, search_keywords,
      tagline_ja, tagline_en, description_ja, description_en,
      official_url, logo_url, company_name, category_id,
      status, is_published, has_api, has_free_plan,
      product_hunt_id, product_hunt_url,
      ai_confidence_score, needs_manual_review,
      data_source, language_support,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      'active', ?, ?, ?,
      ?, ?,
      ?, ?,
      'product_hunt_api', ?,
      datetime('now'), datetime('now')
    )`,
    [
      toolId, slug, nameEn, nameEn,
      product.name, productSlug, translated.search_keywords,
      translated.tagline_ja, extracted.tagline ?? product.tagline,
      translated.description_ja, extracted.description ?? product.description,
      officialUrl, logoUrl, extracted.company_name ?? null, categoryId,
      isPublished,
      extracted.has_api === true ? 1 : 0,
      extracted.has_free_plan === true ? 1 : 0,
      product.postId ?? null,
      productUrl,
      confidence, isPublished ? 0 : 1,
      extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
    ]
  );

  console.log(`  ✅ 登録: ${slug}（${isPublished ? '公開' : '非公開'}）confidence=${Math.round(confidence * 100)}%`);
  console.log(`  🔑 keywords: ${translated.search_keywords}`);
}

// =====================
// main
// =====================
async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('❌ PH製品URLを引数で指定してください');
    console.error('例: npx tsx scripts/seed-ph-product.ts https://www.producthunt.com/products/chatgpt');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════╗');
  console.log('║  AI Chronicle - PH製品URL指定シード  ║');
  console.log('╚══════════════════════════════════════╝');

  const db = D1Client.fromEnv();
  for (let i = 0; i < urls.length; i++) {
    await processProductUrl(db, urls[i]);
    if (i < urls.length - 1) await sleep(3000);
  }
  console.log('\n✅ 完了');
}

main().catch(e => { console.error('🔥', e); process.exit(1); });
