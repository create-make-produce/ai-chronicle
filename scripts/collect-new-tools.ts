// =============================================
// AI Chronicle - 新着ツール収集
// =============================================
// 実行: tsx scripts/collect-new-tools.ts

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
  'video-generation': 'image-generation', video: 'image-generation',
  coding: 'coding', code: 'coding', developer: 'coding',
  audio: 'audio', music: 'audio', voice: 'audio', speech: 'audio',
  'data-analysis': 'research', data: 'research', analytics: 'research', analysis: 'research',
  productivity: 'productivity', workflow: 'productivity', automation: 'productivity',
  research: 'research',
  marketing: 'marketing', seo: 'marketing', advertising: 'marketing', social: 'marketing',
  agent: 'productivity', autonomous: 'productivity', workflow_ai: 'productivity',
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
  // 1. PH投稿IDで照合（最も確実）
  const byId = await db.first<{ id: string; name_ja: string; name_en: string; slug: string }>(
    `SELECT id, name_ja, name_en, slug FROM tools WHERE product_hunt_id = ? LIMIT 1`,
    [post.id]
  );
  if (byId) return byId;

  // 2. ツール名（英語）完全一致（大文字小文字無視）
  const byName = await db.first<{ id: string; name_ja: string; name_en: string; slug: string }>(
    `SELECT id, name_ja, name_en, slug FROM tools WHERE LOWER(name_en) = LOWER(?) LIMIT 1`,
    [post.name]
  );
  if (byName) return byName;

  // 3. PHの製品識別子とツール名をスペース・ハイフン・大文字小文字を無視して比較
  if (post.product_slug) {
    const normalizedProductSlug = post.product_slug.replace(/[-\s]/g, '').toLowerCase();
    const allTools = await db.query<{ id: string; name_ja: string; name_en: string; slug: string }>(
      `SELECT id, name_ja, name_en, slug FROM tools`
    );
    for (const tool of allTools) {
      const normalizedNameEn = tool.name_en.replace(/[-\s]/g, '').toLowerCase();
      if (normalizedNameEn === normalizedProductSlug) return tool;
    }
  }

  return null;
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

