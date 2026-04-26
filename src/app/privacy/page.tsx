// src/app/privacy/page.tsx
// プライバシーポリシー（日本国内向けに日本語で表記。英語ユーザーにも同じページで対応）

export const metadata = {
  title: 'プライバシーポリシー',
  description: 'AI Chronicleのプライバシーポリシー。',
};

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="hero-title text-3xl sm:text-4xl mt-3 mb-8">プライバシーポリシー</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-[var(--color-text)]">
          <section>
            <h2 className="font-display text-xl mb-2">1. 個人情報の取得</h2>
            <p className="leading-relaxed">
              AI Chronicle（以下「当サイト」といいます）は、お問い合わせフォーム等を通じて、利用者の個人情報を取得する場合があります。
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-2">2. アクセス解析ツールについて</h2>
            <p className="leading-relaxed">
              当サイトでは、Googleによるアクセス解析ツール「Google Analytics」を利用する場合があります。Google
              Analyticsはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-2">3. 広告の配信について</h2>
            <p className="leading-relaxed">
              当サイトは、第三者配信の広告サービス「Google
              AdSense」を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報（氏名、住所、メールアドレス、電話番号は含まれません）を使用することがあります。
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-2">4. アフィリエイトプログラムについて</h2>
            <p className="leading-relaxed">
              当サイトは、その他のアフィリエイトプログラムを利用する場合があります。アフィリエイトリンクを含む場合は、該当箇所に明記します。
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-2">5. 免責事項</h2>
            <p className="leading-relaxed">
              当サイトに掲載されているAIツールの価格・機能・仕様等の情報は参考情報であり、正確性・完全性を保証するものではありません。最新・正確な情報は各ツールの公式ページをご確認ください。
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-2">6. 著作権について</h2>
            <p className="leading-relaxed">
              当サイトで掲載している画像・ロゴ等の著作権・肖像権は各権利所有者に帰属します。掲載内容に関して問題がありましたら、お問い合わせフォームよりご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-2">7. プライバシーポリシーの変更</h2>
            <p className="leading-relaxed">
              本プライバシーポリシーの内容は、利用者への通知なく変更されることがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
