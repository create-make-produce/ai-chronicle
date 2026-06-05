'use client';
// src/components/Header.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { getThemeByPath } from '@/lib/page-themes';

const NAV_ITEMS = [
  { href: '/',        en: 'TOP',      ja: 'トップ' },
  { href: '/news',    en: 'NEWS',     ja: 'ニュース' },
  { href: '/monthly', en: 'MONTHLY',  ja: '月刊AI' },
  { href: '/tools',   en: 'TOOLS',    ja: 'AIツール一覧' },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Header({ showFeatures = false }: { showFeatures?: boolean }) {
  const pathname   = usePathname();
  const { theme, toggle } = useTheme();

  const pageTheme  = getThemeByPath(pathname);
  const accent     = pageTheme.accent;
  const accentRgb  = pageTheme.rgb;

  const navItems = [
    { href: '/',         en: 'TOP',      ja: 'トップ' },
    { href: '/news',     en: 'NEWS',     ja: 'ニュース' },
    { href: '/monthly',  en: 'MONTHLY',  ja: '月刊AI' },
    ...(showFeatures ? [{ href: '/features', en: 'FEATURES', ja: '特集' }] : []),
    { href: '/tools',    en: 'TOOLS',    ja: 'AIツール一覧' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header style={{
      background:   'var(--color-header-bg)',
      borderBottom: '1px solid var(--color-border)',
      position:     'sticky',
      top:          0,
      zIndex:       50,
    }}>
      {/* ヘッダー下部：ページカラーの細いアクセントライン */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '2px',
        background: `linear-gradient(to right, ${accent} 0%, rgba(${accentRgb},0.2) 60%, transparent 100%)`,
        transition: 'background 0.3s ease',
      }} />

      <div style={{
        maxWidth:       '1280px',
        margin:         '0 auto',
        padding:        '0 1.5rem',
        height:         '60px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        position:       'relative',
      }}>

        {/* ロゴ */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="256" cy="256" r="240" fill="#FFFFFF" stroke="#E4E8EF" strokeWidth="8"/>
            <circle cx="256" cy="256" r="162" fill="none" stroke="#008CED" strokeWidth="30" strokeDasharray="340 170"/>
            <circle cx="256" cy="256" r="84" fill="#008CED"/>
            <circle cx="256" cy="256" r="42" fill="#FFFFFF"/>
          </svg>
          <span style={{
            fontFamily:    'Orbitron, sans-serif',
            fontSize:      '1.25rem',
            fontWeight:    900,
            letterSpacing: '0.09em',
            color:         'var(--color-text)',
          }}>
            AI<span style={{ color: accent, transition: 'color 0.3s' }}>/</span>CHRONICLE
          </span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="header-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

          {navItems.map((item) => {
            const active = isActive(item.href);
            // このナビ項目のテーマカラー（アクティブ時のみ使用）
            const itemTheme = getThemeByPath(item.href);
            const itemAccent = itemTheme.accent;
            const itemRgb    = itemTheme.rgb;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  gap:            '1px',
                  padding:        '6px 14px',
                  textDecoration: 'none',
                  borderRadius:   '6px',
                  transition:     'background 0.15s',
                  background:     active ? `rgba(${itemRgb},0.08)` : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = `rgba(${itemRgb},0.05)`;
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* ドット＋英語名 */}
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    width:        '6px',
                    height:       '6px',
                    borderRadius: '50%',
                    background:   active ? itemAccent : 'var(--color-border-mid)',
                    flexShrink:   0,
                    transition:   'background 0.15s',
                  }} />
                  <span style={{
                    fontFamily:    'Fira Sans, system-ui',
                    fontSize:      '0.8rem',
                    fontWeight:    700,
                    letterSpacing: '0.08em',
                    color:         active ? itemAccent : 'var(--color-text)',
                    transition:    'color 0.15s',
                  }}>{item.en}</span>
                </span>
                {/* 日本語サブ */}
                <span style={{
                  fontFamily: 'Noto Sans JP, sans-serif',
                  fontSize:   '0.58rem',
                  color:      active ? itemAccent : 'var(--color-text-muted)',
                  transition: 'color 0.15s',
                }}>{item.ja}</span>
              </Link>
            );
          })}

          {/* ABOUTピルボタン */}
          <Link
            href="/about"
            style={{
              fontFamily:     'Fira Sans, system-ui',
              fontSize:       '0.75rem',
              fontWeight:     700,
              letterSpacing:  '0.1em',
              textDecoration: 'none',
              padding:        '7px 18px',
              borderRadius:   '999px',
              border:         isActive('/about')
                ? `1.5px solid ${accent}`
                : '1.5px solid var(--color-border-mid)',
              color:          isActive('/about') ? accent : 'var(--color-text-sub)',
              background:     isActive('/about') ? `rgba(${accentRgb},0.08)` : 'transparent',
              transition:     'all 0.15s',
              whiteSpace:     'nowrap',
              marginLeft:     '8px',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = accent;
              el.style.color       = accent;
            }}
            onMouseLeave={e => {
              if (!isActive('/about')) {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--color-border-mid)';
                el.style.color       = 'var(--color-text-sub)';
              }
            }}
          >
            ABOUT
          </Link>

          {/* テーマトグル（非表示中） */}
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            className="theme-toggle-btn"
            style={{
              width: '34px', height: '34px', display: 'none',
              alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: '4px', cursor: 'pointer',
              color: 'var(--color-text-nav)', marginLeft: '6px', flexShrink: 0,
            }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>
    </header>
  );
}
