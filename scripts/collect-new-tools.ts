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
import { fetchHtml, htmlToText, extractFaviconUrl, truncateForAI } from '../src/lib/scraper';
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
    const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
    const result = parseJsonResponse<{ tagline_ja: string | null }>(sanitized);
    return result.tagline_ja ?? null;
  } catch { return null; }
}


/**
 * 既存ツールの照合（ph_slug優先 → product_hunt_id フォールバック）
 *
 * 新しいローンチ "Claude Opus 4.7"（post.product_slug = "claude"）が来た場合：
 *   → tools.ph_slug = "claude" のツールを見つけて新ローンチとして保存
 * 旧データ（ph_slugなし）の場合：
 *   → product_hunt_id = post.id で照合（後方互換）
 */
async function findExistingTool(
  db: D1Client,
  post: ProductHuntPost
): Promise<{ id: string; name_ja: string; name_en: string; slug: string } | null> {
  const byId = await db.first<{ id: string; name_ja: string; name_en: string; slug: string }>(
    `SELECT id, name_ja, name_en, slug FROM tools WHERE product_hunt_id = ? AND is_published = 1 LIMIT 1`,
    [post.id]
  );
  if (byId) return byId;

  // name_en 大文字小文字無視でフォールバック照合
  const byName = await db.first<{ id: string; name_ja: string; name_en: string; slug: string }>(
    `SELECT id, name_ja, name_en, slug FROM tools WHERE LOWER(name_en) = LOWER(?) AND is_published = 1 LIMIT 1`,
    [post.name]
  );
  return byName ?? null;
}

/**
 * 新規ツールとして未登録か確認（ph_slug優先）
 */
async function isNewTool(db: D1Client, post: ProductHuntPost): Promise<boolean> {
  const checkId = post.product_id ?? post.id;
  const byId = await db.first<{ count: number }>(
    `SELECT COUNT(*) AS count FROM tools WHERE product_hunt_id = ?`, [checkId]
  );
  if (byId && byId.count > 0) return false;

  // name_en 大文字小文字無視で重複チェック
  const byName = await db.first<{ count: number }>(
    `SELECT COUNT(*) AS count FROM tools WHERE LOWER(name_en) = LOWER(?)`, [post.name]
  );
  return !byName || byName.count === 0;
}

async function detectNewsType(launchName: string, tagline: string | null): Promise<'new_feature' | 'price_change'> {
  const prompt = `以下のAIツールの新ローンチ情報を見て、「価格改定」か「新機能・アップデート」かを判定してください。

ローンチ名: ${launchName}
説明: ${tagline ?? '（なし）'}

価格改定の例：プランの値上げ・値下げ・新プラン追加・無料プラン廃止など
新機能の例：新しい機能追加・UIリニューアル・新モデル対応など

JSONのみ出力：{"type":"price_change"} または {"type":"new_feature"}`;

  try {
    const raw = await callAI(prompt);
    const result = parseJsonResponse<{ type: string }>(raw);
    return result.type === 'price_change' ? 'price_change' : 'new_feature';
  } catch {
    return 'new_feature';
  }
}

