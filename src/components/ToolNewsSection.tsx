'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { News, Locale } from '@/types';

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
    color: disabled ? 'var(--color-text-muted)' : '#008CED',
    border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'Fira Sans, sans-serif',
  });

  return (
    <div>
      <h2 className="section-label mb-3">このツールのニュース</h2>
      <div style={{ overflow: 'hidden', borderRadius: '4px', border: '1px solid var(--color-note-card-border)' }}>
        {paged.map((item, i) => {
          return (
            <Link key={item.id} href={`/news/${item.slug}`}
              style={{ display: 'block', padding: '0.75rem 1rem', borderBottom: i < paged.length - 1 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-row-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <time style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: 'var(--color-text-timestamp)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {item.published_at?.substring(0, 10)}
                </time>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontFamily: 'Noto Sans JP, sans-serif', lineHeight: 1.5, flex: '1 1 200px' }}>
                  {item.title_ja}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', paddingTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={BTN(page === 0)}>← 前へ</button>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'Fira Sans, monospace' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={BTN(page === totalPages - 1)}>次へ →</button>
        </div>
      )}
    </div>
  );
}
