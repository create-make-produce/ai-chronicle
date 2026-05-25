'use client';
import Link from 'next/link';
import { useState } from 'react';

const NEWS_TYPE_LABELS = {
  price_change: {
    ja: '料金改定', en: 'Price Change',
    color:  'var(--color-news-price-change)',
    bg:     'var(--color-news-price-change-bg)',
    border: 'var(--color-news-price-change-border)',
  },
  new_tool: {
    ja: '新ツール', en: 'New Tool',
    color:  'var(--color-news-new-tool)',
    bg:     'var(--color-news-new-tool-bg)',
    border: 'var(--color-news-new-tool-border)',
  },
  new_feature: {
    ja: '新機能', en: 'New Feature',
    color:  'var(--color-news-new-feature)',
    bg:     'var(--color-news-new-feature-bg)',
    border: 'var(--color-news-new-feature-border)',
  },
  other: {
    ja: 'その他', en: 'Other',
    color:  'var(--color-news-other)',
    bg:     'var(--color-news-other-bg)',
    border: 'var(--color-news-other-border)',
  },
} as const;

interface NewsRowProps {
  item: {
    id: string;
    slug: string;
    title_ja: string;
    title_en?: string;
    news_type: string;
    published_at: string;
    tool_name_ja?: string;
    tool_name_en?: string;
    tool_logo_url?: string;
  };
  href: string;
  lang: 'ja' | 'en';
  isLast: boolean;
}

export default function NewsRow({ item, href, lang, isLast }: NewsRowProps) {
  const [hovered, setHovered] = useState(false);
  const typeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
  const badge = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;
  const title = lang === 'en' ? (item.title_en || item.title_ja) : item.title_ja;
  const toolName = lang === 'en' ? item.tool_name_en : item.tool_name_ja;
  const badgeLabel = lang === 'en' ? badge.en : badge.ja;
  const date = (() => {
    try {
      const raw = item.published_at?.includes('Z') ? item.published_at : item.published_at?.replace(' ', 'T') + 'Z';
      const d = new Date(raw);
      const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${jst.getUTCFullYear()}/${pad(jst.getUTCMonth()+1)}/${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
    } catch { return item.published_at?.substring(0, 10) ?? ''; }
  })();
  const logoUrl = item.tool_logo_url ?? null;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="news-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 145px 1fr',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        borderLeft: `3px solid ${badge.color}`,
        textDecoration: 'none',
        background: hovered ? 'var(--color-row-hover)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* バッジ */}
      <span style={{
        fontFamily:    'Fira Sans, sans-serif',
        fontSize:      '0.7rem',
        fontWeight:    700,
        color:         badge.color,
        background:    badge.bg,
        padding:       '2px 8px',
        borderRadius:  '3px',
        whiteSpace:    'nowrap',
        border:        `1px solid ${badge.border}`,
      }}>
        {badgeLabel}
      </span>

      {/* 日時 */}
      <span className="news-date" style={{
        fontFamily:    'Fira Sans, monospace',
        fontSize:      '0.78rem',
        color:         'var(--color-text-timestamp)',
        letterSpacing: '0.02em',
      }}>
        {date}
      </span>

      {/* タイトル + ツール名 */}
      <span className="news-title" style={{
        fontFamily:   lang === 'en' ? 'Inter, sans-serif' : 'Noto Sans JP, sans-serif',
        fontSize:     '0.88rem',
        color:        'var(--color-text)',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:   'nowrap',
      }}>
        {title}
        {toolName && (
          <span style={{
            color:       'var(--color-text-muted)',
            marginLeft:  '0.5rem',
            fontSize:    '0.78rem',
            display:     'inline-flex',
            alignItems:  'center',
            gap:         '4px',
          }}>
            —
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={toolName}
                style={{ width:'14px', height:'14px', borderRadius:'2px', objectFit:'contain', flexShrink:0 }}
              />
            )}
            {toolName}
          </span>
        )}
      </span>
    </Link>
  );
}
