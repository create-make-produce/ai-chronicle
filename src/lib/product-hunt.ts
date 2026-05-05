// =============================================
// AI Chronicle - Product Hunt APIクライアント
// =============================================

import { CONFIG } from '../config';

/**
 * Product Huntの投稿データ型
 */
export interface ProductHuntPost {
  id: string;               // post ID（ローンチ単位）
  name: string;
  slug: string;             // post slug
  tagline: string;
  description: string | null;
  url: string;              // PHローンチページURL
  website: string | null;   // ローンチ固有の公式URL
  votesCount: number;
  createdAt: string;
  thumbnail: { url: string } | null;
  topics: Array<{ name: string; slug: string }>;
  ios_url: string | null;
  android_url: string | null;
  // 製品単位の情報（ローンチ照合に使用）
  product_id: string | null;    // Product ID（製品単位）
  product_slug: string | null;  // Product slug（照合キー: "claude", "chatgpt"等）
  product_url: string | null;   // PHの製品ページURL
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.PRODUCT_HUNT_API_KEY;
  const clientSecret = process.env.PRODUCT_HUNT_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('環境変数 PRODUCT_HUNT_API_KEY / PRODUCT_HUNT_API_SECRET が必要です');
  }

  const response = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Product Hunt認証エラー (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  return json.access_token;
}

async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Product Hunt GraphQLエラー (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Product Hunt GraphQLエラー: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  if (!json.data) {
    throw new Error('Product Hunt GraphQL: dataが空です');
  }

  return json.data;
}

async function resolveRedirectUrl(redirectUrl: string): Promise<string | null> {
  if (!redirectUrl || !redirectUrl.includes('producthunt.com')) {
    return redirectUrl;
  }

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
  } catch {
    return null;
  }
}

function stripTrackingParams(url: string): string {
  try {
    const u = new URL(url);
    ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

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
    if (jsonMatch) return stripTrackingParams(jsonMatch[1]);

    const btnMatch = html.match(/data-test="visit-website-button"[^>]*href="([^"]+)"/);
    if (btnMatch) return stripTrackingParams(btnMatch[1]);

    const primaryMatch = html.match(/"primaryLink":\{"__typename":"ProductLink","id":"[^"]+","url":"(https?:\/\/[^"]+)"\}/);
    if (primaryMatch) return stripTrackingParams(primaryMatch[1]);

    // 方法4: href に ref=producthunt が付いた外部リンク（Plurai等で確認）
    const refHrefMatch = html.match(/href="(https?:\/\/(?!(?:www\.)?producthunt\.com)[^"]+ref=producthunt[^"]*)"/);
    if (refHrefMatch) return stripTrackingParams(refHrefMatch[1]);

    return null;
  } catch {
    return null;
  }
}

/**
 * GraphQL ノードの共通型
 */
type RawPostNode = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string | null;
  url: string;
  website: string | null;
  productLinks: Array<{ url: string; type: string }> | null;
  votesCount: number;
  createdAt: string;
  thumbnail: { url: string } | null;
  topics: { edges: Array<{ node: { name: string; slug: string } }> };
};

/**
 * 共通エッジ処理（fetchLatestPosts / fetchTopAIPosts 両方で使用）
 */
async function processPostNode(node: RawPostNode): Promise<ProductHuntPost> {
  const productLinks = node.productLinks ?? [];
  const homepage = productLinks.find(l => l.type === 'homepage')?.url
    ?? productLinks[0]?.url
    ?? null;
  let website: string | null = node.website ?? homepage ?? null;

  if (website && website.includes('producthunt.com')) {
    const resolved = await resolveRedirectUrl(website);
    website = resolved ?? null;
  }

  if (!website) {
    website = await extractWebsiteFromPHPage(node.url);
  }

  if (website) {
    website = stripTrackingParams(website);
  }

  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    tagline: node.tagline,
    description: node.description,
    url: node.url,
    website,
    votesCount: node.votesCount,
    createdAt: node.createdAt,
    thumbnail: node.thumbnail,
    topics: node.topics.edges.map((t) => t.node),
    ios_url: productLinks.find(l =>
      l.type === 'ios_app' || l.url.includes('apps.apple.com')
    )?.url ?? null,
    android_url: productLinks.find(l =>
      l.type === 'android_app' || l.url.includes('play.google.com')
    )?.url ?? null,
    // ph_slugはAPI経由では取得不可（管理画面から手動設定）
    product_id: null,
    product_slug: null,
    product_url: null,
  };
}

