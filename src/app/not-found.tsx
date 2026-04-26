// src/app/not-found.tsx

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center px-4 py-20">
        <p className="font-display text-9xl tracking-tight text-[var(--color-border)]">404</p>
        <h1 className="font-display text-2xl sm:text-3xl mt-4 mb-2">ページが見つかりません</h1>
        <p className="text-sm text-[var(--color-text-sub)] mb-8">
          Page not found. / お探しのページは移動または削除された可能性があります。
        </p>
        <Link href="/" className="btn-primary">
          トップへ戻る / Back to Home
        </Link>
      </div>
    </main>
  );
}
