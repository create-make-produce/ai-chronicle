// src/components/ToolCard.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';

interface ToolCardProps {
  tool: Tool;
  locale: Locale;
  index?: number;
  categoryName?: string;
  categorySlug?: string;
}

// 右下の折り目（ドッグイヤー）
function FoldedCorner({ size = 22 }: { size?: number }) {
  return (
    <>
      {/* 折り目の三角（明るい青） */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        right:      0,
        width:      0,
        height:     0,
        borderStyle:'solid',
        borderWidth:`${size}px ${size}px 0 0`,
        borderColor:`transparent var(--color-accent) transparent transparent`,
        zIndex:     2,
      }} />
      {/* 折り返し部分（少し暗い） */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        right:      0,
        width:      0,
        height:     0,
        borderStyle:'solid',
        borderWidth:`0 0 ${size}px ${size}px`,
        borderColor:`transparent transparent rgba(0,0,0,0.4) transparent`,
        zIndex:     3,
      }} />
    </>
  );
}

export default function ToolCard({ tool, locale, index = 0, categoryName }: ToolCardProps) {
  const tt = t[locale];
  const name    = locale === 'ja' ? tool.name_ja    : tool.name_en;
  const tagline = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const desc    = locale === 'ja' ? tool.description_ja : tool.description_en;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.32), ease: 'easeOut' }}
      style={{ marginTop: '14px', marginLeft: '8px', position: 'relative' }}
    >
      {/* ── 左上：傾いたバッジ（ツールのロゴ or 頭文字） ── */}
      <div style={{
        position:       'absolute',
        top:            '-14px',
        left:           '-8px',
        width:          '32px',
        height:         '32px',
        background:     '#ffffff',
        border:         '2px solid var(--color-accent)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transform:      'rotate(-6deg)',
        zIndex:         10,
        boxShadow:      '2px 3px 8px rgba(0,0,0,0.4)',
        overflow:       'hidden',
        flexShrink:     0,
      }}>
        {tool.logo_url ? (
          <img
            src={tool.logo_url}
            alt={name}
            width={24}
            height={24}
            style={{ objectFit: 'contain', padding: '2px' }}
          />
        ) : (
          <span style={{
            fontFamily:    'var(--font-fira), system-ui',
            fontSize:      '0.75rem',
            color:         'var(--color-accent)',
            letterSpacing: '0.03em',
          }}>
            {initials}
          </span>
        )}
      </div>

      {/* ── クリームカード本体（影はこのdivに付ける） ── */}
      <div style={{ filter: 'drop-shadow(5px 5px 0px #008CED)' }}>
      <Link
        href={localizedPath(locale, `/tool/${tool.slug}`)}
        className="group relative block transition-transform duration-150 hover:-translate-y-1"
        style={{
          background:   '#EEF4FF',
          border:       '1px solid #1A3860',
          borderRadius: '2px',
          overflow:     'hidden',
          clipPath:     'polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)',
          height:       '220px',
        }}
      >
        <FoldedCorner />

        <div className="p-4 pt-5 flex flex-col h-full">

          {/* バッジ行：FREE + カテゴリのみ */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {tool.has_free_plan === 1 && (
              <span style={{
                background: '#1A56DB', color: '#FFFFFF',
                fontSize: '0.6875rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                padding: '2px 8px', borderRadius: '2px',
              }}>FREE</span>
            )}
            {categoryName && (
              <span style={{
                background: '#0F3D8C', color: '#FFFFFF',
                fontSize: '0.6875rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                padding: '2px 8px', borderRadius: '2px',
                border: '1px solid #1A56DB',
              }}>{categoryName}</span>
            )}
          </div>

          {/* ツール名（英語: Merriweather / 日本語: Shippori Mincho） */}
          <h3
            className="leading-none mb-2 transition-colors group-hover:text-[var(--color-accent)]"
            style={{
              fontFamily:    locale === 'ja'
                ? 'var(--font-shippori), serif'
                : 'var(--font-merriweather), serif',
              fontSize:      locale === 'ja' ? 'clamp(1rem, 2.5vw, 1.2rem)' : 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight:    700,
              color:         '#0A1628',
              letterSpacing: locale === 'ja' ? '0.05em' : '0.03em',
              textTransform: locale === 'ja' ? 'none' as const : 'uppercase' as const,
              lineHeight:    1.15,
            }}
          >
            {name}
          </h3>

          {/* タグライン（1行キャッチコピー） */}
          {tagline && (
            <p className="text-xs font-medium leading-relaxed line-clamp-2 mb-1"
              style={{ color: '#1A2E4A' }}>
              {tagline}
            </p>
          )}
          {/* 説明文（詳細・後で別内容に書き換え可） */}
          {desc && (
            <p className="text-xs leading-relaxed line-clamp-2"
              style={{ color: '#4A6B8A', minHeight: tagline ? '0' : '2.8rem' }}>
              {desc}
            </p>
          )}
          {/* どちらもない場合のスペーサー */}
          {!tagline && !desc && <div style={{ minHeight: '2.8rem' }} />}

          <div className="flex-1" />

          {/* 詳しく見る */}
          <div className="flex items-center gap-2 pt-3 text-xs font-bold tracking-widest uppercase"
            style={{ borderTop: '1px solid #C0D4E8', color: '#6B8FAF' }}>
            <span className="group-hover:text-[var(--color-accent)] transition-colors">
              {locale === 'ja' ? '詳しく見る' : 'Learn more'}
            </span>
            <span className="group-hover:translate-x-1 transition-transform inline-block"
              style={{ color: 'var(--color-accent)' }}>
              ▶
            </span>
          </div>
        </div>
      </Link>
      </div>
    </motion.div>
  );
}
