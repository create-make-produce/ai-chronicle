'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/news',    hrefEn: '/en/news',    labelJa: 'ニュース',          labelEn: 'News' },
  { href: '/monthly', hrefEn: '/en/monthly', labelJa: '月刊AIアップデート', labelEn: 'AI Update Monthly' },
  { href: '/tools',   hrefEn: '/en/tools',   labelJa: 'すべてのAI',        labelEn: 'All AI' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isEn = pathname.startsWith('/en');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLang = () => {
    if (isEn) {
      const newPath = pathname.replace(/^\/en/, '') || '/';
      router.push(newPath);
    } else {
      router.push('/en' + (pathname === '/' ? '' : pathname));
    }
  };

  const isActive = (href: string, hrefEn: string) => {
    const target = isEn ? hrefEn : href;
    if (target === '/' || target === '/en') return pathname === target;
    return pathname.startsWith(target);
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
        <Link href={isEn ? '/en' : '/'} style={{ textDecoration: 'none' }}>
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

        {/* デスクトップナビ */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.hrefEn);
            const href = isEn ? item.hrefEn : item.href;
            const label = isEn ? item.labelEn : item.labelJa;
            return (
              <Link
                key={item.href}
                href={href}
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
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 言語切替 + モバイルメニュー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* JP/EN ボタン */}
          <div style={{ display: 'flex', border: '1px solid rgba(0,140,237,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => isEn && toggleLang()}
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#F0EBE1',
                background: !isEn ? '#008CED' : 'transparent',
                padding: '4px 10px',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              JP
            </button>
            <button
              onClick={() => !isEn && toggleLang()}
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#F0EBE1',
                background: isEn ? '#008CED' : 'transparent',
                padding: '4px 10px',
                border: 'none',
                borderLeft: '1px solid rgba(0,140,237,0.4)',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              EN
            </button>
          </div>

          {/* モバイルハンバーガー */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden"
            style={{ background: 'transparent', border: 'none', color: '#F0EBE1', cursor: 'pointer', padding: '4px' }}
            aria-label="メニュー"
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <line x1="4" y1="4" x2="18" y2="18" stroke="#F0EBE1" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18" y1="4" x2="4" y2="18" stroke="#F0EBE1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <line x1="3" y1="6" x2="19" y2="6" stroke="#F0EBE1" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="11" x2="19" y2="11" stroke="#F0EBE1" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="16" x2="19" y2="16" stroke="#F0EBE1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {mobileOpen && (
        <div
          style={{
            background: '#0A0D12',
            borderTop: '1px solid rgba(0,140,237,0.12)',
            padding: '0.75rem 1.5rem 1rem',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.hrefEn);
            const href = isEn ? item.hrefEn : item.href;
            const label = isEn ? item.labelEn : item.labelJa;
            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  fontFamily: 'Fira Sans, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#008CED' : '#9CA3AF',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
