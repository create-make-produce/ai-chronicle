// =============================================
// AI Chronicle - PH AIツール名前一覧確認
// =============================================
// 実行: tsx scripts/check-ph-names.ts
// DBへの書き込みなし・Gemini不使用・名前確認のみ
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

// =====================
// PH認証
// =====================

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PRODUCT_HUNT_API_KEY;
  const clientSecret = process.env.PRODUCT_HUNT_API_SECRET;
  if (!clientId || !clientSecret) throw new Error('PRODUCT_HUNT_API_KEY / PRODUCT_HUNT_API_SECRET が必要です');

  const res = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  });
  const json = await res.json() as { access_token: string };
  return json.access_token;
}

// =====================
// PH GraphQL
// =====================

interface PHPost {
  name: string;
  slug: string;
  votesCount: number;
  website: string | null;
  tagline: string;
  topics: string[];
}

async function fetchTopAINames(count: number): Promise<PHPost[]> {
  const token = await getAccessToken();
  const perPage = 50;
  const pages = Math.ceil(count / perPage);
  const all: PHPost[] = [];
  let cursor: string | null = null;

  const query = `
    query($first: Int!, $after: String) {
      posts(first: $first, after: $after, topic: "artificial-intelligence", order: VOTES) {
        edges {
          node {
            name slug votesCount website tagline
            topics(first: 3) { edges { node { name } } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  for (let page = 0; page < pages; page++) {
    const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { first: perPage, after: cursor ?? undefined } }),
    });
    const json = await res.json() as any;
    const edges = json.data?.posts?.edges ?? [];

    for (const { node } of edges) {
      all.push({
        name: node.name,
        slug: node.slug,
        votesCount: node.votesCount,
        website: node.website ?? null,
        tagline: node.tagline,
        topics: node.topics.edges.map((e: any) => e.node.name),
      });
    }

    const pageInfo = json.data?.posts?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) break;
    cursor = pageInfo.endCursor;
    await new Promise(r => setTimeout(r, 500));
  }

  return all.slice(0, count);
}

// =====================
// main
// =====================

async function main() {
  const COUNT = 100;
  console.log(`📡 PH AI Top ${COUNT} 名前一覧取得中...\n`);

  const posts = await fetchTopAINames(COUNT);

  console.log(`${'#'.padEnd(4)} ${'ツール名'.padEnd(35)} ${'votes'.padEnd(8)} ${'公式URL'.padEnd(6)} topics`);
  console.log('─'.repeat(90));

  posts.forEach((p, i) => {
    const hasUrl = p.website ? '✅' : '❌';
    const num = String(i + 1).padEnd(3);
    const name = p.name.substring(0, 33).padEnd(35);
    const votes = String(p.votesCount).padEnd(8);
    const topics = p.topics.join(', ');
    console.log(`${num} ${name} ${votes} ${hasUrl}     ${topics}`);
  });

  const withUrl = posts.filter(p => p.website).length;
  console.log('\n─'.repeat(90));
  console.log(`合計: ${posts.length}件 / 公式URL取得可能: ${withUrl}件 / URLなし: ${posts.length - withUrl}件`);

  // 知名度が高そうなキーワードでフィルタして表示
  const known = ['ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'Stable Diffusion', 'GitHub Copilot',
    'Cursor', 'Notion', 'Perplexity', 'ElevenLabs', 'Runway', 'Suno', 'Pika', 'DALL-E',
    'Grammarly', 'Otter', 'Synthesia', 'HeyGen', 'Replit', 'Tabnine', 'Codeium', 'v0',
    'Bolt', 'Lovable', 'Grok', 'Copilot', 'Firefly', 'Canva', 'Zapier', 'Make'];

  const matched = posts.filter(p => known.some(k => p.name.toLowerCase().includes(k.toLowerCase())));
  if (matched.length > 0) {
    console.log(`\n✅ 有名ツールのマッチ（${matched.length}件）:`);
    matched.forEach(p => console.log(`  - ${p.name} (votes: ${p.votesCount})`));
  } else {
    console.log('\n⚠️  有名ツールが上位100件にほぼ含まれていません → votes順は不適切かも');
  }
}

main().catch(e => { console.error('❌', e); process.exit(1); });
