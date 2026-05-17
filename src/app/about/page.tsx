// src/app/about/page.tsx
export const runtime = 'edge';

export const metadata = {
  title: '運営について | AI Chronicle',
  description: 'AI Chronicleの運営方針・監修体制・サイトコンセプトについてご紹介します。',
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* タイトル */}
        <h1 className="hero-title text-3xl sm:text-4xl mt-3 mb-2">運営について</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
          AI Chronicleの運営方針・監修体制・サイトコンセプトをご説明します。
        </p>

        <div className="space-y-10 text-[var(--color-text)]">

          {/* サイトコンセプト */}
          <section>
            <h2 className="font-display text-xl mb-3">このサイトについて</h2>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              AI Chronicleは、海外で発表された最新AIツール情報を日本語でいち早くお届けすることを目的としたデータベースサイトです。
            </p>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              英語圏では毎日数十本のAIツールが登場しますが、日本語でまとまった情報を得られる場所はまだ限られています。当サイトは「海外のAI最前線を、日本語で・素早く・わかりやすく」届けることをミッションとしています。
            </p>
          </section>

          {/* 運営者について */}
          <section>
            <h2 className="font-display text-xl mb-3">運営者について</h2>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              当サイトは、システムエンジニアとして20年以上の実務経験を持つ運営担当が個人で企画・開発・監修しています。インフラ設計・クラウドアーキテクチャを専門領域とし、AIツールの技術的な背景や実用性についての知見をもとに、掲載内容を精査・監修しています。
            </p>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              近年のAI技術の急速な進化に伴い、ツールの品質・信頼性に大きな差が生じています。当サイトでは技術的な観点から各ツールを評価し、実際に活用できると判断したものを中心に掲載しています。
            </p>
          </section>

          {/* 収集・監修方針 */}
          <section>
            <h2 className="font-display text-xl mb-3">情報収集・監修の方針</h2>
            <div className="leading-relaxed text-[var(--color-text-sub)] space-y-3">
              <p>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>データソース：</span>
                各ツール公式サイトなど、信頼性の高い一次情報源を優先して収集しています。
              </p>
              <p>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>掲載基準：</span>
                公式URLが確認できないツール・信頼性に疑問があるツールは非公開とし、掲載しません。掲載後も定期的に情報を更新し、サービス終了等が確認された場合は速やかに対応します。
              </p>
              <p>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>日本語コンテンツ：</span>
                ツールの説明文・ニュース本文は、AIを活用して生成した後、運営担当が内容を確認・監修しています。誤情報・不適切な表現が含まれていると判断した場合は修正または非公開とします。
              </p>
              <p>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>更新頻度：</span>
                新しいAIツールの情報は日次で収集・更新しています。情報の鮮度を保つことを重視しています。
              </p>
            </div>
          </section>

          {/* お問い合わせ導線 */}
          <section>
            <h2 className="font-display text-xl mb-3">ご意見・掲載に関するお問い合わせ</h2>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              掲載情報の誤り・修正依頼・掲載希望・その他お問い合わせは、<a href="/contact" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>お問い合わせフォーム</a>よりご連絡ください。内容を確認のうえ、順次対応いたします。
            </p>
          </section>

        </div>

        {/* フッター */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          <p>AI Chronicle 運営担当</p>
        </div>

      </article>
    </main>
  );
}