async function saveExistingToolLaunches(db: D1Client, posts: ProductHuntPost[]): Promise<number> {
  let saved = 0;
  for (const post of posts) {
    const tool = await findExistingTool(db, post);
    if (!tool) continue;

    // PH post IDで重複チェック（source_ph_post_idがある場合）
    const existingByPostId = await db.first<{ id: string }>(
      `SELECT id FROM news WHERE source_ph_post_id = ? LIMIT 1`,
      [post.id]
    );
    if (existingByPostId) continue;
    // フォールバック: tool_id + 同日チェック
    const today = new Date().toISOString().slice(0, 10);
    const existingByDate = await db.first<{ id: string }>(
      `SELECT id FROM news WHERE tool_id = ? AND date(published_at) = ? LIMIT 1`,
      [tool.id, today]
    );
    if (existingByDate) continue;

    console.log(`  🔄 既存ツール新ローンチ: ${tool.name_en} → ${post.name}`);

    const taglineJa = post.tagline ? await translateLaunchTagline(post.tagline).catch(() => null) : null;
    const launchDate = (post as any).featuredAt
      ? String((post as any).featuredAt).substring(0, 10)
      : null;
    const newsType = await detectNewsType(post.name, post.tagline ?? null);
    console.log(`  📰 ニュースタイプ判定: ${newsType}`);
    await createNews(db, {
      type: newsType === 'price_change' ? 'price_change_launch' : 'new_feature',
      tool: { id: tool.id, slug: tool.slug, name_ja: tool.name_ja, name_en: tool.name_en },
      launch: {
        launch_name: post.name,
        tagline: post.tagline ?? null,
        tagline_ja: taglineJa,
        launch_date: launchDate,
        ph_post_id: post.id,
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

{"is_ai_tool":true/false,"tool_name":"製品名のみ（会社名は含めない）またはnull","tagline":"英語キャッチコピーまたはnull","description":"3文以内英語またはnull","company_name":"会社名またはnull","has_free_plan":true/false/null,"starting_price_usd":数値またはnull,"category_hint":"text-generation/image-generation/video-generation/coding/audio/data-analysis/productivity/other","tags":["タグ"],"has_api":true/false/null,"supported_languages":["en"]またはnull}`;
  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  return parseJsonResponse<ExtractedToolData>(sanitized);
}

async function translateToJapanese(phName: string, tagline: string | null, description: string | null): Promise<{ tagline_ja: string | null; description_ja: string | null; search_keywords: string }> {
  const cleanName = phName.replace(/\s+by\s+.+$/i, '').trim();
  if (!tagline && !description) return { tagline_ja: null, description_ja: null, search_keywords: cleanName };
  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。

【ツール名（Product Hunt正式名）】: ${phName}

【翻訳対象】
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}

tagline_jaルール：「[カテゴリ] [キャッチコピー]」形式、最大2文、会社名・製品名禁止
description_jaルール：最大4文、合計200文字以内、会社名・製品名・バージョン禁止、日本のAI初心者にもわかりやすい言葉で書く、何ができるか・特徴・想定ユーザーを含む、各文末に「。」をつける
search_keywordsルール：製品名のみ（機能説明・会社名・バージョン番号は絶対に入れない）英語の製品名とカタカナ読みのみ 例: "Fathom,ファザム" / "Claude,クロード" / "ChatGPT,チャットGPT"

{"tagline_ja":"翻訳結果またはnull","description_ja":"各文末に「。」をつけた日本語概要またはnull","search_keywords":"keyword1,keyword2"}`;
  const raw = await callAI(prompt);
  const sanitized = raw.replace(/("(?:[^"\\]|\\.)*")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  const result = parseJsonResponse<{ tagline_ja: string | null; description_ja: string | null; search_keywords: string | null }>(sanitized);
  return {
    tagline_ja: result.tagline_ja ?? null,
    description_ja: result.description_ja ?? null,
    search_keywords: result.search_keywords ?? cleanName,
  };
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
        // ロゴはGoogleファビコンサービス優先（og:imageはバナー画像のことが多い）
        logoUrl = extractFaviconUrl(html, post.website);
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

    const extracted = await extractToolData(post, pageText);
    if (!extracted.is_ai_tool) {
      console.log(`  ⏭️ スキップ: AIツール非該当（${post.name}）`);
      return { success: true, skipped: true };
    }

    const confidence = calculateConfidence(extracted);
    const translated = await translateToJapanese(post.name, extracted.tagline ?? post.tagline, extracted.description ?? post.description);
    const categoryId = await resolveCategoryId(db, extracted.category_hint);
    const nameEn = extracted.tool_name ?? post.name;
    const slug = await generateUniqueSlug(db, nameEn, post.website);
    const toolId = generateId('tool');

    const officialUrl = post.website ?? null;
    const hasOfficialUrl = !!officialUrl;
    const confidenceOk = confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH;
    const isGithubOnly = officialUrl ? officialUrl.includes('github.com') : false;
    const hasCompany = !!(extracted.company_name ?? null);
    const hasLogo = !!logoUrl;
    const isPublished = hasOfficialUrl && confidenceOk && !isGithubOnly && hasCompany && hasLogo ? 1 : 0;
    if (isGithubOnly) console.log(`  ⚠ GitHub URLのため非公開: ${slug}`);
    if (!hasCompany) console.log(`  ⚠ 会社名なしのため非公開: ${slug}`);
    if (!hasLogo) console.log(`  ⚠ ロゴなしのため非公開: ${slug}`);
    const needsReview = !isPublished ? 1 : 0;

    const hasAppUrl = !!(post.ios_url ?? post.android_url);
    const unpublishCondition = isGithubOnly || !hasCompany || !hasLogo;
    const toolStatus = (hasAppUrl && !unpublishCondition) ? 'pending' : 'active';
    const finalPublished = toolStatus === 'pending' ? 0 : isPublished;
    if (hasAppUrl && !unpublishCondition) console.log(`  ⚠ App URL検出のため保留: ${slug}`);

    if (!hasOfficialUrl) {
      console.log(`  ⚠️ 公式URLなし → 非公開で登録: ${post.name}`);
    }

    await db.execute(
      `INSERT INTO tools (
        id, slug, name_ja, name_en, ph_name, ph_slug, search_keywords,
        tagline_ja, tagline_en, description_ja, description_en,
        official_url, logo_url, company_name, category_id,
        status, is_published, has_api, has_free_plan,
        product_hunt_id, product_hunt_url,
        ai_confidence_score, needs_manual_review,
        data_source, source_url, language_support,
        ios_url, android_url,
        last_scraped_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        'product_hunt_api', ?, ?,
        ?, ?,
        datetime('now'), datetime('now'), datetime('now')
      )`,
      [
        toolId, slug,
        nameEn, nameEn,
        post.name,
        post.product_slug ?? null,
        translated.search_keywords,
        translated.tagline_ja, extracted.tagline ?? post.tagline,
        translated.description_ja, extracted.description ?? post.description,
        officialUrl, logoUrl, extracted.company_name, categoryId,
        toolStatus, finalPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.product_id ?? post.id,
        post.product_url ?? post.url,
        confidence, needsReview,
        post.url,
        extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
        post.ios_url ?? null, post.android_url ?? null,
      ]
    );

    /* PRICING_DISABLED */

    // 新規ツールの最初のローンチとしてPH投稿を保存

    console.log(`  ✅ 登録完了: ${slug}（${finalPublished ? '公開' : hasAppUrl ? '保留' : '非公開'}）`);

    // 同じ会社名の既存ツールと関連AIツール登録
    if (extracted.company_name) {
      const sameCompany = await db.query<{ id: string; name_en: string }>(
        `SELECT id, name_en FROM tools WHERE company_name = ? AND id != ? LIMIT 20`,
        [extracted.company_name, toolId]
      );
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

    if (finalPublished) {
      const category = categoryId ? await db.first<{ name_ja: string }>('SELECT name_ja FROM categories WHERE id = ?', [categoryId]) : null;
      await createNews(db, {
        type: 'new_tool',
        tool: {
          id: toolId, slug,
          name_ja: nameEn,
          name_en: nameEn,
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
    // STEP 1: PH投稿取得（Gemini不使用）
    console.log('\n--- Product Hunt投稿取得 ---');
    const allPosts = await fetchLatestAIPosts();
    console.log(`  → ${allPosts.length}件取得`);

    // STEP 2: 既存ツールの新ローンチ確認（Gemini軽量使用）
    console.log('\n--- 既存ツールの新ローンチ確認 ---');
    launchesAdded = await saveExistingToolLaunches(db, allPosts);

    // STEP 3: 処理対象リストを先に全件構築（取り逃し防止）
    console.log('\n--- 処理対象リスト構築 ---');
    const newPosts: ProductHuntPost[] = [];
    for (const post of allPosts) {
      if (await isNewTool(db, post)) newPosts.push(post);
    }

    // 前回失敗IDも対象に追加（重複除外）
    const failedPosts = (await fetchLatestPosts())
      .filter(p => failedIds.includes(p.id) && !newPosts.find(n => n.id === p.id));

    // 全処理対象 = 失敗分（優先）+ 新着
    const targets = [...failedPosts, ...newPosts].slice(0, CONFIG.MAX_NEW_TOOLS_PER_RUN);
    console.log(`  → 新着: ${newPosts.length}件 / 前回失敗: ${failedPosts.length}件 / 処理対象: ${targets.length}件`);

    // 処理前に全対象IDを失敗リストに入れておく（中断時も逃さない）
    for (const post of targets) {
      if (!failedIds.includes(post.id)) failedIds.push(post.id);
    }

    // STEP 4: 処理実行
    console.log('\n--- ツール登録処理 ---');
    for (const post of targets) {
      const alreadyRegistered = !(await isNewTool(db, post));
      if (alreadyRegistered) {
        failedIds = failedIds.filter(id => id !== post.id);
        continue;
      }

      const result = await processSingleTool(db, post);

      if (result.skipped) {
        skipped++;
        failedIds = failedIds.filter(id => id !== post.id);
      } else if (result.success) {
        added++;
        consecutiveGeminiFailures = 0;
        failedIds = failedIds.filter(id => id !== post.id);
      } else {
        consecutiveGeminiFailures++;
        errors.push(`${post.name}: ${result.error}`);
        // failedIdsには既に入っているのでそのまま残す
        if (consecutiveGeminiFailures >= GEMINI_DOWN_THRESHOLD) {
          console.error(`\n⛔ Gemini連続失敗 → 中断（残りは次回再処理）`);
          break;
        }
      }
    }

    const status = errors.length === 0 ? 'success' : added > 0 ? 'partial' : 'error';
    await db.execute(`UPDATE scrape_logs SET status=?, tools_added=?, errors=?, finished_at=datetime('now') WHERE id=?`,
      [status, added, errors.length > 0 ? JSON.stringify(errors) : null, logId]);
    printResult(added, skipped, launchesAdded, errors.length, status);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 致命的エラー:', msg);
    await db.execute(`UPDATE scrape_logs SET status='error', errors=?, finished_at=datetime('now') WHERE id=?`,
      [JSON.stringify([msg]), logId]);
  } finally {
    // どんな終わり方でも必ず失敗IDを保存
    await saveFailedProductHuntIds(db, failedIds);
    console.log(`💾 失敗IDリスト保存: ${failedIds.length}件`);
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
