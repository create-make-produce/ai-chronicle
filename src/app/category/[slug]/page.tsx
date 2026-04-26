export const runtime = 'edge';

// src/app/category/[slug]/page.tsx
// カテゴリページ（日本語）

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CategoryContent from '@/components/CategoryContent';
import {
  getCategoryBySlug,
  getToolsByCategory,
  getToolCountByCategory,
  getAllCategories,
} from '@/lib/db';

interface Params {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: `${cat.name_ja}のAIツール一覧・比較`,
    description: cat.description_ja || `${cat.name_ja}カテゴリのAIツール一覧・料金比較。`,
    alternates: {
      canonical: `/category/${cat.slug}`,
      languages: {
        ja: `/category/${cat.slug}`,
        en: `/en/category/${cat.slug}`,
      },
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const [tools, totalCount] = await Promise.all([
    getToolsByCategory(cat.slug, 60, 0),
    getToolCountByCategory(cat.slug),
  ]);

  return <CategoryContent category={cat} tools={tools} locale="ja" totalCount={totalCount} />;
}
