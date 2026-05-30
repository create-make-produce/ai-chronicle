'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getCategoryColor } from '@/lib/category-colors';

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
    category_slug?: string;
    category_name_ja?: string;
  };
  href: string;
  lang: 'ja' | 'en';
  isLast: boolean;
}

export default function NewsRow({ item, href, lang, isLast }: NewsRowProps) {
  const [hovered, setHovered] = useState(false);
  const cat = getCategoryColor(item.category_slug);
  const title = lang === 'en' ? (item.title_en || item.title_ja) : item.title_ja;
  const toolName = lang === 'en' ? item.tool_name_en : item.tool_name_ja;
  const logoUrl = item.tool_logo_url ?? null;

  const date = (() => {
    try {
      const raw = item.published_at?.includes('Z') ? item.published_at : item.published_at?.replace(' ', 'T') + 'Z';
      const d = new Date(raw);
      const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${jst.getUTCFullYear()}/${pad(jst.getUTCMonth()+1)}/${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
    } catch { return item.published_at?.substring(0, 10) ?? ''; }
  })();

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="news-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 145px 1fr',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        borderLeft: `3px solid ${cat.color}`,
        textDecoration: 'none',
        background: hovered ? 'var(--color-row-hover)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* カテゴリバッジ（固定幅・短縮名使用） */}
      <span style={{
        fontFamily:    'Noto Sans JP, system-ui',
        fontSize:      '0.68rem',
        fontWeight:    700,
        color:         cat.text,
        background:    cat.bg,
        padding:       '2px 0',
        borderRadius:  '3px',
        border:        `1px solid ${cat.border}`,
        width:         '84px',
        textAlign:     'center',
        display:       'inline-block',
        whiteSpace:    'nowrap',
        flexShrink:    0,
      }}>
        {cat.label}
      </span>

      {/* 日時 */}
      <span className="news-date" style={{
        fontFamily:    'Fira Sans, system-ui',
        fontSize:      '0.78rem',
        color:         'var(--color-text-timestamp)',
        letterSpacing: '0.02em',
      }}>
        {date}
      </span>

      {/* タイトル + ツール名 */}
      <span className="news-title" style={{
        fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
        fontSize:     '0.88rem',
        color:        'var(--color-text)',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:   'nowrap',
      }}>
        {title}
        {toolName && (
          <span style={{
            color:      'var(--color-text-muted)',
            marginLeft: '0.5rem',
            fontSize:   '0.78rem',
            display:    'inline-flex',
            alignItems: 'center',
            gap:        '4px',
          }}>
            —
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={toolName}
                style={{ width:'14px', height:'14px', borderRadius:'2px', objectFit:'contain', flexShrink:0 }} />
            )}
            {toolName}
          </span>
        )}
      </span>
    </Link>
  );
}
