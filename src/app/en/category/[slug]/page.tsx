export const runtime = 'edge';

// src/app/en/page.tsx
// Home page (English)

import HomeContent from '@/components/HomeContent';
import {
  getToolCount,
  getLatestNews,
  getRecentlyUpdatedTools,
  getCategoriesWithCount,
  getRecentPriceChanges,
} from '@/lib/db';
import { CONFIG } from '@/config';

export const revalidate = 1800;

export const metadata = {
  title: 'AI Chronicle - AI Tools Pricing Database',
  description:
    'Bilingual (JP/EN) AI tools pricing database. Accurate USD and Japan official prices, updated daily.',
};

export default async function HomePageEn() {
  const [toolCount, latestNews, newTools, categories, priceChangesRaw] = await Promise.all([
    getToolCount(),
    getLatestNews(CONFIG.NEWS_TOP_DISPLAY_COUNT),
    getRecentlyUpdatedTools(9),
    getCategoriesWithCount(),
    getRecentPriceChanges(CONFIG.PRICE_CHANGE_ALERT_DAYS, 5),
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
      locale="en"
      stats={{
        toolCount,
        newToday: newTools.length,
        recentlyUpdated: priceChanges.length,
      }}
      latestNews={latestNews}
      newTools={newTools}
      categories={categories}
      priceChanges={priceChanges}
    />
  );
}
