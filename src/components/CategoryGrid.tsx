// src/components/CategoryGrid.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';
import type { CategoryWithCount } from '@/lib/db';

// アイコンファイル（webp対応・png fallback）
const ICON_FILE: Record<string, string> = {
  'text-generation':  'cat-text.png',
  'image-generation': 'cat-image.png',
  'coding':           'cat-coding.png',
  'audio':            'cat-audio.png',
  'productivity':     'cat-productivity.png',
  'research':         'cat-research.png',
  'marketing':        'cat-marketing.png',
  'other':            'cat-other.png',
};

// カテゴリごとのパステルカラー
const CAT_PASTEL: Record<string, { bg: string; iconColor: string; border: string }> = {
  'text-generation':  { bg: 'rgba(139,184,255,0.12)', iconColor: '#8BB8FF', border: 'rgba(139,184,255,0.35)' },
  'image-generation': { bg: 'rgba(255,182,200,0.12)', iconColor: '#FFB6C8', border: 'rgba(255,182,200,0.35)' },
  'audio':            { bg: 'rgba(192,168,255,0.12)', iconColor: '#C0A8FF', border: 'rgba(192,168,255,0.35)' },
  'coding':           { bg: 'rgba(168,240,212,0.12)', iconColor: '#A8F0D4', border: 'rgba(168,240,212,0.35)' },
  'productivity':     { bg: 'rgba(255,200,130,0.12)', iconColor: '#FFC882', border: 'rgba(255,200,130,0.35)' },
  'research':         { bg: 'rgba(130,210,200,0.12)', iconColor: '#82D2C8', border: 'rgba(130,210,200,0.35)' },
  'marketing':        { bg: 'rgba(255,224,102,0.12)', iconColor: '#FFE066', border: 'rgba(255,224,102,0.35)' },
  'other':            { bg: 'rgba(200,200,200,0.12)', iconColor: '#AAAAAA', border: 'rgba(200,200,200,0.35)' },
};

// フォールバックSVGアイコン（パステルカラー版）
function FallbackIcon({ slug, color }: { slug: string; color: string }) {
  const s = { stroke: color, strokeWidth: '1.8', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (slug) {
    case 'text-generation':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="14" height="2" rx="1"/><rect x="3" y="15" width="10" height="2" rx="1"/></svg>;
    case 'image-generation':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case 'coding':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case 'audio':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'productivity':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
    case 'research':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'marketing':
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    default:
      return <svg width="44" height="44" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><circle cx="12" cy="16" r="0.5" fill={color}/></svg>;
  }
}

interface CategoryGridProps {
  categories: CategoryWithCount[];
  locale: Locale;
}

export default function CategoryGrid({ categories, locale }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <style>{`
        @media (max-width: 767px) {
          .cat-en-text  { display: none; }
          .cat-card     {
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            height: 78px !important;
            padding: 10px 12px !important;
            gap: 4px !important;
          }
          .cat-icon     { width: 28px !important; height: 28px !important; }
          .cat-icon img { width: 26px !important; height: 26px !important; }
          .cat-text-area {
            font-size: 0.92rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
        }
      `}</style>
      {categories.map((cat, i) => {
        const dispName = locale === 'ja' ? cat.name_ja : cat.name_en;
        const href     = locale === 'ja' ? `/tools?cat=${cat.slug}` : `/en/tools?cat=${cat.slug}`;
        const iconFile = ICON_FILE[cat.slug];
        const pastel   = CAT_PASTEL[cat.slug] ?? CAT_PASTEL.other;

        return (
          <motion.div key={cat.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
          >
            <Link
              href={href}
              className="cat-card"
              style={{
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'space-between',
                gap:             '12px',
                padding:         '14px 16px',
                height:          '72px',
                background:      pastel.bg,
                border:          `1px solid ${pastel.border}`,
                borderRadius:    '8px',
                textDecoration:  'none',
                transition:      'all 0.15s ease',
                position:        'relative',
                overflow:        'hidden',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${pastel.bg.replace('0.12', '0.4')}`;
                (e.currentTarget as HTMLElement).style.borderColor = pastel.iconColor;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = pastel.border;
              }}
            >
              {/* テキスト */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="cat-text-area" style={{
                  fontFamily: 'var(--font-noto), sans-serif',
                  fontSize:   dispName.length > 7 ? '0.95rem' : '1.05rem',
                  fontWeight: 700,
                  color:      'var(--color-text)',
                  lineHeight: 1.2,
                  margin:     0,
                }}>
                  {dispName}
                </p>
                {locale === 'ja' && (
                  <p className="cat-en-text" style={{
                    fontFamily:    'var(--font-fira), system-ui',
                    fontSize:      '0.58rem',
                    letterSpacing: '0.08em',
                    color:         'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    margin:        '3px 0 0',
                  }}>
                    {cat.name_en}
                  </p>
                )}
              </div>

              {/* アイコン */}
              <div className="cat-icon" style={{
                flexShrink:  0,
                width:       44,
                height:      44,
                display:     'flex',
                alignItems:  'center',
                justifyContent: 'center',
              }}>
                {iconFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/icons/${iconFile}`}
                    alt={cat.name_en}
                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  />
                ) : (
                  <FallbackIcon slug={cat.slug} color={pastel.iconColor} />
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
