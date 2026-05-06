'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { News, Locale } from '@/types';

const NEWS_TYPE_LABELS = {
  price_change: { ja: '価格改定', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)', border: 'rgba(252,211,77,0.3)' },
  new_tool:     { ja: '新機能',    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  new_feature:  { ja: '新機能',    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  other:        { ja: 'その他',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
} as const;

const PER_PAGE = 4;

interface ToolNewsSectionProps {
  news: News[];
  locale: Locale;
}

export default function ToolNewsSection({ news, locale }: ToolNewsSectionProps) {
  const [page, setPage] = useState(0);
  if (news.length === 0) return null;

  const totalPages = Math.ceil(news.length / PER_PAGE);
  const paged = news.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const BTN = (disabled: boolean): React.CSSProperties => ({
    padding: '4px 14px', fontSize: '0.78rem',
    background: disabled ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)',
    color: disabled ? '#4A5568' : '#008CED',
    border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'Fira Sans, sans-serif',
  });

  return (
    <div>
      <h2 className="section-label mb-3">このツールのニュース</h2>
      <div style={{ overflow: 'hidden', borderRadius: '4px', border: '1px solid rgba(0,140,237,0.08)' }}>
        {paged.map((item, i) => {
          const typeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
          const badge = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;
          return (
            <Link key={item.id} href={`/news/${item.slug}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg)]"
              style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none' }}>
              <time style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: '#4A5568', whiteSpace: 'nowrap' }}>
                {item.published_at?.substring(0, 10)}
              </time>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap', border: `1px solid ${badge.border}` }}>
                {badge.ja}
              </span>
              <span className="flex-1 text-sm truncate group-hover:text-[var(--color-accent)]" style={{ color: 'var(--color-text)' }}>
                {item.title_ja}
              </span>
              <span style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>→</span>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', paddingTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={BTN(page === 0)}>← 前へ</button>
          <span style={{ fontSize: '0.78rem', color: '#6B7280', fontFamily: 'Fira Sans, monospace' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={BTN(page === totalPages - 1)}>次へ →</button>
        </div>
      )}
    </div>
  );
}
