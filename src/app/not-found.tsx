// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '6rem', fontWeight: 900, color: 'var(--color-border)', lineHeight: 1, margin: 0 }}>404</p>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: '1rem 0 0.5rem' }}>ページが見つかりません</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-sub)', marginBottom: '2rem' }}>
          Page not found. / お探しのページは移動または削除された可能性があります。
        </p>
        <Link href="/" style={{
          display: 'inline-block', padding: '10px 28px',
          background: 'var(--color-accent)', color: '#fff',
          borderRadius: '4px', textDecoration: 'none',
          fontFamily: 'Fira Sans, sans-serif', fontWeight: 700, fontSize: '0.88rem',
        }}>
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