async function detectNewsType(launchName: string, tagline: string | null): Promise<'new_feature' | 'price_change' | 'other'> {
  const prompt = `以下のAIツールの新ローンチ情報を見て、3種類のどれかを判定してください。

ローンチ名: ${launchName}
説明: ${tagline ?? '（なし）'}

price_change：プランの値上げ・値下げ・新プラン追加・無料プラン廃止など
new_feature：新しい機能追加・UIリニューアル・新モデル対応・新バージョンリリースなど
other：提携発表・研究発表・企業ニュース・ハードウェア発表など上記以外

JSONのみ出力：{"type":"price_change"} または {"type":"new_feature"} または {"type":"other"}`;

  try {
    const raw = await callAI(prompt);
    const result = parseJsonResponse<{ type: string }>(raw);
    if (result.type === 'price_change') return 'price_change';
    if (result.type === 'other') return 'other';
    return 'new_feature';
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
    // フォールバック: tool_id + 24時間チェック
    const existingByDate = await db.first<{ id: string }>(
      `SELECT id FROM news WHERE tool_id = ? AND published_at > datetime('now', '-24 hours') LIMIT 1`,
      [tool.id]
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
      type: newsType === 'price_change' ? 'price_change_launch' : newsType === 'other' ? 'other' : 'new_feature',
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
以下は is_ai_tool: false とすること：
・PyTorch/TensorFlowなどのMLフレームワーク・ライブラリ
・TPU/GPU/NPUなどのハードウェア・チップ
・開発者専用SDK・API単体（UIなし）
・MCPサーバー・MCPプロトコル実装
・学術論文・データセット・ベンチマーク
・通知・メール・SMS・プッシュ配信などの送信インフラ
・AIエージェント向けのセキュリティ・権限・鍵管理ツール
・ロボティクス・ハードウェア制御のIDE・シミュレーター
・企業向けクラウドインフラ・監視・ログ管理サービス
・LLMルーティング・モデルゲートウェイ・AIプロキシ
・本番環境監視・インシデント対応・SRE向けツール
・AIコスト管理・使用量計測・ROI計測ツール
・VSCode等の拡張機能マーケットプレイスのページ（公式サイトではない）
・エンドユーザーが直接使うUIを持たない開発者向けツール全般
・β版・ウェイトリスト登録のみで実際に使えないサービス（Coming Soon・Join Waitlist状態）
・成人向けコンテンツ・アダルトサービス・成人向け画像生成（ヌード・性的コンテンツ等）
・賭博・カジノ・スポーツベッティング・オンラインギャンブル関連
・詐欺・フィッシング・スパム支援ツール
・マルウェア・ハッキング・サイバー攻撃支援ツール
・違法薬物・規制薬物関連サービス
・政治的プロパガンダ生成・選挙操作・世論誘導ツール
・仮想通貨・NFT・ブロックチェーントークン販売が主目的のサービス

【カテゴリ判定ルール（上から順に判定し、最初に該当したものを選ぶ）】
1. image-generation: 画像生成・動画生成・動画編集・映像変換・字幕・SNS動画作成が主機能 → 迷わずimage-generation
2. audio: 音声生成・音楽生成・文字起こし・声クローン・ポッドキャストが主機能 → audio
3. coding: コード生成・補完・デバッグ・テスト・開発支援が主機能 → coding
4. text-generation: テキスト生成・ライティング・翻訳・要約・チャットが主機能 → text-generation
5. productivity: 業務効率化・タスク管理・会議要約・メール自動化・ワークフロー・カスタマーサポート自動化・スケジュール管理
6. research: Web検索・情報収集・リサーチ・データ分析・表データ解析・グラフ化・売上分析・予測分析・要約が主目的
7. marketing: SNS投稿作成・広告コピー生成・SEO記事・メールマーケティング・LP改善・集客・販売促進が主目的。文章生成が手段でも目的がマーケティングならここ
8. other: 明らかにAIツールだが上記いずれにも当てはまらない場合のみ

{"is_ai_tool":true/false,"tool_name":"製品名のみ（会社名は含めない）またはnull","tagline":"英語キャッチコピーまたはnull","description":"3文以内英語またはnull","company_name":"会社名またはnull","has_free_plan":true/false/null,"starting_price_usd":数値またはnull,"category_hint":"text-generation（テキスト生成・ライティング・翻訳・要約・チャットボット・文章校正）/image-generation（画像・動画・映像の生成・編集・変換・字幕生成・SNS動画作成）/audio（音声生成・音楽生成・文字起こし・声のクローン・ポッドキャスト編集）/coding（コード生成・補完・レビュー・デバッグ・テスト自動化・開発支援）/productivity（業務効率化・タスク管理・会議要約・メール自動化・ワークフロー・スケジュール管理）/research（情報収集・Web検索・リサーチ・データ分析・グラフ化・売上分析・予測分析・要約）/marketing（SNS投稿・広告コピー・SEO記事・メールマーケティング・LP改善・集客・販売促進）/other（上記いずれにも明確に当てはまらない場合のみ）","tags":["タグ"],"has_api":true/false/null,"supported_languages":["en"]またはnull}`;
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
    let isSslError = false;

    if (post.website) {
      try {
        const html = await fetchHtml(post.website);
        pageText = htmlToText(html);
        // ロゴはGoogleファビコンサービス優先（og:imageはバナー画像のことが多い）
        logoUrl = extractFaviconUrl(html, post.website);
      } catch (fetchErr) {
        logoUrl = null; // fetchは失敗でも後でGoogleファビコンをセット
        const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        isSslError = /certificate|ssl|tls|cert/i.test(errMsg);
      }
    }

    // fetchが失敗してもGoogleファビコンは生成可能
    if (!logoUrl && post.website) {
      try {
        const u = new URL(post.website);
        logoUrl = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`;
      } catch { /* ignore */ }
    }

    // 既存ツール照合を先に実行（is_ai_tool判定より優先）
    const existingToolCheck = await findExistingTool(db, post);
    if (existingToolCheck) {
      // 既存ツールにヒット → ニュースとして保存してスキップ
      const existingByPostId = await db.first<{ id: string }>(
        `SELECT id FROM news WHERE source_ph_post_id = ? LIMIT 1`, [post.id]
      );
      if (!existingByPostId) {
        const today = new Date().toISOString().slice(0, 10);
        const existingByDate = await db.first<{ id: string }>(
          `SELECT id FROM news WHERE tool_id = ? AND date(published_at) = ? LIMIT 1`,
          [existingToolCheck.id, today]
        );
        if (!existingByDate) {
          const taglineJa = post.tagline ? await translateLaunchTagline(post.tagline).catch(() => null) : null;
          const launchDate = (post as any).featuredAt ? String((post as any).featuredAt).substring(0, 10) : null;
          const newsType = await detectNewsType(post.name, post.tagline ?? null);
          await createNews(db, {
            type: newsType === 'price_change' ? 'price_change_launch' : newsType === 'other' ? 'other' : 'new_feature',
            tool: { id: existingToolCheck.id, slug: existingToolCheck.slug, name_ja: existingToolCheck.name_ja, name_en: existingToolCheck.name_en },
            launch: { launch_name: post.name, tagline: post.tagline ?? null, tagline_ja: taglineJa, launch_date: launchDate, ph_post_id: post.id },
          });
          console.log(`  📰 既存ツールのニュースとして保存: ${existingToolCheck.name_en} → ${post.name}`);
        }
      }
      return { success: true, skipped: true };
    }

    const extracted = await extractToolData(post, pageText);
    if (!extracted.is_ai_tool) {
      console.log(`  ⏭️ スキップ: AIツール非該当（${post.name}）`);
      return { success: true, skipped: true };
    }

    const confidence = calculateConfidence(extracted);
    const translated = await translateToJapanese(post.name, extracted.tagline ?? post.tagline, extracted.description ?? post.description, pageText);
    const categoryId = await resolveCategoryId(db, extracted.category_hint);
    const nameEn = extracted.tool_name ?? post.name;

    // Gemini抽出後のtool_nameで再度重複チェック（post.nameと異なる場合に重複登録を防ぐ）
    if (extracted.tool_name && extracted.tool_name.toLowerCase() !== post.name.toLowerCase()) {
      const duplicateByExtractedName = await db.first<{ count: number }>(
        `SELECT COUNT(*) AS count FROM tools WHERE LOWER(name_en) = LOWER(?)`, [extracted.tool_name]
      );
      if (duplicateByExtractedName && duplicateByExtractedName.count > 0) {
        console.log(`  ⏭️ スキップ: 抽出名が既存ツールと重複（${extracted.tool_name}）`);
        return { success: true, skipped: true };
      }
    }

    const slug = await generateUniqueSlug(db, nameEn, post.website);
    const toolId = generateId('tool');

    const officialUrl = post.website ?? null;
    const hasOfficialUrl = !!officialUrl;
    const confidenceOk = confidence >= CONFIG.MIN_AI_CONFIDENCE_TO_PUBLISH;
    const isChromeStore = officialUrl ? officialUrl.includes('chromewebstore.google.com') : false;
    const judgeResult = judgePublish({ officialUrl, confidenceOk: confidenceOk, logoUrl, isChromeStore, fetchFailed: !!post.website && !pageText, sslError: isSslError });
    const { isPublished, unpublishCondition, reasons, pendingMemo } = judgeResult;
    if (isChromeStore) console.log(`  ⚠ Chrome拡張機能のため非公開: ${slug}`);
    const needsReview = !isPublished ? 1 : 0;

    const hasAppUrl = !!(post.ios_url ?? post.android_url);
    
    const toolStatus = judgeResult.status;
    if (reasons.length > 0) console.log(`  ⚠ 非公開理由: ${reasons.join(', ')}`);
    const finalPublished = isPublished;

    if (!hasOfficialUrl) {
      console.log(`  ⚠️ 公式URLなし → 非公開で登録: ${post.name}`);
    }

    const iosUrlFinal = null; // App Store URL取得コメントアウト中
    const androidUrlFinal = null; // Google Play URL取得コメントアウト中

    await db.execute(
      `INSERT INTO tools (
        id, slug, name_ja, name_en, ph_name, ph_slug, search_keywords,
        tagline_ja, tagline_en, description_ja, description_en,
        use_case_ja, target_user_ja,
        official_url, logo_url, company_name, category_id,
        status, is_published, has_api, has_free_plan,
        product_hunt_id, product_hunt_url,
        ai_confidence_score, needs_manual_review,
        admin_memo,
        data_source, source_url, language_support,
        ios_url, android_url,
        last_scraped_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?,
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
        translated.use_case_ja, translated.target_user_ja,
        officialUrl, logoUrl, extracted.company_name, categoryId,
        toolStatus, finalPublished,
        extracted.has_api === true ? 1 : 0,
        extracted.has_free_plan === true ? 1 : 0,
        post.product_id ?? post.id,
        post.product_url ?? post.url,
        confidence, needsReview,
        pendingMemo ?? null,
        post.url,
        extracted.supported_languages ? JSON.stringify(extracted.supported_languages) : null,
        iosUrlFinal, androidUrlFinal,
      ]
    );

    /* PRICING_DISABLED */

    // 新規ツールの最初のローンチとしてPH投稿を保存

    console.log(`  ✅ 登録完了: ${slug}（${finalPublished ? '公開' : '非公開'}）`);

    // 同じ会社名の既存ツールと関連AIツール登録
    if (extracted.company_name) {
      const sameCompany = await db.query<{ id: string; name_en: string }>(
        `SELECT id, name_en FROM tools WHERE company_name = ? AND id != ? LIMIT 20`,
        [extracted.company_name, toolId]
      );
      if (sameCompany.length > 0) {
        // 同会社ツールがあっても公開のまま（保留にしない）
        console.log(`  ℹ 同会社ツール検出（公開のまま）: ${extracted.company_name}`);
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

    if (finalPublished) {
      // 24時間以内に同ツールのニュースが既にある場合はスキップ
      const recentNews = await db.first<{ id: string }>(
        `SELECT id FROM news WHERE tool_id = ? AND published_at > datetime('now', '-24 hours') LIMIT 1`,
        [toolId]
      );
      if (recentNews) {
        console.log(`  ⏭ ニュース生成スキップ（24時間以内に既存）`);
      } else {
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
      } // end recentNews check
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
