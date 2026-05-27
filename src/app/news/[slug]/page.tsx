export const runtime = 'edge';

// src/app/news/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import NewsDetailContent from '@/components/NewsDetailContent';
import { getNewsBySlug, batchQueryD1 } from '@/lib/db';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) return {};
  return {
    title:       news.title_ja,
    description: (news.body_ja || '').slice(0, 120),
    alternates:  {
      canonical: `/news/${news.slug}`,
      languages: { ja: `/news/${news.slug}`, en: `/en/news/${news.slug}` },
    },
  };
}

export default async function NewsDetailPage({ params }: Params) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);
  if (!news) notFound();

  // tool取得 + 関連ニュース取得を1HTTPリクエストにまとめる
  const [toolRows, relatedNewsRows] = await batchQueryD1([
    news.tool_id
      ? { sql: `SELECT * FROM tools WHERE id = ? AND is_published = 1 AND status != 'archived' AND admin_checked = 1 LIMIT 1`, params: [news.tool_id] }
      : { sql: `SELECT 1 WHERE 0` },
    news.tool_id
      ? { sql: `SELECT * FROM news WHERE is_published = 1 AND tool_id = ? AND id != ? ORDER BY published_at DESC LIMIT 3`, params: [news.tool_id, news.id] }
      : { sql: `SELECT 1 WHERE 0` },
  ]);

  const relatedTool = (toolRows[0] as any) ?? null;
  const relatedNews = relatedNewsRows as any[];

  return <NewsDetailContent news={news} relatedTool={relatedTool} relatedNews={relatedNews} locale="ja" />;
}
