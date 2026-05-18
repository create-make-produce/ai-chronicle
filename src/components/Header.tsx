'use client';
// src/components/Header.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

const NAV_ITEMS = [
  { href: '/',        label: 'TOP' },
  { href: '/news',    label: 'ニュース' },
  { href: '/monthly', label: '月刊AIアップデート' },
  { href: '/tools',   label: 'AIツール一覧' },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
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

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header style={{
      background: 'var(--color-header-bg)',
      borderBottom: '1px solid var(--color-header-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* ロゴ */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '1.05rem',
            fontWeight: 900,
            letterSpacing: '0.06em',
            color: 'var(--color-text)',
          }}>
            AI<span style={{ color: '#008CED' }}>/</span>CHRONICLE
          </span>
        </Link>

        {/* デスクトップナビ（スマホ非表示） */}
        <nav className="hidden md:flex header-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? '' : 'link-underline'}
                style={{
                  fontFamily: 'Fira Sans, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#F0EBE1' : 'var(--color-text-nav)',
                  background: active ? '#008CED' : 'transparent',
                  padding: '5px 14px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          {/* 運営について */}
          <Link
            href="/about"
            className={isActive('/about') ? '' : 'link-underline'}
            style={{
              fontFamily: 'Fira Sans, sans-serif',
              fontSize: '0.85rem',
              fontWeight: isActive('/about') ? 700 : 400,
              color: isActive('/about') ? '#F0EBE1' : 'var(--color-text-nav)',
              background: isActive('/about') ? '#008CED' : 'transparent',
              padding: '5px 14px',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            運営について
          </Link>

          {/* テーマトグル：非表示中（使う場合は display:'none' を 'flex' に変更） */}
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            className="theme-toggle-btn"
            style={{
              width: '34px',
              height: '34px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--color-header-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-nav)',
              marginLeft: '6px',
              flexShrink: 0,
            }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>
    </header>
  );
}
