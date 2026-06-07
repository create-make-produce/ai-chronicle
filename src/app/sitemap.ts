// src/app/sitemap.ts - updated
import type { MetadataRoute } from 'next';
import { getAllToolSlugs, getAllNewsSlugs, getAllCategories, getAllFeaturesLight } from '@/lib/db';

const SITE_URL = 'https://ai-chron.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 固定ページ
  const staticPaths = [
    '',
    '/tools',
    '/news',
    '/monthly',
    '/features',
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
  let featureEntries: MetadataRoute.Sitemap = [];

  try {
    const [toolSlugs, categories, newsSlugs, features] = await Promise.all([
      getAllToolSlugs(),
      getAllCategories(),
      getAllNewsSlugs(),
      getAllFeaturesLight().catch(() => []),
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

    featureEntries = features.map((f) => ({
      url: `${SITE_URL}/feature/${f.slug}`,
      lastModified: new Date(f.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error('[sitemap] failed to fetch dynamic entries:', e);
  }

  return [...staticEntries, ...toolEntries, ...categoryEntries, ...newsEntries, ...featureEntries];
}