/**
 * 共通フィールド定義（product情報を含む）
 */
const POST_FIELDS = `
  id name slug tagline description url website
  productLinks { url type }
  votesCount createdAt
  thumbnail { url }
  topics(first: 5) { edges { node { name slug } } }
`;

/**
 * 最新投稿を取得（collect-new-toolsで使用）
 */
export async function fetchLatestPosts(): Promise<ProductHuntPost[]> {
  const query = `
    query RecentPosts($first: Int!) {
      posts(first: $first, order: NEWEST) {
        edges { node { ${POST_FIELDS} } }
      }
    }
  `;

  type ResponseType = {
    posts: { edges: Array<{ node: RawPostNode }> };
  };

  const data = await graphqlQuery<ResponseType>(query, {
    first: CONFIG.PRODUCT_HUNT_POSTS_PER_REQUEST,
  });

  return Promise.all(data.posts.edges.map(e => processPostNode(e.node)));
}

/**
 * AIカテゴリ関連のトピックキーワード
 */
const AI_TOPIC_KEYWORDS = [
  'artificial-intelligence', 'ai', 'machine-learning', 'chatbots',
  'gpt', 'llm', 'generative-ai', 'ai-tools', 'ai-assistant',
  'no-code-ai', 'ai-powered',
];

export function isAITool(post: ProductHuntPost): boolean {
  const topicSlugs = post.topics.map((t) => t.slug.toLowerCase());
  const hasAITopic = topicSlugs.some((slug) =>
    AI_TOPIC_KEYWORDS.some((kw) => slug.includes(kw))
  );
  if (hasAITopic) return true;

  const text = `${post.tagline} ${post.description ?? ''}`.toLowerCase();
  return /\b(ai|gpt|llm|chatbot|machine learning|generative)\b/i.test(text);
}

/**
 * AIツールの最新投稿のみに絞り込む（collect-new-toolsで使用）
 */
export async function fetchLatestAIPosts(): Promise<ProductHuntPost[]> {
  const posts = await fetchLatestPosts();
  return posts
    .filter((p) => p.votesCount >= CONFIG.PRODUCT_HUNT_MIN_VOTES)
    .filter(isAITool);
}

/**
 * AI topic の人気上位ツールを取得（seed-ph-top100で使用）
 */
type TopAIResponse = {
  posts: {
    edges: Array<{ node: RawPostNode }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

export async function fetchTopAIPosts(count: number = 100): Promise<ProductHuntPost[]> {
  const perPage = 50;
  const pages = Math.ceil(count / perPage);
  const allPosts: ProductHuntPost[] = [];
  let cursor: string | null = null;

  const query = `
    query TopAIPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after, topic: "artificial-intelligence", order: VOTES) {
        edges { node { ${POST_FIELDS} } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  for (let page = 0; page < pages; page++) {
    console.log(`  PH API取得中... ${page + 1}/${pages}ページ`);

    const result: TopAIResponse = await graphqlQuery<TopAIResponse>(query, {
      first: perPage,
      after: cursor ?? undefined,
    });

    const posts = await Promise.all(
      result.posts.edges.map(e => processPostNode(e.node))
    );
    allPosts.push(...posts);

    const pageInfo = result.posts.pageInfo;
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break;
    cursor = pageInfo.endCursor;

    if (page < pages - 1) await new Promise(r => setTimeout(r, 1500));
  }

  return allPosts.slice(0, count);
}
