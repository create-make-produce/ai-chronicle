// src/components/ToolCard.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import { getCategoryColor } from '@/lib/category-colors';

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
  const pastel  = getCategoryColor(categorySlug);

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
          border:         '1px solid var(--color-border)',
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
          el.style.transform       = 'translateY(-2px)';
          el.style.boxShadow       = `0 6px 24px ${pastel.bg.replace('0.12','0.5')}`;
          el.style.borderColor     = pastel.color;
          el.style.borderLeftColor = pastel.color;
          el.style.background      = pastel.bg;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform       = 'translateY(0)';
          el.style.boxShadow       = 'none';
          el.style.borderColor     = 'var(--color-border)';
          el.style.borderLeftColor = pastel.color;
          el.style.background      = 'var(--color-bg)';
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
              /* イニシャルは動的（ツール名由来） → システムフォント */
              <span style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                fontSize: '0.85rem', fontWeight: 700,
                color: pastel.text,
              }}>{initials}</span>
            )}
          </div>

          {/* カテゴリバッジ（固定テキスト → Noto Sans JP サブセット） */}
          {categoryName && (
            <span style={{
              fontFamily:    'Noto Sans JP, sans-serif',
              fontSize:      '0.68rem',
              fontWeight:    700,
              letterSpacing: '0.05em',
              color:         pastel.text,
              background:    pastel.bg,
              border:        `1px solid ${pastel.border}`,
              padding:       '3px 10px',
              borderRadius:  '3px',
              whiteSpace:    'nowrap',
            }}>{categoryName}</span>
          )}
        </div>

        {/* ツール名（動的コンテンツ → システムフォント） */}
        <h3 style={{
          fontFamily:    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
          fontSize:      'clamp(0.95rem, 2vw, 1.1rem)',
          fontWeight:    700,
          color:         'var(--color-text)',
          lineHeight:    1.2,
          margin:        '0 0 6px',
          flexShrink:    0,
          textTransform: 'none' as const,
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>{name}</h3>

        {/* タグライン（動的コンテンツ → システムフォント） */}
        {tagline && (
          <p style={{
            fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
            fontSize:        '0.75rem',
            fontWeight:      700,
            color:           'var(--color-text)',
            lineHeight:      1.55,
            margin:          '0 0 4px',
            overflow:        'hidden',
            display:         '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical' as const,
            flexShrink:      0,
          }}>{tagline}</p>
        )}

        {/* 概要（動的コンテンツ → システムフォント） */}
        {(locale === 'ja' ? tool.description_ja : tool.description_en) && (
          <p style={{
            fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
            fontSize:        '0.72rem',
            color:           'var(--color-text-sub)',
            lineHeight:      1.6,
            margin:          0,
            flex:            1,
            overflow:        'hidden',
            display:         '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
          }}>{locale === 'ja' ? tool.description_ja : tool.description_en}</p>
        )}

        {/* 詳しく見る（固定テキスト → Fira Sans サブセット） */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
          marginTop:  '10px',
          paddingTop: '8px',
          borderTop:  `1px solid ${pastel.border}`,
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily:          'Fira Sans, system-ui',
            fontSize:            '0.7rem',
            fontWeight:          700,
            letterSpacing:       '0.1em',
            textTransform:       'uppercase',
            color:               pastel.text,
            textDecoration:      'underline',
            textUnderlineOffset: '3px',
          }}>
            {locale === 'ja' ? '詳しく見る' : 'Learn more'}
          </span>
          <span style={{ color: pastel.text, fontSize: '0.65rem' }}>▶</span>
        </div>
      </Link>
    </motion.div>
  );
}
