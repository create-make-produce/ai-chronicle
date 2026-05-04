// =============================================
// AI Chronicle - 手動シード54件 PHデータ一括補完 [修正版]
// =============================================
// 実行: tsx scripts/seed-ph-data.ts
//
// PH API v2 の仕様:
//   ❌ posts(search: ...) は存在しない
//   ❌ post.product.posts は存在しない
//   ✅ post(slug: "xxx") または post(id: "xxx") のみ
//
// 対応策:
//   KNOWN_SLUGS で有名54件の正確なPHスラッグを定義
//   → slug で直接取得、見つからなければ翻訳だけ実行
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { generateId } from '../src/lib/uuid';
import { CONFIG } from '../src/config';

// =============================================
// PH API（スタンドアロン実装）
// =============================================

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const clientId = process.env.PRODUCT_HUNT_API_KEY;
  const clientSecret = process.env.PRODUCT_HUNT_API_SECRET;
  if (!clientId || !clientSecret) throw new Error('環境変数 PRODUCT_HUNT_API_KEY / PRODUCT_HUNT_API_SECRET が必要です');
  const response = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  });
  if (!response.ok) throw new Error(`PH認証エラー (${response.status}): ${await response.text()}`);
  const json = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function graphqlQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  // 429: レート制限 → reset_in秒待ってリトライ
  if (response.status === 429) {
    const body = await response.json() as { errors?: Array<{ details?: { reset_in?: number } }> };
    const resetIn = body.errors?.[0]?.details?.reset_in ?? 60;
    const waitSec = resetIn + 10; // 余裕を持たせる
    console.log(`  ⏳ レート制限 → ${waitSec}秒待機中...（リセットまで: ${resetIn}秒）`);
    await sleep(waitSec * 1000);
    return graphqlQuery<T>(query, variables); // リトライ
  }

  if (!response.ok) throw new Error(`PH GraphQLエラー (${response.status}): ${await response.text()}`);
  const json = await response.json() as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(', '));
  if (!json.data) throw new Error('PH GraphQL: dataが空');
  return json.data;
}

// =============================================
// 型定義
// =============================================

interface PHPost {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string | null;
  website: string | null;
  url: string;
  featuredAt: string | null;
  thumbnail: { url: string } | null;
  productLinks: Array<{ url: string; type: string }> | null;
}

interface ToolRow {
  id: string;
  name_en: string;
  tagline_ja: string | null;
  tagline_en: string | null;
  description_ja: string | null;
  description_en: string | null;
  product_hunt_id: string | null;
  product_hunt_url: string | null;
  official_url: string | null;
  ios_url: string | null;
  android_url: string | null;
}

