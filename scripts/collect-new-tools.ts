// =============================================
// AI Chronicle - 新着ツール収集
// =============================================
// 実行: tsx scripts/collect-new-tools.ts

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { fetchLatestAIPosts, fetchLatestPosts, type ProductHuntPost } from '../src/lib/product-hunt';
import { fetchHtml, htmlToText, extractMeta, guessFaviconUrl, truncateForAI } from '../src/lib/scraper';
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
  'text-generation': 'text-generation', text: 'text-generation', writing: 'text-generation', chat: 'text-generation',
  'image-generation': 'image-generation', image: 'image-generation',
  'video-generation': 'video-generation', video: 'video-generation',
  coding: 'coding', code: 'coding', developer: 'coding',
  audio: 'audio', music: 'audio', voice: 'audio', speech: 'audio',
  'data-analysis': 'data-analysis', data: 'data-analysis', analytics: 'data-analysis',
  productivity: 'productivity', workflow: 'productivity', automation: 'productivity',
};

const FAILED_IDS_JOB = 'collect_failed_ids';

async function loadFailedProductHuntIds(db: D1Client): Promise<string[]> {
  const row = await db.first<{ errors: string | null }>(
    `SELECT errors FROM scrape_logs WHERE job_name = ? ORDER BY started_at DESC LIMIT 1`, [FAILED_IDS_JOB]
  );
  if (!row || !row.errors) return [];
  try { const p = JSON.parse(row.errors) as string[]; return Array.isArray(p) ? p : []; } catch { return []; }
}

async function saveFailedProductHuntIds(db: D1Client, ids: string[]): Promise<void> {
  if (ids.length === 0) {
    await db.execute(`DELETE FROM scrape_logs WHERE job_name = ?`, [FAILED_IDS_JOB]);
    return;
  }
  const existing = await db.first<{ id: string }>(`SELECT id FROM scrape_logs WHERE job_name = ? LIMIT 1`, [FAILED_IDS_JOB]);
  if (existing) {
    await db.execute(`UPDATE scrape_logs SET errors = ?, started_at = datetime('now'), finished_at = datetime('now') WHERE id = ?`, [JSON.stringify(ids), existing.id]);
  } else {
    await db.execute(`INSERT INTO scrape_logs (id, job_name, status, errors, started_at, finished_at) VALUES (?, ?, 'error', ?, datetime('now'), datetime('now'))`, [generateId('log'), FAILED_IDS_JOB, JSON.stringify(ids)]);
  }
}





async function translateLaunchTagline(tagline: string): Promise<string | null> {
  try {
    const raw = await callAI(`以下の英語テキストを自然な日本語に翻訳してください。JSONのみ出力。句読点不要。\n【翻訳対象】\n${tagline}\n【出力形式】\n{"tagline_ja": "翻訳結果"}`);
    const result = parseJsonResponse<{ tagline_ja: string | null }>(raw);
    return result.tagline_ja ?? null;
  } catch { return null; }
}

