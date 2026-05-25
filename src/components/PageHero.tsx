// src/components/PageHero.tsx
import Link from 'next/link';
import type { PageTheme } from '@/lib/page-themes';
import { PAGE_THEMES } from '@/lib/page-themes';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  breadcrumbs: Crumb[];
  label: string;
  watermark?: string;
  theme?: PageTheme;
  children: React.ReactNode;
}

export default function PageHero({
  breadcrumbs, label, watermark, theme = PAGE_THEMES.home, children,
}: PageHeroProps) {
  const wm = watermark ?? label.split(' ')[0];

  return (
    <section
      className="hero-bg"
      style={{
        position:        'relative',
        overflow:        'hidden',
        backgroundColor: 'var(--color-bg)',
        borderBottom:    '1px solid var(--color-border)',
        paddingTop:      '36px',
        paddingBottom:   '44px',
      }}
    >
      {/* 右側グラデーション */}
      <div style={{
        position:      'absolute',
        right:         0,
        top:           0,
        bottom:        0,
        width:         '40%',
        background:    `linear-gradient(to left, rgba(${theme.rgb},0.07) 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      {/* ウォーターマーク */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          right:         '-8px',
          bottom:        '-24px',
          fontFamily:    'Orbitron, Fira Sans, sans-serif',
          fontSize:      'clamp(4.5rem, 14vw, 12rem)',
          fontWeight:    900,
          color:         theme.accent,
          opacity:       0.055,
          lineHeight:    1,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          userSelect:    'none',
          whiteSpace:    'nowrap',
        }}
      >
        {wm}
      </div>

      {/* 下部アクセントライン（右から左へ） */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '2px',
        background: `linear-gradient(to left, ${theme.accent} 0%, rgba(${theme.rgb},0.2) 60%, transparent 100%)`,
        transition: 'background 0.3s ease',
      }} />

      {/* コンテンツ */}
      <div className="max-w-7xl mx-auto section-px" style={{ position: 'relative', zIndex: 1 }}>

        {/* パンくず */}
        <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', marginBottom: '1.4rem' }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {i > 0 && <span style={{ color: 'var(--color-border-mid)' }}>/</span>}
              {crumb.href ? (
                <Link href={crumb.href} style={{ color: 'var(--color-text-breadcrumb)', textDecoration: 'none' }}>
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--color-text)' }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* セクションラベル（theme色でインライン描画） */}
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '8px',
          fontSize:      '0.6875rem',
          fontWeight:    700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color:         theme.accent,
        }}>
          <span style={{ width: '20px', height: '2px', background: theme.accent, flexShrink: 0 }} />
          {label}
        </div>

        {/* タイトル等 */}
        <div style={{ marginTop: '14px' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
