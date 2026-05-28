'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getThemeByPath } from '@/lib/page-themes';

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
  const isEn    = lang === 'en';
  const year    = new Date().getFullYear();
  const pathname = usePathname();
  const theme   = getThemeByPath(pathname);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <footer style={{
      background: '#060F1E',
      marginTop:  'auto',
      position:   'relative',
    }}>

      {/* ━━ 上部アクセントライン：中央が濃く・両端へ薄くなる ━━ */}
      <div style={{
        position:   'absolute',
        top:        '-2px',
        left:       0,
        right:      0,
        height:     '3px',
        background: `linear-gradient(to right, transparent 0%, rgba(${theme.rgb},0.15) 25%, ${theme.accent} 50%, rgba(${theme.rgb},0.15) 75%, transparent 100%)`,
        transition: 'background 0.3s ease',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem 1.5rem' }}>

        {/* ━━ メインエリア：ロゴ左・ナビ右 ━━ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '2rem', justifyContent: 'space-between' }}>

          {/* 左：ロゴ＋説明 */}
          <div style={{ minWidth: '200px' }}>
            <Link href={isEn ? '/en' : '/'} style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.06em', color: '#FFFFFF' }}>
                AI<span style={{ color: theme.accent, transition: 'color 0.3s' }}>/</span>CHRONICLE
              </span>
            </Link>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.78rem', color: '#8A9BB0', margin: 0, lineHeight: 1.7 }}>
              {isEn
                ? 'AI information database: Stay up to date with the latest news and updates in one place.'
                : <>AIクロニクル（AI Chronicle）は、AIツールの最新情報をお届けするデータベースです。<br />最新・正確な情報は各ツールの公式ページをご確認ください。</>}
            </p>
          </div>

          {/* 右：ナビ2列グリッド */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(100px, 1fr))', gap: '1rem 2rem' }}>
            {[
              { href: '/',        en: 'TOP',      ja: 'トップ' },
              { href: '/news',    en: 'NEWS',      ja: 'ニュース' },
              { href: '/monthly', en: 'MONTHLY',   ja: '月刊AI' },
              { href: '/tools',   en: 'TOOLS',     ja: 'AIツール一覧' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent, flexShrink: 0, display: 'inline-block' }} />
                <span>
                  <span style={{ fontFamily: 'Fira Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF', letterSpacing: '0.05em', display: 'block' }}>{item.en}</span>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.7rem', color: '#8A9BB0' }}>{item.ja}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ━━ 区切り線 ━━ */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '1.25rem' }} />

        {/* ━━ サブリンク＋免責＋Copyright ━━ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/about"   style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.78rem', color: '#B8C4D0', textDecoration: 'none' }}>運営について</Link>
            <Link href="/privacy" style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.78rem', color: '#B8C4D0', textDecoration: 'none' }}>プライバシーポリシー</Link>
            <Link href="/contact" style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.78rem', color: '#B8C4D0', textDecoration: 'none' }}>お問い合わせ</Link>
          </div>
          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', color: '#5A6A7D', margin: 0 }}>
            © {year} AI Chronicle. All rights reserved.
          </p>
        </div>

        {/* 免責 */}
      </div>

      {/* スマホ用ボトムナビ */}
      <nav className="bottom-nav-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#0A0D12', borderTop: `1px solid rgba(${theme.rgb},0.25)`,
        justifyContent: 'space-around', alignItems: 'center',
        height: '60px', paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'none',
      }}>
        {BOTTOM_NAV.map(item => {
          const active      = isActive(item.href);
          const itemTheme   = getThemeByPath(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', textDecoration: 'none', flex: 1,
              color:   active ? itemTheme.accent : '#B8C4D0',
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
