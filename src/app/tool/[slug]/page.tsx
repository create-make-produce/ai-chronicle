export const runtime = 'edge';

// src/app/tool/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolDetailContent from '@/components/ToolDetailContent';
import { getToolDetailBySlug, getRelatedTools } from '@/lib/db';

interface Params {
  params: Promise<{ slug: string }>;
}

async function queryD1(sql: string, params: (string | number | null)[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

async function getToolNews(toolId: string) {
  return queryD1(
    `SELECT * FROM news WHERE tool_id = ? AND is_published = 1 ORDER BY published_at DESC LIMIT 5`,
    [toolId]
  );
}

async function getToolLaunches(toolId: string) {
  return queryD1(
    `SELECT * FROM tool_launches WHERE tool_id = ? ORDER BY launch_number DESC LIMIT 100`,
    [toolId]
  );
}

async function getNoteArticles(toolId: string) {
  return queryD1(
    `SELECT * FROM tool_note_articles WHERE tool_id = ? ORDER BY likes_count DESC, published_at DESC LIMIT 60`,
    [toolId]
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) return {};
  const name = tool.name_ja;
  const tagline = tool.tagline_ja || '';
  return {
    title: `${name}の料金・評判・使い方`,
    description: tagline || `${name}の機能・料金プラン・使い方を詳細解説。`,
    alternates: {
      canonical: `/tool/${tool.slug}`,
    },
  };
}

export default async function ToolDetailPage({ params }: Params) {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) notFound();

  const [related, toolNews, toolLaunches, noteArticles] = await Promise.all([
    getRelatedTools(tool.category_id, tool.id, 6),
    getToolNews(tool.id),
    getToolLaunches(tool.id),
    getNoteArticles(tool.id),
  ]);

  return (
    <ToolDetailContent
      tool={tool}
      relatedTools={related}
      locale="ja"
      toolNews={toolNews}
      toolLaunches={toolLaunches}
      noteArticles={noteArticles}
    />
  );
}
