'use client';
// src/components/Header.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',        label: 'TOP' },
  { href: '/news',    label: 'ニュース' },
  { href: '/monthly', label: '月刊AIアップデート' },
  { href: '/tools',   label: 'AIツール一覧' },
];

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        background: '#0A0D12',
        borderBottom: '1px solid rgba(0, 140, 237, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* ロゴ */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '1.05rem',
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: '#F0EBE1',
            }}
          >
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
                  color: active ? '#F0EBE1' : '#7A8A99',
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

          {/* 運営について：右端・セパレーター付き */}
          <span style={{ width: '1px', height: '16px', background: 'rgba(0,140,237,0.2)', margin: '0 6px' }} />
          <Link
            href="/about"
            className={isActive('/about') ? '' : 'link-underline'}
            style={{
              fontFamily: 'Fira Sans, sans-serif',
              fontSize: '0.78rem',
              fontWeight: isActive('/about') ? 700 : 400,
              color: isActive('/about') ? '#F0EBE1' : '#5A6A7D',
              background: isActive('/about') ? '#008CED' : 'transparent',
              padding: '5px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            運営について
          </Link>
        </nav>
      </div>
    </header>
  );
}
