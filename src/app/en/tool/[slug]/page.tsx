export const runtime = 'edge';

// src/app/en/tool/[slug]/page.tsx
// Tool detail (English)

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolDetailContent from '@/components/ToolDetailContent';
import { getToolDetailBySlug, getRelatedTools, getAllToolSlugs } from '@/lib/db';

export const revalidate = 86400;

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

  const related = await getRelatedTools(tool.category_id, tool.id, 6);

  return <ToolDetailContent tool={tool} relatedTools={related} locale="en" />;
}
