'use client';
import Link from 'next/link';
import { useState } from 'react';

const NEWS_TYPE_LABELS = {
  price_change: { ja: '価格改定',  en: 'Price Change', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)'  },
  new_tool:     { ja: '新リリース', en: 'New Release',  color: '#008CED', bg: 'rgba(0,140,237,0.12)',   border: 'rgba(0,140,237,0.3)'   },
  new_feature:  { ja: '新機能',    en: 'New Feature',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  other:        { ja: 'その他',    en: 'Other',        color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.3)' },
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
  const date = item.published_at?.substring(0, 10) ?? '';
  const logoUrl = item.tool_logo_url ?? null;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '110px auto 1fr auto',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        textDecoration: 'none',
        background: hovered ? 'rgba(0,140,237,0.05)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <span style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: '#4A5568', letterSpacing: '0.02em' }}>
        {date}
      </span>
      <span style={{
        fontFamily: 'Fira Sans, sans-serif',
        fontSize: '0.7rem', fontWeight: 700,
        color: badge.color,
        background: badge.bg,
        padding: '2px 8px', borderRadius: '3px',
        whiteSpace: 'nowrap',
        border: `1px solid ${badge.border}`,
      }}>
        {badgeLabel}
      </span>
      <span style={{ fontFamily: lang === 'en' ? 'Inter, sans-serif' : 'Noto Sans JP, sans-serif', fontSize: '0.88rem', color: '#B0BAC5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
        {toolName && (
          <span style={{ color: '#4A5568', marginLeft: '0.5rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            —
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={toolName} style={{ width: '14px', height: '14px', borderRadius: '2px', objectFit: 'contain', flexShrink: 0 }} />
            )}
            {toolName}
          </span>
        )}
      </span>
      <span style={{ color: '#008CED', fontSize: '0.85rem' }}>→</span>
    </Link>
  );
}
