'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BOTTOM_NAV = [
  { href: '/', label: 'TOP', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { href: '/news', label: 'ニュース', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <line x1="10" y1="7" x2="18" y2="7"/><line x1="10" y1="11" x2="18" y2="11"/><line x1="10" y1="15" x2="14" y2="15"/>
    </svg>
  )},
  { href: '/monthly', label: '月刊AI', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { href: '/tools', label: 'AI一覧', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )},
];

export default function Footer({ lang = 'ja' }: { lang?: 'ja' | 'en' }) {
  const isEn = lang === 'en';
  const year = new Date().getFullYear();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <footer style={{ background: '#060F1E', borderTop: '1px solid rgba(0,140,237,0.12)', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.5rem 1.25rem' }}>

        {/* ロゴ＋説明＋リンク */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <Link href={isEn ? '/en' : '/'} style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.06em', color: '#F0EBE1' }}>
                AI<span style={{ color: '#008CED' }}>/</span>CHRONICLE
              </span>
            </Link>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.8rem', color: '#8A9BB0', marginTop: '0.4rem', marginBottom: 0, lineHeight: 1.6 }}>
              {isEn
                ? 'AI information database: Stay up to date with the latest news and updates in one place.'
                : 'AI最新情報データベース：最新ニュース・アップデート情報を一つの場所で確認'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="/privacy" style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.82rem', color: '#8A9BB0', textDecoration: 'none' }}>
              {isEn ? 'Privacy Policy' : 'プライバシーポリシー'}
            </Link>
            <Link href="/contact" style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.82rem', color: '#8A9BB0', textDecoration: 'none' }}>
              {isEn ? 'Contact' : 'お問い合わせ'}
            </Link>
          </div>
        </div>

        {/* 免責＋著作権（縦並び・余白最小） */}
        <div>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.72rem', color: '#6B7A8D', lineHeight: 1.6, margin: '0 0 0.2rem 0' }}>
            {isEn
              ? '※ Please verify current details on each tool\'s official website.'
              : '（※）最新・正確な情報は各ツールの公式ページをご確認ください。'}
          </p>
          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', color: '#5A6A7D', margin: 0 }}>
            © {year} AI Chronicle. All rights reserved.
          </p>
        </div>

      </div>

      {/* スマホ用ボトムナビ（スマホのみ表示） */}
      <nav className="bottom-nav-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#0A0D12', borderTop: '1px solid rgba(0,140,237,0.2)',
        justifyContent: 'space-around', alignItems: 'center',
        height: '60px', paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'none',
      }}>
        {BOTTOM_NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', textDecoration: 'none', flex: 1,
              color: active ? '#008CED' : '#6B7280',
              padding: '6px 0',
            }}>
              {item.icon}
              <span style={{ fontSize: '0.6rem', fontWeight: active ? 700 : 400, fontFamily: 'Noto Sans JP, sans-serif' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* スマホ用ボトムナビの余白 */}
      <div className="bottom-nav-spacer" style={{ height: '60px', display: 'none' }} />
    </footer>
  );
}