// =============================================
// 有名54件の正確なPHスラッグマッピング
// PH URL: https://www.producthunt.com/posts/{slug}
// 見つからない場合は自動生成スラッグにフォールバック
// =============================================
const KNOWN_SLUGS: Record<string, string> = {
  'AIVA':               'aiva',
  'Adobe Firefly':      'adobe-firefly',
  'Adobe Podcast AI':   'adobe-podcast',
  'Bolt.new':           'bolt-new',
  'Canva AI':           'canva-ai',
  'Character.AI':       'character-ai',
  'ChatGPT':            'chatgpt',
  'Claude':             'claude-3',
  'Codeium':            'codeium',
  'Cursor':             'cursor-2',
  'DALL-E 3':           'dall-e-3',
  'DataRobot':          'datarobot',
  'Descript':           'descript',
  'Devin':              'devin-by-cognition-labs',
  'ElevenLabs':         'elevenlabs',
  'Fireflies.ai':       'fireflies-ai',
  'Flux':               'flux-ai',
  'Gemini':             'gemini',
  'GitHub Copilot':     'github-copilot-x',
  'Grammarly':          'grammarly',
  'Grok':               'grok-3',
  'HeyGen':             'heygen',
  'Ideogram':           'ideogram',
  'InVideo AI':         'invideo-ai',
  'Julius AI':          'julius-ai',
  'Kling AI':           'kling-ai',
  'Leonardo.AI':        'leonardo-ai',
  'Luma Dream Machine': 'luma-dream-machine',
  'Make':               'make-2',
  'Mem AI':             'mem',
  'Microsoft Copilot':  'microsoft-copilot',
  'Midjourney':         'midjourney',
  'Mistral AI':         'mistral-ai',
  'Notion AI':          'notion-ai',
  'Obviously AI':       'obviously-ai',
  'Otter.ai':           'otter-ai',
  'Perplexity AI':      'perplexity-ai',
  'Pika':               'pika-1-0',
  'Polymer':            'polymer',
  'Power BI':           'microsoft-power-bi',
  'Reclaim.ai':         'reclaim-ai',
  'Replit AI':          'replit-ai',
  'Rows AI':            'rows-ai',
  'Runway':             'runway-gen-2',
  'Sora':               'sora-by-openai',
  'Speechify':          'speechify',
  'Stable Diffusion':   'stable-diffusion',
  'Suno':               'suno-ai',
  'Synthesia':          'synthesia-2',
  'Tableau':            'tableau',
  'Tabnine':            'tabnine',
  'Udio':               'udio',
  'Zapier AI':          'zapier-ai',
  'v0':                 'v0-by-vercel',
};

/** ツール名からPHスラッグを自動生成（フォールバック） */
function toPhSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** PH: slug で取得 */
async function fetchPHPostBySlug(slug: string): Promise<PHPost | null> {
  type Res = { post: PHPost | null };
  const data = await graphqlQuery<Res>(
    `query GetPostBySlug($slug: String!) {
      post(slug: $slug) {
        id name slug tagline description website url featuredAt
        thumbnail { url }
        productLinks { url type }
      }
    }`,
    { slug }
  );
  return data.post;
}

/** PH: ID で取得 */
async function fetchPHPostById(id: string): Promise<PHPost | null> {
  type Res = { post: PHPost | null };
  const data = await graphqlQuery<Res>(
    `query GetPostById($id: ID!) {
      post(id: $id) {
        id name slug tagline description website url featuredAt
        thumbnail { url }
        productLinks { url type }
      }
    }`,
    { id }
  );
  return data.post;
}

// =============================================
// ユーティリティ
// =============================================

function getIosUrl(links: Array<{ url: string; type: string }> | null): string | null {
  return links?.find((l) => l.type === 'ios_app' || l.url.includes('apps.apple.com'))?.url ?? null;
}
function getAndroidUrl(links: Array<{ url: string; type: string }> | null): string | null {
  return links?.find((l) => l.type === 'android_app' || l.url.includes('play.google.com'))?.url ?? null;
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}


/** PHポストをtool_launchesに1件保存（重複スキップ） */
async function saveLaunch(db: D1Client, toolId: string, post: PHPost): Promise<boolean> {
  const existing = await db.first<{ id: string }>(
    `SELECT id FROM tool_launches WHERE tool_id = ? AND launch_name = ? LIMIT 1`,
    [toolId, post.name]
  );
  if (existing) return false;

  const launchDate = post.featuredAt ? String(post.featuredAt).substring(0, 10) : null;
  await db.execute(
    `INSERT INTO tool_launches (id, tool_id, launch_name, tagline, tagline_ja, launch_date, thumbnail_url, url, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, datetime('now'))`,
    [generateId('launch'), toolId, post.name, post.tagline ?? null, launchDate, post.thumbnail?.url ?? null, post.url]
  );
  return true;
}

