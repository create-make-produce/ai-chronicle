// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getAllToolSlugs, getAllNewsSlugs, getAllCategories } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-chronicle-76h.pages.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 固定ページ
  const staticPaths = [
    '',
    '/tools',
    '/news',
    '/monthly',
    '/about',
    '/privacy',
    '/contact',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1.0 : 0.7,
  }));

  // 動的ページ（DB取得失敗時はスキップ）
  let toolEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];
  let newsEntries: MetadataRoute.Sitemap = [];

  try {
    const [toolSlugs, categories, newsSlugs] = await Promise.all([
      getAllToolSlugs(),
      getAllCategories(),
      getAllNewsSlugs(),
    ]);

    toolEntries = toolSlugs.map((slug) => ({
      url: `${SITE_URL}/tool/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    categoryEntries = categories.map((cat) => ({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    newsEntries = newsSlugs.map((slug) => ({
      url: `${SITE_URL}/news/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch (e) {
    console.error('[sitemap] failed to fetch dynamic entries:', e);
  }

  return [...staticEntries, ...toolEntries, ...categoryEntries, ...newsEntries];
}
