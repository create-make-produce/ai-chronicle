// src/components/ToolCard.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';

// CategoryGridと共通のパステルカラー定義
const CAT_PASTEL: Record<string, { bg: string; color: string; border: string }> = {
  'text-generation':  { bg: 'rgba(139,184,255,0.12)', color: '#8BB8FF', border: 'rgba(139,184,255,0.5)' },
  'image-generation': { bg: 'rgba(255,182,200,0.12)', color: '#FFB6C8', border: 'rgba(255,182,200,0.5)' },
  'audio':            { bg: 'rgba(192,168,255,0.12)', color: '#C0A8FF', border: 'rgba(192,168,255,0.5)' },
  'coding':           { bg: 'rgba(168,240,212,0.12)', color: '#A8F0D4', border: 'rgba(168,240,212,0.5)' },
  'productivity':     { bg: 'rgba(255,200,130,0.12)', color: '#FFC882', border: 'rgba(255,200,130,0.5)' },
  'research':         { bg: 'rgba(130,210,200,0.12)', color: '#82D2C8', border: 'rgba(130,210,200,0.5)' },
  'marketing':        { bg: 'rgba(255,224,102,0.12)', color: '#FFE066', border: 'rgba(255,224,102,0.5)' },
  'other':            { bg: 'rgba(200,200,200,0.10)', color: '#AAAAAA', border: 'rgba(200,200,200,0.4)' },
};

const DEFAULT_PASTEL = { bg: 'rgba(200,200,200,0.10)', color: '#AAAAAA', border: 'rgba(200,200,200,0.4)' };

interface ToolCardProps {
  tool: Tool;
  locale: Locale;
  index?: number;
  categoryName?: string;
  categorySlug?: string;
}

export default function ToolCard({ tool, locale, index = 0, categoryName, categorySlug }: ToolCardProps) {
  const tt      = t[locale];
  const name    = locale === 'ja' ? tool.name_ja    : tool.name_en;
  const tagline = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const initials = name.slice(0, 2).toUpperCase();
  const pastel  = (categorySlug && CAT_PASTEL[categorySlug]) ? CAT_PASTEL[categorySlug] : DEFAULT_PASTEL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.32) }}
    >
      <Link
        href={localizedPath(locale, `/tool/${tool.slug}`)}
        className="group"
        style={{
          display:        'flex',
          flexDirection:  'column',
          height:         '200px',
          background:     'var(--color-bg)',
          border:         `1px solid var(--color-border)`,
          borderLeft:     `6px solid ${pastel.color}`,
          borderRadius:   '8px',
          overflow:       'hidden',
          textDecoration: 'none',
          transition:     'all 0.15s ease',
          padding:        '14px 16px',
          position:       'relative',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform   = 'translateY(-2px)';
          el.style.boxShadow   = `0 6px 24px ${pastel.bg.replace('0.12','0.5')}`;
          el.style.borderColor = pastel.color;
          el.style.borderLeftColor = pastel.color;
          el.style.background  = pastel.bg;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform   = 'translateY(0)';
          el.style.boxShadow   = 'none';
          el.style.borderColor = 'var(--color-border)';
          el.style.borderLeftColor = pastel.color;
          el.style.background  = 'var(--color-bg)';
        }}
      >
        {/* ヘッダー：ロゴ＋カテゴリバッジ横並び */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', flexShrink:0 }}>

          {/* ロゴ */}
          <div style={{
            width: '44px', height: '44px', flexShrink: 0,
            background: pastel.bg,
            border: `1px solid ${pastel.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {tool.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.logo_url} alt={name}
                style={{ width:'36px', height:'36px', objectFit:'contain', padding:'2px' }} />
            ) : (
              <span style={{
                fontFamily: 'var(--font-fira), system-ui',
                fontSize: '0.85rem', fontWeight: 700,
                color: pastel.color,
              }}>{initials}</span>
            )}
          </div>

          {/* カテゴリバッジ */}
          {categoryName && (
            <span style={{
              fontSize:      '0.68rem',
              fontWeight:    700,
              letterSpacing: '0.05em',
              color:         pastel.color,
              background:    pastel.bg,
              border:        `1px solid ${pastel.border}`,
              padding:       '3px 10px',
              borderRadius:  '3px',
              whiteSpace:    'nowrap',
            }}>{categoryName}</span>
          )}
        </div>

        {/* ツール名 */}
        <h3 style={{
          fontFamily:  locale === 'ja' ? 'var(--font-noto), sans-serif' : 'var(--font-fira), system-ui',
          fontSize:    'clamp(0.95rem, 2vw, 1.1rem)',
          fontWeight:  700,
          color:       'var(--color-text)',
          lineHeight:  1.2,
          margin:      '0 0 6px',
          flexShrink:  0,
          textTransform: 'none' as const,
          overflow:    'hidden',
          textOverflow:'ellipsis',
          whiteSpace:  'nowrap',
        }}>{name}</h3>

        {/* タグライン */}
        {tagline && (
          <p style={{
            fontFamily:        'var(--font-noto), sans-serif',
            fontSize:          '0.75rem',
            color:             'var(--color-text-sub)',
            lineHeight:        1.55,
            margin:            0,
            flex:              1,
            overflow:          'hidden',
            display:           '-webkit-box',
            WebkitLineClamp:   3,
            WebkitBoxOrient:   'vertical' as const,
          }}>{tagline}</p>
        )}

        {/* 詳しく見る */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '4px',
          marginTop:     '10px',
          paddingTop:    '8px',
          borderTop:     `1px solid ${pastel.border}`,
          flexShrink:    0,
        }}>
          <span style={{
            fontFamily:    'var(--font-fira), system-ui',
            fontSize:      '0.7rem',
            fontWeight:    700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         pastel.color,
            textDecoration:'underline',
            textUnderlineOffset: '3px',
          }}>
            {locale === 'ja' ? '詳しく見る' : 'Learn more'}
          </span>
          <span style={{ color: pastel.color, fontSize: '0.65rem' }}>▶</span>
        </div>
      </Link>
    </motion.div>
  );
}
