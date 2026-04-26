export const runtime = 'edge';

// src/app/en/news/[slug]/page.tsx

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import NewsDetailContent from '@/components/NewsDetailContent';
import { getNewsBySlug, getAllNewsSlugs, getRelatedNews, getToolById } from '@/lib/db';

export const revalidate = 86400;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllNewsSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) return {};
  const title = news.title_en || news.title_ja;
  const body = news.body_en || news.body_ja || '';
  return {
    title,
    description: body.slice(0, 120),
    alternates: {
      canonical: `/en/news/${news.slug}`,
      languages: {
        ja: `/news/${news.slug}`,
        en: `/en/news/${news.slug}`,
      },
    },
  };
}

export default async function NewsDetailPageEn({ params }: Params) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) notFound();

  const [relatedTool, relatedNews] = await Promise.all([
    news.tool_id ? getToolById(news.tool_id) : Promise.resolve(null),
    getRelatedNews(news.tool_id, news.id, 3),
  ]);

  return <NewsDetailContent news={news} relatedTool={relatedTool} relatedNews={relatedNews} locale="en" />;
}
