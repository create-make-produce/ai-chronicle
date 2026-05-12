'use client';
import Link from 'next/link';
import { useState } from 'react';

const NEWS_TYPE_LABELS = {
  price_change: { ja: '価格改定',  en: 'Price Change', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)'  },
  new_tool:     { ja: '新機能',    en: 'New Feature',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
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
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        textDecoration: 'none',
        background: hovered ? 'rgba(0,140,237,0.05)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* PC: 日付（スマホ非表示） */}
      <span className="news-date-pc" style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: '#4A5568', letterSpacing: '0.02em', flexShrink: 0, width: '90px' }}>
        {date}
      </span>

      {/* スマホ: バッジ＋日付＋タイトル縦並び、PC: バッジのみ */}
      <span className="news-badge-wrap" style={{ flexShrink: 0 }}>
        {/* バッジ（PC/スマホ共通） */}
        <span style={{
          fontFamily: 'Fira Sans, sans-serif',
          fontSize: '0.7rem', fontWeight: 700,
          color: badge.color, background: badge.bg,
          padding: '2px 8px', borderRadius: '3px',
          whiteSpace: 'nowrap' as const,
          border: `1px solid ${badge.border}`,
          display: 'inline-block',
        }}>
          {badgeLabel}
        </span>
        {/* スマホのみ: 日付 */}
        <span className="news-date-mobile" style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.72rem', color: '#4A5568', marginLeft: '0.4rem' }}>
          {date}
        </span>
      </span>

      {/* タイトル */}
      <span className="news-title" style={{ fontFamily: lang === 'en' ? 'Inter, sans-serif' : 'Noto Sans JP, sans-serif', fontSize: '0.88rem', color: '#B0BAC5', flex: 1, minWidth: 0 }}>
        {title}
      </span>
      <span style={{ color: '#008CED', fontSize: '0.85rem', flexShrink: 0 }}>→</span>
    </Link>
  );
}
