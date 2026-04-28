export const runtime = 'edge';

// src/app/sitemap.ts
// サイトマップ自動生成：JP/EN 両方のURLを列挙

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
    '/new',
    '/free',
    '/about',
    '/privacy',
    '/contact',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) => [
    {
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1.0 : 0.7,
    },
    // ENは /contact と /privacy はJPと同一ページなのでスキップ
    ...(path === '/contact' || path === '/privacy'
      ? []
      : [
          {
            url: `${SITE_URL}/en${path}`,
            lastModified: now,
            changeFrequency: 'daily' as const,
            priority: path === '' ? 1.0 : 0.7,
          },
        ]),
  ]);

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

    toolEntries = toolSlugs.flatMap((slug) => [
      {
        url: `${SITE_URL}/tool/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/en/tool/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ]);

    categoryEntries = categories.flatMap((cat) => [
      {
        url: `${SITE_URL}/category/${cat.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/en/category/${cat.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
    ]);

    newsEntries = newsSlugs.flatMap((slug) => [
      {
        url: `${SITE_URL}/news/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/en/news/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
    ]);
  } catch (e) {
    console.error('[sitemap] failed to fetch dynamic entries:', e);
  }

  return [...staticEntries, ...toolEntries, ...categoryEntries, ...newsEntries];
}
