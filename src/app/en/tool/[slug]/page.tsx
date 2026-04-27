export const runtime = 'edge';

// src/app/en/tool/[slug]/page.tsx
// Tool detail (English)

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
      next: { revalidate: 3600 },
    }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

async function getToolNews(toolId: string) {
  return queryD1(
    `SELECT * FROM news
     WHERE tool_id = ? AND is_published = 1
     ORDER BY published_at DESC
     LIMIT 5`,
    [toolId]
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) return {};
  const name = tool.name_en;
  const tagline = tool.tagline_en || '';
  return {
    title: `${name} - Pricing, Reviews & Features`,
    description: tagline || `${name}: features, pricing plans, and usage. USD and JPY pricing.`,
    alternates: {
      canonical: `/en/tool/${tool.slug}`,
      languages: {
        ja: `/tool/${tool.slug}`,
        en: `/en/tool/${tool.slug}`,
      },
    },
  };
}

export default async function ToolDetailPageEn({ params }: Params) {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) notFound();

  const [related, toolNews] = await Promise.all([
    getRelatedTools(tool.category_id, tool.id, 6),
    getToolNews(tool.id),
  ]);

  return <ToolDetailContent tool={tool} relatedTools={related} locale="en" toolNews={toolNews} />;
}