/** description_ja / tagline_ja が未設定の場合にGeminiで翻訳 */
async function translateIfNeeded(db: D1Client, tool: ToolRow, taglineEn: string | null, descEn: string | null): Promise<void> {
  if (tool.tagline_ja && tool.description_ja) return;
  if (!taglineEn && !descEn) return;

  await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
  try {
    const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。
【翻訳対象】
- tagline: ${taglineEn ?? '（なし）'}
- description: ${descEn ?? '（なし）'}

【厳守ルール】
- 会社名・製品名・モデル名・バージョン番号は記載禁止（機能と用途のみ記述）
- 「、」は文中で使用可
- 「。」は各文の文末に必ずつけ、その後に改行（
）を入れる
- 文をスペースで区切ることは禁止
- 120文字以上（多い分はOK）、3〜5文構成
- ツールの機能・用途・対象ユーザーを具体的に記述
- tagline_ja：「[カテゴリ] [キャッチコピー]」形式、最大2文（「。」区切り）、句読点は2文目末のみ可、会社名・製品名禁止
- 良い例: "テキスト生成やコード作成に対応した対話型AIサービス。
画像の分析やウェブ検索など幅広いタスクに活用できる。
無料から利用でき、学生からビジネスパーソンまで幅広いユーザーに対応している。"
- 悪い例（会社名あり）: "OpenAIが提供するAIサービス。GPT-4oを搭載している。"
- 悪い例（スペース区切り）: "テキスト生成に対応 画像分析もできる"
- 悪い例（短すぎ）: "AIチャットサービス。" 

{"tagline_ja":"翻訳結果またはnull","description_ja":"翻訳結果またはnull"}`;

    const raw = await callAI(prompt);
    const result = parseJsonResponse<{ tagline_ja: string | null; description_ja: string | null }>(raw);

    const updates: string[] = [];
    const params: unknown[] = [];
    if (!tool.tagline_ja && result.tagline_ja) { updates.push('tagline_ja = ?'); params.push(result.tagline_ja); }
    if (!tool.description_ja && result.description_ja) { updates.push('description_ja = ?'); params.push(result.description_ja); }

    if (updates.length > 0) {
      params.push(tool.id);
      await db.execute(`UPDATE tools SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params);
      console.log(`  🌐 翻訳: ${updates.map(u => u.split(' = ')[0]).join(', ')}`);
    }
  } catch (err) {
    console.warn(`  ⚠️ 翻訳失敗: ${err instanceof Error ? err.message : String(err)}`);
  }
}


// =============================================
// メイン
// =============================================

