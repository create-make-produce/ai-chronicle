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
    <main className="flex-1" style={{ background: 'var(--color-page-gradient)' }}>
      <div className="max-w-4xl mx-auto section-px pt-10 pb-4">
        <h1 className="hero-title text-4xl sm:text-5xl mt-3 mb-3">{tt.secLatestNews}</h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-sub)' }}>
          {locale === 'ja'
            ? '新機能・アップデート・価格改定に関する最新情報。'
            : 'New releases, price updates, and feature announcements for AI tools.'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto section-px pb-16">
        <AdSlot slot="header" className="mb-8" />

        {news.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '2px' }}>
            {tt.emptyNews}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {grouped.map(({ month, items }) => (
              <section key={month}>
                <h2 style={{ fontFamily: 'Fira Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--color-text-sub)', marginBottom: '0.75rem' }}>
                  {month}
                </h2>
                <div style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  {items.map((item, idx) => (
                    <NewsListRow key={item.id} item={item} locale={locale} isLast={idx === items.length - 1} tt={tt} />
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

function NewsListRow({ item, locale, isLast, tt }: { item: News; locale: Locale; isLast: boolean; tt: TDict }) {
  const NEWS_TYPE_LABELS = {
    price_change: { ja: '料金改定', en: 'Price Change', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)', border: 'rgba(252,211,77,0.3)' },
    new_tool:     { ja: '新ツール', en: 'New Tool',     color: '#FB7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)' },
    new_feature:  { ja: '新機能',   en: 'New Feature',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
    other:        { ja: 'その他',   en: 'Other',        color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
  } as const;
  const typeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
  const badge = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;

  return (
    <Link
      href={localizedPath(locale, `/news/${item.slug}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0.75rem 1rem', textDecoration: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-row-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <time style={{ flexShrink: 0, fontFamily: 'Fira Sans, monospace', fontSize: '0.75rem', color: 'var(--color-text-timestamp)' }}>
        {formatDateShort(item.published_at)}
      </time>
      <span style={{
        flexShrink: 0, fontSize: '0.65rem', fontWeight: 700,
        color: badge.color, background: badge.bg,
        padding: '2px 7px', borderRadius: '3px', border: `1px solid ${badge.border}`,
        letterSpacing: '0.05em',
      }}>
        {locale === 'ja' ? badge.ja : badge.en}
      </span>
      <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {locale === 'ja' ? item.title_ja : item.title_en || item.title_ja}
      </span>
    </Link>
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