async function saveToolLaunch(db: D1Client, toolId: string, post: ProductHuntPost): Promise<void> {
  try {
    const existing = await db.first<{ id: string }>(
      `SELECT id FROM tool_launches WHERE tool_id = ? AND launch_name = ? LIMIT 1`, [toolId, post.name]
    );
    if (existing) return;

    let taglineJa: string | null = null;
    if (post.tagline) taglineJa = await translateLaunchTagline(post.tagline);

    const url = (post as any).primaryLinkUrl ?? post.website ?? null;
    const launchDate = (post as any).featuredAt ? String((post as any).featuredAt).substring(0, 10) : null;

    await db.execute(
      `INSERT INTO tool_launches (id, tool_id, launch_name, tagline, tagline_ja, launch_date, launch_number, thumbnail_url, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [generateId('launch'), toolId, post.name, post.tagline ?? null, taglineJa, launchDate, null, post.thumbnail?.url ?? null, url]
    );
    console.log(`  ✅ ローンチ保存: ${post.name}${taglineJa ? ` →「${taglineJa}」` : ''}`);
  } catch (error) {
    console.warn(`  ⚠️ ローンチ保存失敗: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function saveExistingToolLaunches(db: D1Client, posts: ProductHuntPost[]): Promise<number> {
  let saved = 0;
  for (const post of posts) {
    const tool = await db.first<{ id: string; name_ja: string; name_en: string; slug: string }>(
      `SELECT id, name_ja, name_en, slug FROM tools WHERE product_hunt_id = ? LIMIT 1`, [post.id]
    );
    if (!tool) continue;
    const existing = await db.first<{ id: string }>(
      `SELECT id FROM tool_launches WHERE tool_id = ? AND launch_name = ? LIMIT 1`, [tool.id, post.name]
    );
    if (existing) continue;
    console.log(`  🔄 既存ツール新ローンチ: ${tool.name_en} → ${post.name}`);
    await saveToolLaunch(db, tool.id, post);

    // ニュース生成（new_feature）
    const taglineJa = post.tagline ? await translateLaunchTagline(post.tagline).catch(() => null) : null;
    const launchDate = (post as any).featuredAt
      ? String((post as any).featuredAt).substring(0, 10)
      : null;
    await createNews(db, {
      type: 'new_feature',
      tool: { id: tool.id, slug: tool.slug, name_ja: tool.name_ja, name_en: tool.name_en },
      launch: {
        launch_name: post.name,
        tagline: post.tagline ?? null,
        tagline_ja: taglineJa,
        launch_date: launchDate,
      },
    });

    saved++;
  }
  return saved;
}

async function extractToolData(post: ProductHuntPost, pageText: string | null): Promise<ExtractedToolData> {
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

{"is_ai_tool":true/false,"tool_name":"正式名称またはnull","tagline":"英語キャッチコピーまたはnull","description":"3文以内英語またはnull","company_name":"会社名またはnull","has_free_plan":true/false/null,"category_hint":"text-generation/image-generation/video-generation/coding/audio/data-analysis/productivity/other","tags":["タグ"],"has_api":true/false/null,"supported_languages":["en"]またはnull}`;
  const raw = await callAI(prompt);
  return parseJsonResponse<ExtractedToolData>(raw);
}

async function translateToJapanese(tagline: string | null, description: string | null): Promise<{ tagline_ja: string | null; description_ja: string | null }> {
  if (!tagline && !description) return { tagline_ja: null, description_ja: null };
  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。

【翻訳対象】
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}

tagline_jaルール：「[カテゴリ] [キャッチコピー]」形式、最大2文（「。」区切り）、句読点は2文目末のみ可、会社名・製品名禁止
description_jaルール：最大4文、合計200文字以内、「。」を文末につけその直後に改行文字（\nのみ・<br>禁止）を入れる、会社名・製品名・バージョン禁止

{"tagline_ja":"翻訳結果","description_ja":"翻訳結果"}`;
  const raw = await callAI(prompt);
  return parseJsonResponse<{ tagline_ja: string | null; description_ja: string | null }>(raw);
}

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

async function processSingleTool(db: D1Client, post: ProductHuntPost): Promise<{ success: boolean; toolId?: string; skipped?: boolean; error?: string }> {
  try {
    console.log(`\n📦 処理中: ${post.name}`);

    let pageText: string | null = null;
    let logoUrl: string | null = null;

    if (post.website) {
      try {
        const html = await fetchHtml(post.website);
        pageText = htmlToText(html);
        const meta = extractMeta(html);
        logoUrl = meta.ogImage ?? guessFaviconUrl(post.website);
      } catch {
        logoUrl = post.thumbnail?.url ?? null;
      }
    } else {
      logoUrl = post.thumbnail?.url ?? null;
    }

    const extracted = await extractToolData(post, pageText);
    if (!extracted.is_ai_tool) {
      console.log(`  ⏭️ スキップ: AIツール非該当（${post.name}）`);
      return { success: true, skipped: true };
    }

    const confidence = calculateConfidence(extracted);
    const translated = await translateToJapanese(extracted.tagline ?? post.tagline, extracted.description ?? post.description);
    const categoryId = await resolveCategoryId(db, extracted.category_hint);
    const slug = await generateUniqueSlug(db, extracted.tool_name ?? post.name, post.website);
    const toolId = generateId('tool');

    // 公式URLがない場合は非公開
    const officialUrl = post.website ?? null;
    const hasOfficialUrl = !!officialUrl;
    const confidenceOk = confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH;
    const isPublished = hasOfficialUrl && confidenceOk ? 1 : 0;
    const needsReview = !isPublished ? 1 : 0;

    if (!hasOfficialUrl) {
      console.log(`  ⚠️ 公式URLなし → 非公開で登録: ${post.name}`);
    }

    await db.execute(
      `INSERT INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, description_ja, description_en, official_url, logo_url, company_name, category_id, status, is_published, has_api, has_free_plan, product_hunt_id, product_hunt_url, ai_confidence_score, needs_manual_review, data_source, source_url, language_support, last_scraped_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, 'product_hunt_api', ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        toolId, slug,
        extracted.tool_name ?? post.name, extracted.tool_name ?? post.name,
        translated.tagline_ja, extracted.tagline ?? post.tagline,
        translated.description_ja, extracted.description ?? post.description,
        officialUrl, logoUrl, extracted.company_name, categoryId, isPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.id, post.url, confidence, needsReview, post.url,
        extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
      ]
    );

    /* PRICING_DISABLED */


    console.log(`  ✅ 登録完了: ${slug}（${isPublished ? '公開' : '非公開'}）`);

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

async function main() {
  console.log('🚀 AI Chronicle - 新着ツール収集ジョブ開始');
  const db = D1Client.fromEnv();
  const logId = generateId('log');
  await db.execute(`INSERT INTO scrape_logs (id, job_name, status, started_at) VALUES (?, 'collect_new_tools', 'running', datetime('now'))`, [logId]);

  let added = 0, skipped = 0, launchesAdded = 0;
  const errors: string[] = [];
  let consecutiveGeminiFailures = 0;
  const GEMINI_DOWN_THRESHOLD = 2;
  let failedIds = await loadFailedProductHuntIds(db);

  try {
    console.log('\n--- Product Hunt投稿取得 ---');
    const allPosts = await fetchLatestAIPosts();
    console.log(`  → ${allPosts.length}件取得`);

    console.log('\n--- 既存ツールの新ローンチ確認 ---');
    launchesAdded = await saveExistingToolLaunches(db, allPosts);

    if (failedIds.length > 0) {
      console.log(`\n--- 前回失敗分再処理（${failedIds.length}件）---`);
      const retryPosts = (await fetchLatestPosts()).filter(p => failedIds.includes(p.id));
      for (const post of retryPosts) {
        const ex = await db.first<{ count: number }>('SELECT COUNT(*) AS count FROM tools WHERE product_hunt_id = ?', [post.id]);
        if (ex && ex.count > 0) { failedIds = failedIds.filter(id => id !== post.id); continue; }
        const result = await processSingleTool(db, post);
        if (result.skipped || result.success) {
          failedIds = failedIds.filter(id => id !== post.id);
          result.skipped ? skipped++ : added++;
          if (result.success) consecutiveGeminiFailures = 0;
        } else {
          consecutiveGeminiFailures++;
          errors.push(`${post.name}: ${result.error}`);
          if (consecutiveGeminiFailures >= GEMINI_DOWN_THRESHOLD) {
            await saveFailedProductHuntIds(db, failedIds);
            await db.execute(`UPDATE scrape_logs SET status='partial', tools_added=?, errors=?, finished_at=datetime('now') WHERE id=?`, [added, JSON.stringify(errors), logId]);
            printResult(added, skipped, launchesAdded, errors.length, 'partial（Geminiダウン）');
            return;
          }
        }
      }
      await saveFailedProductHuntIds(db, failedIds);
    }

    console.log('\n--- 新着ツール登録 ---');
    const newPosts: ProductHuntPost[] = [];
    for (const post of allPosts) {
      const ex = await db.first<{ count: number }>('SELECT COUNT(*) AS count FROM tools WHERE product_hunt_id = ?', [post.id]);
      if (!ex || ex.count === 0) newPosts.push(post);
    }
    console.log(`  → 未登録: ${newPosts.length}件`);
    const targets = newPosts.slice(0, CONFIG.MAX_NEW_TOOLS_PER_RUN);

    for (const post of targets) {
      const result = await processSingleTool(db, post);
      if (result.skipped) { skipped++; }
      else if (result.success) { added++; consecutiveGeminiFailures = 0; }
      else {
        consecutiveGeminiFailures++;
        errors.push(`${post.name}: ${result.error}`);
        if (!failedIds.includes(post.id)) failedIds.push(post.id);
        if (consecutiveGeminiFailures >= GEMINI_DOWN_THRESHOLD) {
          for (const r of targets.slice(targets.indexOf(post) + 1)) {
            if (!failedIds.includes(r.id)) failedIds.push(r.id);
          }
          await saveFailedProductHuntIds(db, failedIds);
          await db.execute(`UPDATE scrape_logs SET status='partial', tools_added=?, errors=?, finished_at=datetime('now') WHERE id=?`, [added, JSON.stringify(errors), logId]);
          printResult(added, skipped, launchesAdded, errors.length, 'partial（Geminiダウン）');
          return;
        }
      }
    }

    await saveFailedProductHuntIds(db, failedIds);
    const status = errors.length === 0 ? 'success' : added > 0 ? 'partial' : 'error';
    await db.execute(`UPDATE scrape_logs SET status=?, tools_added=?, errors=?, finished_at=datetime('now') WHERE id=?`, [status, added, errors.length > 0 ? JSON.stringify(errors) : null, logId]);
    printResult(added, skipped, launchesAdded, errors.length, status);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 致命的エラー:', msg);
    await saveFailedProductHuntIds(db, failedIds);
    await db.execute(`UPDATE scrape_logs SET status='error', errors=?, finished_at=datetime('now') WHERE id=?`, [JSON.stringify([msg]), logId]);
    process.exit(1);
  }
}

function printResult(added: number, skipped: number, launches: number, errorCount: number, status: string) {
  console.log(`\n========== 結果 ==========`);
  console.log(`  ✅ 新規ツール登録: ${added}件`);
  console.log(`  🚀 既存ツール新ローンチ: ${launches}件`);
  console.log(`  ⏭️ スキップ: ${skipped}件`);
  console.log(`  ❌ エラー: ${errorCount}件`);
  console.log(`  🏁 ステータス: ${status}`);
}

main();
