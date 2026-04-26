// src/app/contact/page.tsx

export const metadata = {
  title: 'お問い合わせ',
  description: 'AI Chronicleへのお問い合わせはこちらから。',
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <article className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="hero-title text-3xl sm:text-4xl mt-3 mb-8">お問い合わせ</h1>

        <div className="space-y-6">
          <p className="text-base leading-relaxed text-[var(--color-text-sub)]">
            AI Chronicleへのご意見・ご要望・ツールの掲載情報に関する修正依頼などは、下記のフォームよりお気軽にお問い合わせください。
          </p>

          <div className="bg-[var(--color-bg-sub)] border border-[var(--color-border)] rounded-sm p-6">
            <h2 className="font-bold text-sm mb-3">掲載情報の修正依頼について</h2>
            <p className="text-sm text-[var(--color-text-sub)] leading-relaxed">
              掲載されているツール情報（価格・機能・スペック等）に誤りがある場合は、ツール名・誤っている箇所・正しい情報をご連絡ください。確認のうえ速やかに修正いたします。
            </p>
          </div>

          <div className="bg-[var(--color-bg-sub)] border border-[var(--color-border)] rounded-sm p-6">
            <h2 className="font-bold text-sm mb-3">ツール掲載希望について</h2>
            <p className="text-sm text-[var(--color-text-sub)] leading-relaxed">
              自社ツールの掲載をご希望の場合は、ツール名・公式サイトURL・簡単な説明をお送りください。編集方針に沿って掲載を検討いたします。
            </p>
          </div>

          <div className="border border-[var(--color-border)] rounded-sm p-6 text-center">
            <p className="text-sm text-[var(--color-text-sub)] mb-4">
              お問い合わせフォームは準備中です。
              <br />
              当面は下記メールアドレスまたはXのDMからご連絡ください。
            </p>
            <div className="font-mono text-sm text-[var(--color-text)]">
              contact@ai-chronicle.example
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
