// =============================================
// AI Chronicle - 公式URL未取得ツールの補完
// =============================================
// 実行: npx tsx scripts/fix-missing-urls.ts
// 対象: data_source='product_hunt_api' かつ official_url IS NULL のツール

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';
import { fetchLatestPosts } from '../src/lib/product-hunt';



async function extractWebsiteFromPHPage(phPageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(phPageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Chronicle-Bot/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();

    const jsonMatch = html.match(/"websiteUrl":"(https?:\/\/[^"]+)"/);
    if (jsonMatch) return jsonMatch[1].replace(/\u002F/g, '/');

    const btnMatch = html.match(/data-test="visit-website-button"[^>]*href="([^"]+)"/);
    if (btnMatch) return btnMatch[1];

    const primaryMatch = html.match(/"primaryLink":\{"__typename":"ProductLink","id":"[^"]+","url":"(https?:\/\/[^"]+)"\}/);
    if (primaryMatch) return primaryMatch[1];

    return null;
  } catch { return null; }
}

async function resolveRedirectUrl(redirectUrl: string): Promise<string | null> {
  if (!redirectUrl || !redirectUrl.includes('producthunt.com')) return redirectUrl;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(redirectUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Chronicle-Bot/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const finalUrl = response.url;
    if (finalUrl.includes('producthunt.com')) return null;
    return finalUrl;
  } catch { return null; }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

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
  if (!response.ok) throw new Error(`PH認証エラー (${response.status})`);
  const json = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function fetchPostById(id: string, phUrl?: string): Promise<{ website: string | null; ios_url: string | null; android_url: string | null; ph_url: string | null } | null> {
  const token = await getAccessToken();

  // product_hunt_urlからproductスラッグを抽出（/products/xxx 形式）
  const productSlugMatch = phUrl?.match(/\/products\/([^/?]+)/);
  const productSlug = productSlugMatch?.[1];

  const query = productSlug
    ? `query { product(slug: "${productSlug}") { websiteUrl iosUrl androidUrl } }`
    : `query GetPost($id: ID!) { post(id: $id) { url website product { websiteUrl } productLinks { url type } } }`;

  const variables = productSlug ? undefined : { id };

  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...(variables ? { variables } : {}) }),
  });

  // productSlugクエリの場合は直接websiteUrlを返す
  if (productSlug) {
    if (response.status === 429) {
      const body = await response.json() as { errors?: Array<{ details?: { reset_in?: number } }> };
      const resetIn = body.errors?.[0]?.details?.reset_in ?? 60;
      console.log(`  ⏳ レート制限 → ${resetIn + 10}秒待機...`);
      await sleep((resetIn + 10) * 1000);
      return fetchPostById(id, phUrl);
    }
    const json = await response.json() as { data?: { product?: { websiteUrl?: string; iosUrl?: string; androidUrl?: string } } };
    const product = json.data?.product;
    if (!product?.websiteUrl) return null;
    return { website: product.websiteUrl, ios_url: product.iosUrl ?? null, android_url: product.androidUrl ?? null, ph_url: null };
  }

  if (response.status === 429) {
    const body = await response.json() as { errors?: Array<{ details?: { reset_in?: number } }> };
    const resetIn = body.errors?.[0]?.details?.reset_in ?? 60;
    console.log(`  ⏳ レート制限 → ${resetIn + 10}秒待機...`);
    await sleep((resetIn + 10) * 1000);
    return fetchPostById(id);
  }

  if (!response.ok) throw new Error(`PH GraphQLエラー (${response.status})`);

  const json = await response.json() as {
    data?: {
      post?: {
        url: string;
        website: string | null;
        productLinks: Array<{ url: string; type: string }> | null;
      } | null;
    };
  };

  const post = json.data?.post;
  if (!post) return null;

  // product.websiteUrl を優先（直接URL）、なければ post.website（リダイレクトURL）
  const directUrl = (post as unknown as { product?: { websiteUrl?: string } }).product?.websiteUrl;

  const links = post.productLinks ?? [];
  const iosUrl = links.find(l => l.type === 'ios_app' || l.url.includes('apps.apple.com'))?.url ?? null;
  const androidUrl = links.find(l => l.type === 'android_app' || l.url.includes('play.google.com'))?.url ?? null;

  // product.websiteUrl（直接URL）を優先、なければリダイレクト解決
  let website: string | null = directUrl ?? post.website;
  if (!website || website.includes('producthunt.com')) {
    website = await resolveRedirectUrl(post.website ?? '');
  }
  // リダイレクト解決も失敗した場合はPHページのHTMLから抽出
  if (!website) {
    website = await extractWebsiteFromPHPage(post.url);
  }

  // トラッキングパラメータ除去
  if (website) {
    try {
      const u = new URL(website);
      ['ref', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(p => u.searchParams.delete(p));
      website = u.toString();
    } catch { /* ignore */ }
  }

  return { website: website ?? null, ios_url: iosUrl, android_url: androidUrl, ph_url: post.url };
}

async function main() {
  console.log('🚀 AI Chronicle - 公式URL補完 開始');
  const db = D1Client.fromEnv();

  const tools = await db.query<{ id: string; name_en: string; product_hunt_id: string; product_hunt_url: string | null }>(
    `SELECT id, name_en, product_hunt_id, product_hunt_url
     FROM tools
     WHERE data_source = 'product_hunt_api'
       AND (official_url IS NULL OR official_url LIKE '%producthunt.com%')
       AND product_hunt_id IS NOT NULL
     ORDER BY name_en`
  );

  console.log(`\n対象ツール: ${tools.length}件\n`);

  let updated = 0, notFound = 0, errors = 0;

  for (const tool of tools) {
    console.log(`🔍 ${tool.name_en} (id=${tool.product_hunt_id})`);

    try {
      const result = await fetchPostById(tool.product_hunt_id, tool.product_hunt_url ?? undefined);

      if (!result || !result.website) {
        console.log(`  ❓ 公式URL未取得`);
        notFound++;
        await sleep(1000);
        continue;
      }

      await db.execute(
        `UPDATE tools SET
          official_url = ?,
          ios_url      = COALESCE(ios_url, ?),
          android_url  = COALESCE(android_url, ?),
          updated_at   = datetime('now')
         WHERE id = ?`,
        [result.website, result.ios_url, result.android_url, tool.id]
      );
      console.log(`  ✅ ${result.website}`);
      updated++;

    } catch (err) {
      console.error(`  ❌ ${err instanceof Error ? err.message : String(err)}`);
      errors++;
    }

    await sleep(1000);
  }

  console.log('\n========== 結果 ==========');
  console.log(`  ✅ 更新: ${updated}件`);
  console.log(`  ❓ URL未取得: ${notFound}件`);
  console.log(`  ❌ エラー: ${errors}件`);
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1); });
