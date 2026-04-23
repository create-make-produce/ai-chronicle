// =============================================
// AI Chronicle - Product Hunt APIクライアント
// =============================================
// Product Hunt v2 API（GraphQL）を使用
// Client Credentials方式でアクセストークンを取得
// =============================================

import { CONFIG } from '../config';

/**
 * Product Huntの投稿データ型
 */
export interface ProductHuntPost {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string | null;
  url: string;                    // Product HuntページURL
  website: string | null;         // 公式サイトURL
  votesCount: number;
  createdAt: string;              // ISO8601
  thumbnail: { url: string } | null;
  topics: Array<{ name: string; slug: string }>;
}

/**
 * アクセストークンキャッシュ
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Client Credentials方式でアクセストークン取得
 */
async function getAccessToken(): Promise<string> {
  // キャッシュが有効ならそれを返す
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.PRODUCT_HUNT_API_KEY;
  const clientSecret = process.env.PRODUCT_HUNT_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      '環境変数 PRODUCT_HUNT_API_KEY / PRODUCT_HUNT_API_SECRET が必要です'
    );
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
    token_type: string;
    expires_in: number;
  };

  // 有効期限（秒）→ 絶対時刻（ms）
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  return json.access_token;
}

/**
 * GraphQLクエリを実行
 */
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
    throw new Error(
      `Product Hunt GraphQLエラー: ${json.errors.map((e) => e.message).join(', ')}`
    );
  }

  if (!json.data) {
    throw new Error('Product Hunt GraphQL: dataが空です');
  }

  return json.data;
}


/**
 * Product HuntのリダイレクトURLを実際の公式URLに解決する
 * HEADリクエストでリダイレクト先を追いかける
 * 失敗した場合はnullを返す（処理は続行）
 */
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Chronicle-Bot/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const finalUrl = response.url;

    // リダイレクト先がまだProduct HuntのURLなら失敗とみなす
    if (finalUrl.includes('producthunt.com')) {
      return null;
    }

    return finalUrl;
  } catch {
    return null;
  }
}

/**
 * 最新投稿を取得
 * AIカテゴリ関連のトピックでフィルタリング
 */
export async function fetchLatestPosts(): Promise<ProductHuntPost[]> {
  const query = `
    query RecentPosts($first: Int!) {
      posts(first: $first, order: NEWEST) {
        edges {
          node {
            id
            name
            slug
            tagline
            description
            url
            website
            votesCount
            createdAt
            thumbnail { url }
            topics(first: 5) {
              edges { node { name slug } }
            }
          }
        }
      }
    }
  `;

  type ResponseType = {
    posts: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          slug: string;
          tagline: string;
          description: string | null;
          url: string;
          website: string | null;
          votesCount: number;
          createdAt: string;
          thumbnail: { url: string } | null;
          topics: { edges: Array<{ node: { name: string; slug: string } }> };
        };
      }>;
    };
  };

  const data = await graphqlQuery<ResponseType>(query, {
    first: CONFIG.PRODUCT_HUNT_POSTS_PER_REQUEST,
  });

  // websiteフィールドのリダイレクトURLを実際の公式URLに解決
  const posts = await Promise.all(
    data.posts.edges.map(async (edge) => {
      let website = edge.node.website;

      // Product HuntのリダイレクトURLなら実際のURLに解決
      if (website && website.includes('producthunt.com')) {
        const resolved = await resolveRedirectUrl(website);
        website = resolved;
      }

      return {
        id: edge.node.id,
        name: edge.node.name,
        slug: edge.node.slug,
        tagline: edge.node.tagline,
        description: edge.node.description,
        url: edge.node.url,
        website,
        votesCount: edge.node.votesCount,
        createdAt: edge.node.createdAt,
        thumbnail: edge.node.thumbnail,
        topics: edge.node.topics.edges.map((t) => t.node),
      };
    })
  );

  return posts;
}

/**
 * AIカテゴリ関連のトピックキーワード
 * これらのいずれかに該当するトピックがあればAI関連と判定
 */
const AI_TOPIC_KEYWORDS = [
  'artificial-intelligence',
  'ai',
  'machine-learning',
  'chatbots',
  'gpt',
  'llm',
  'generative-ai',
  'ai-tools',
  'ai-assistant',
  'no-code-ai',
  'ai-powered',
];

/**
 * 投稿がAI関連か判定
 */
export function isAITool(post: ProductHuntPost): boolean {
  const topicSlugs = post.topics.map((t) => t.slug.toLowerCase());
  const hasAITopic = topicSlugs.some((slug) =>
    AI_TOPIC_KEYWORDS.some((kw) => slug.includes(kw))
  );

  if (hasAITopic) return true;

  // フォールバック：taglineやdescriptionにAIキーワードが含まれる
  const text = `${post.tagline} ${post.description ?? ''}`.toLowerCase();
  return /\b(ai|gpt|llm|chatbot|machine learning|generative)\b/i.test(text);
}

/**
 * AIツールの投稿のみに絞り込む
 */
export async function fetchLatestAIPosts(): Promise<ProductHuntPost[]> {
  const posts = await fetchLatestPosts();
  return posts
    .filter((p) => p.votesCount >= CONFIG.PRODUCT_HUNT_MIN_VOTES)
    .filter(isAITool);
}
