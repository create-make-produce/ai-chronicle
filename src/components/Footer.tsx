'use client';
import Link from 'next/link';

export default function Footer({ lang = 'ja' }: { lang?: 'ja' | 'en' }) {
  const isEn = lang === 'en';
  const year = new Date().getFullYear();

  const siteLinks = [
    { href: '/privacy', label: isEn ? 'Privacy Policy' : 'プライバシーポリシー' },
    { href: '/contact', label: isEn ? 'Contact'        : 'お問い合わせ' },
  ];

  return (
    <footer
      style={{
        background: '#060F1E',
        borderTop: '1px solid rgba(0,140,237,0.12)',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem 1.75rem' }}>
        {/* ロゴ＋説明＋サイトリンク */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* ロゴ＋説明 */}
          <div>
            <Link href={isEn ? '/en' : '/'} style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.06em', color: '#F0EBE1' }}>
                AI<span style={{ color: '#008CED' }}>/</span>CHRONICLE
              </span>
            </Link>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.8rem', color: '#4A5568', marginTop: '0.6rem', lineHeight: 1.7 }}>
              {isEn
                ? 'AI information database: Stay up to date with the latest news and updates in one place.'
                : 'AI最新情報データベース：最新ニュース・アップデート情報を一つの場所で確認'}
            </p>
          </div>

          {/* サイト情報リンク */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {siteLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.82rem', color: '#4A5568', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 免責事項＋コピーライト */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.72rem', color: '#374151', lineHeight: 1.8, marginBottom: '0.6rem' }}>
            {isEn
              ? "Information is for reference only. Please verify current details on each tool's official website."
              : '最新・正確な情報は各ツールの公式ページをご確認ください。'}
          </p>
          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', color: '#2D3748' }}>
            © {year} AI Chronicle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
