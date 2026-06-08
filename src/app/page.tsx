// src/app/page.tsx
import { CONFIG } from '@/config';
export const revalidate = CONFIG.REVALIDATE_TOP_PAGE_SECONDS;

import HomeContent from '@/components/HomeContent';
import {
  getToolCount,
  getLatestNews,
  getRecentlyUpdatedTools,
  getCategoriesWithCount,
  getTopNoteArticlesByCategory,
  getAllFeatures,
  getRecentFeatures,
} from '@/lib/db';

export default async function HomePage() {
  const [toolCount, latestNews, newTools, categories, categoryNotes, allFeatures, recentFeatures] = await Promise.all([
    getToolCount(),
    getLatestNews(CONFIG.NEWS_TOP_DISPLAY_COUNT),
    getRecentlyUpdatedTools(9),
    getCategoriesWithCount(),
    getTopNoteArticlesByCategory(10),
    getAllFeatures(4).catch(() => []),
    getRecentFeatures(30).catch(() => []),
  ]);

  return (
    <HomeContent
      locale="ja"
      stats={{
        toolCount,
        newToday: newTools.length,
        recentlyUpdated: 0,
      }}
      latestNews={latestNews}
      newTools={newTools}
      categories={categories}
      priceChanges={[]}
      categoryNotes={categoryNotes}
      topFeatures={allFeatures as any}
      recentFeatures={recentFeatures as any}
    />
  );
}
