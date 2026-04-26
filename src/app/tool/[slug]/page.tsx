export const runtime = 'edge';

// src/app/tool/[slug]/page.tsx
// ツール詳細（日本語）

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolDetailContent from '@/components/ToolDetailContent';
import { getToolDetailBySlug, getRelatedTools, getAllToolSlugs } from '@/lib/db';
import { CONFIG } from '@/config';

export const revalidate = 86400; // 24時間

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllToolSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) return {};
  const name = tool.name_ja;
  const tagline = tool.tagline_ja || '';
  return {
    title: `${name}の料金・評判・使い方`,
    description: tagline || `${name}の機能・料金プラン・使い方を詳細解説。USD・日本円価格を併記。`,
    alternates: {
      canonical: `/tool/${tool.slug}`,
      languages: {
        ja: `/tool/${tool.slug}`,
        en: `/en/tool/${tool.slug}`,
      },
    },
  };
}

export default async function ToolDetailPage({ params }: Params) {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) notFound();

  const related = await getRelatedTools(tool.category_id, tool.id, 6);

  return <ToolDetailContent tool={tool} relatedTools={related} locale="ja" />;
}
