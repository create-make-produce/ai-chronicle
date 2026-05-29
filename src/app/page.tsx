// src/app/page.tsx
export const dynamic = 'force-dynamic';

import HomeContent from '@/components/HomeContent';
import {
  getToolCount,
  getLatestNews,
  getRecentlyUpdatedTools,
  getCategoriesWithCount,
  getRecentPriceChanges,
  getTopNoteArticlesByCategory,
  getAllFeatures,
} from '@/lib/db';
import { CONFIG } from '@/config';

export default async function HomePage() {
  const [toolCount, latestNews, newTools, categories, priceChangesRaw, categoryNotes, allFeatures] = await Promise.all([
    getToolCount(),
    getLatestNews(CONFIG.NEWS_TOP_DISPLAY_COUNT),
    getRecentlyUpdatedTools(9),
    getCategoriesWithCount(),
    getRecentPriceChanges(CONFIG.PRICE_CHANGE_ALERT_DAYS, 5),
    getTopNoteArticlesByCategory(10),
    getAllFeatures().catch(() => []),
  ]);

  const priceChanges = priceChangesRaw.map((p) => ({
    tool_slug: p.tool_slug,
    tool_name_ja: p.tool_name_ja,
    tool_name_en: p.tool_name_en,
    plan_name: p.plan_name,
    price_usd: p.price_usd,
    previous_price_usd: p.previous_price_usd,
    price_trend: p.price_trend,
    price_changed_at: p.price_changed_at,
  }));

  return (
    <HomeContent
      locale="ja"
      stats={{
        toolCount,
        newToday: newTools.length,
        recentlyUpdated: priceChanges.length,
      }}
      latestNews={latestNews}
      newTools={newTools}
      categories={categories}
      priceChanges={priceChanges}
      categoryNotes={categoryNotes}
      topFeatures={allFeatures.slice(0, 4) as any}
    />
  );
}