async function main() {
  console.log('🚀 AI Chronicle - PHデータ一括補完 開始');
  const db = D1Client.fromEnv();

  // 既存データの「。」を除去（句読点不要ルール適用）
  console.log('\n🧹 既存データの句読点クリーンアップ...');
  await db.execute(
    `UPDATE tools SET
      description_ja = REPLACE(description_ja, '。', ' '),
      tagline_ja     = REPLACE(tagline_ja,     '。', ''),
      tagline_ja     = REPLACE(tagline_ja,     '、', ''),
      updated_at     = datetime('now')
     WHERE data_source IS NULL
       AND (description_ja LIKE '%。%' OR tagline_ja LIKE '%。%' OR tagline_ja LIKE '%、%')`
  );
  console.log('  ✅ クリーンアップ完了');

  const tools = await db.query<ToolRow>(
    `SELECT id, name_en, tagline_ja, tagline_en, description_ja, description_en,
            product_hunt_id, product_hunt_url, official_url, ios_url, android_url
     FROM tools WHERE data_source IS NULL ORDER BY name_en`
  );
  console.log(`\n対象ツール: ${tools.length}件\n`);

  let updated = 0, skipped = 0, notFound = 0, errorCount = 0, phRequests = 0;
  const MAX_PH_REQUESTS = 70;

  for (const tool of tools) {
    - description_ja：最大4文、合計200文字以内、「。」を文末につけその直後に改行文字（\nのみ・<br>禁止）を入れる
    if (tool.product_hunt_id && tool.tagline_ja && tool.description_ja && tool.description_ja.length <= 200) {
      console.log(`⏭️ スキップ（完全）: ${tool.name_en}`);
      skipped++;
      continue;
    }

    console.log(`🔍 処理中: ${tool.name_en}`);

    if (phRequests >= MAX_PH_REQUESTS) {
      console.log('\n⚠️ PH APIリクエスト上限（70件）到達。残りは次回実行してください。');
      break;
    }

    try {
      let phPost: PHPost | null = null;

      if (tool.product_hunt_id) {
        // IDあり → 直接取得
        phPost = await fetchPHPostById(tool.product_hunt_id);
        phRequests++;
        console.log(`  📌 ID取得: ${tool.product_hunt_id}`);
      } else {
        // スラッグで取得（KNOWN_SLUGS優先 → 自動生成フォールバック）
        const primarySlug = KNOWN_SLUGS[tool.name_en] ?? toPhSlug(tool.name_en);
        console.log(`  🔗 slug: ${primarySlug}`);
        phPost = await fetchPHPostBySlug(primarySlug);
        phRequests++;

        // KNOWN_SLUGSにない場合は自動生成スラッグでも試す
        if (!phPost && !(tool.name_en in KNOWN_SLUGS)) {
          const fallbackSlug = toPhSlug(tool.name_en);
          if (fallbackSlug !== primarySlug) {
            console.log(`  🔗 fallback slug: ${fallbackSlug}`);
            phPost = await fetchPHPostBySlug(fallbackSlug);
            phRequests++;
          }
        }
      }

      if (!phPost) {
        console.log(`  ❓ PH未発見 → 翻訳のみ実行`);
        notFound++;
        await translateIfNeeded(db, tool, tool.tagline_en, tool.description_en);
        await sleep(500);
        continue;
      }

      console.log(`  ✅ "${phPost.name}" (id=${phPost.id})`);

      // DB更新（COALESCE: 既存データは上書きしない）
      await db.execute(
        `UPDATE tools SET
          product_hunt_id  = COALESCE(product_hunt_id, ?),
          product_hunt_url = COALESCE(product_hunt_url, ?),
          tagline_en       = COALESCE(tagline_en, ?),
          description_en   = COALESCE(description_en, ?),
          official_url     = COALESCE(official_url, ?),
          ios_url          = COALESCE(ios_url, ?),
          android_url      = COALESCE(android_url, ?),
          updated_at       = datetime('now')
         WHERE id = ?`,
        [
          phPost.id, phPost.url,
          phPost.tagline ?? null, phPost.description ?? null,
          phPost.website ?? null,
          getIosUrl(phPost.productLinks), getAndroidUrl(phPost.productLinks),
          tool.id,
        ]
      );

      // Gemini翻訳（未設定のもののみ）
      await translateIfNeeded(db, tool,
        phPost.tagline ?? tool.tagline_en,
        phPost.description ?? tool.description_en
      );

      // ローンチ保存（1件）
      const saved = await saveLaunch(db, tool.id, phPost);
      if (saved) { console.log(`  🚀 ローンチ保存: ${phPost.name}`); }
      else { console.log(`  ℹ️ ローンチ: スキップ（既存）`); }

      updated++;

    } catch (err) {
      console.error(`  ❌ エラー: ${err instanceof Error ? err.message : String(err)}`);
      errorCount++;
    }

    await sleep(1000);
  }

  console.log('\n========== 結果 ==========');
  console.log(`  ✅ 更新完了        : ${updated}件`);
  console.log(`  ⏭️ スキップ（完全）: ${skipped}件`);
  console.log(`  ❓ PH未発見        : ${notFound}件`);
  console.log(`  ❌ エラー          : ${errorCount}件`);
  console.log(`  📡 PHリクエスト    : ${phRequests}件使用`);
  if (phRequests >= MAX_PH_REQUESTS) console.log('\n⚠️ 残りのツールがあります。明日以降に再実行してください。');
}

main().catch((e) => { console.error('致命的エラー:', e); process.exit(1); });
