import Link from "next/link";

/**
 * AI Chronicle - トップページ（日本語）
 *
 * Phase 1段階：構築確認用の最小ページ
 * Phase 2でヒーロー・ニュース・新着・カテゴリグリッドを実装する
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* ヘッダー */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-black tracking-tight">
            AI CHRONICLE
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/tools" className="hover:text-accent transition-colors">
              ツール一覧
            </Link>
            <Link href="/news" className="hover:text-accent transition-colors">
              ニュース
            </Link>
            <Link href="/free" className="hover:text-accent transition-colors">
              無料ツール
            </Link>
            <Link
              href="/en"
              className="text-xs font-bold tracking-widest border border-border px-3 py-1 rounded hover:bg-text hover:text-bg transition-colors"
            >
              EN
            </Link>
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="section-label mb-4">★ AI TOOLS DATABASE ★</p>
        <h1 className="hero-heading text-5xl md:text-7xl mb-6">
          AIツールの<br />
          すべてを横断比較。
        </h1>
        <p className="text-text-sub text-lg max-w-2xl">
          価格・機能・無料プラン・最新ニュースを日英同時で。
          自動更新で常に最新の情報を届けます。
        </p>

        <div className="mt-10 inline-flex items-center gap-3 text-sm text-text-muted">
          <span>🚧</span>
          <span>Phase 1構築中：基盤セットアップ完了</span>
        </div>
      </section>

      {/* セットアップ確認用セクション */}
      <section className="bg-bg-sub border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="section-label mb-3">SETUP CHECKLIST</p>
          <h2 className="text-2xl font-bold mb-6">構築完了確認</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ Next.js 15 + TypeScript セットアップ完了</li>
            <li>✅ Tailwind CSS + Framer Motion 導入完了</li>
            <li>✅ src/config.ts 作成完了</li>
            <li>✅ migrations/001_initial.sql 作成完了</li>
            <li>✅ /en（英語版トップ）ルート作成完了</li>
            <li>⏳ Cloudflare D1 接続：Phase 1後半で実施</li>
            <li>⏳ Product Hunt API 連携：Phase 1後半で実施</li>
          </ul>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-xs text-text-muted leading-relaxed">
            当サイトに掲載されているAIツールの価格・機能・仕様等の情報は、
            自動収集システムにより取得した参考情報です。
            情報の正確性・完全性を保証するものではありません。
            最新・正確な情報は各ツールの公式サイトをご確認ください。
          </p>
          <div className="mt-6 flex gap-6 text-xs text-text-sub">
            <Link href="/about" className="hover:text-accent">サイトについて</Link>
            <Link href="/privacy" className="hover:text-accent">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:text-accent">お問い合わせ</Link>
          </div>
          <p className="mt-6 text-xs text-text-muted">© 2026 AI Chronicle</p>
        </div>
      </footer>
    </main>
  );
}
