// src/app/en/category/[slug]/page.tsx

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CategoryContent from '@/components/CategoryContent';
import {
  getCategoryBySlug,
  getToolsByCategory,
  getToolCountByCategory,
  getAllCategories,
} from '@/lib/db';

export const revalidate = 3600;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const cats = await getAllCategories();
    return cats.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: `${cat.name_en} AI Tools - Compare & Review`,
    description: cat.description_en || `Browse and compare ${cat.name_en} AI tools with pricing.`,
    alternates: {
      canonical: `/en/category/${cat.slug}`,
      languages: {
        ja: `/category/${cat.slug}`,
        en: `/en/category/${cat.slug}`,
      },
    },
  };
}

export default async function CategoryPageEn({ params }: Params) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const [tools, totalCount] = await Promise.all([
    getToolsByCategory(cat.slug, 60, 0),
    getToolCountByCategory(cat.slug),
  ]);

  return <CategoryContent category={cat} tools={tools} locale="en" totalCount={totalCount} />;
}
