// src/components/NewsListContent.tsx
import Link from 'next/link';
import type { Locale, News } from '@/types';
import { t, type TDict, localizedPath, formatDateShort } from '@/lib/i18n';
import AdSlot from './AdSlot';

interface NewsListContentProps {
  news: News[];
  locale: Locale;
}

export default function NewsListContent({ news, locale }: NewsListContentProps) {
  const tt = t[locale];

  const grouped = groupByMonth(news);

  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 pt-10 pb-4">
        <h1 className="hero-title text-4xl sm:text-5xl mt-3 mb-3">{tt.secLatestNews}</h1>
        <p className="text-base text-[var(--color-text-sub)]">
          {locale === 'ja'
            ? '新機能・アップデート・価格改定に関する最新情報。'
            : 'New releases, price updates, and feature announcements for AI tools.'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 pb-16">
        <AdSlot slot="header" className="mb-8" />

        {news.length === 0 ? (
          <div className="py-16 text-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-sm">
            {tt.emptyNews}
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(({ month, items }) => (
              <section key={month}>
                <h2 className="font-display text-lg tracking-tight text-[var(--color-text-sub)] mb-3">
                  {month}
                </h2>
                <div className="bg-white border border-[var(--color-border)] rounded-sm divide-y divide-[var(--color-border)]">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={localizedPath(locale, `/news/${item.slug}`)}
                      className="group flex items-center gap-4 px-4 py-3 hover:bg-[var(--color-bg-sub)] transition-colors"
                    >
                      <time className="shrink-0 w-20 text-xs font-mono text-[var(--color-text-muted)]">
                        {formatDateShort(item.published_at)}
                      </time>
                      <span className="shrink-0 badge badge-outline uppercase tracking-wider text-[10px]">
                        {newsTypeLabel(item.news_type, tt)}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {locale === 'ja' ? item.title_ja : item.title_en || item.title_ja}
                      </span>
                      <span className="shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function groupByMonth(items: News[]): Array<{ month: string; items: News[] }> {
  const map = new Map<string, News[]>();
  for (const n of items) {
    const d = new Date(n.published_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, items]) => ({ month, items }));
}

function newsTypeLabel(type: string, tt: TDict): string {
  switch (type) {
    case 'price_change': return tt.newsTypePriceChange;
    case 'new_tool':     return tt.newsTypeNewTool;
    case 'new_feature':  return tt.newsTypeNewFeature;
    default:             return tt.newsTypeOther;
  }
}
