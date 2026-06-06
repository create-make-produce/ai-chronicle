// src/app/about/page.tsx

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
              AI Chronicleは、世界の最新AIツール情報を日本語でいち早くお届けすることを目的としたデータベースサイトです。
            </p>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              英語圏では毎日数十本のAIツールが登場しますが、日本語でまとまった情報を得られる場所はまだ限られています。当サイトは「世界のAI最前線を、日本語で・素早く・わかりやすく」届けることをミッションとしています。
            </p>
          </section>

          {/* 運営者について */}
          <section>
            <h2 className="font-display text-xl mb-3">運営者について</h2>
            <div style={{ marginBottom: '1rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { label: '運営者', value: '20年以上の実務経験を持つシステムエンジニア' },
                  { label: '専門領域', value: 'インフラ設計・クラウドアーキテクチャ・AIツールの技術評価' },
                  { label: '運営形態', value: '個人で企画・開発・監修' },
                ].map(({ label, value }) => (
                  <li key={label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '6em', fontSize: '0.85rem' }}>
                      {label}
                    </span>
                    <span style={{ color: 'var(--color-text-sub)', lineHeight: 1.7 }}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="leading-relaxed text-[var(--color-text-sub)] mb-3">
              近年のAI技術の急速な進化に伴い、ツールの品質・信頼性に大きな差が生じています。当サイトでは信頼性・実用性の観点から掲載基準を設け、条件を満たしたものを掲載しています。
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
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>掲載対象外：</span>
                以下のカテゴリに該当するAIツールは掲載しません。医療・健康診断系（診断・治療・投薬に関わるツール）、金融投資アドバイザリー系（投資判断・資産運用の助言を行うツール）、アダルト・成人向けコンテンツ系、暴力・犯罪支援系（暴力的コンテンツの生成・詐欺・フィッシング・マルウェア等の犯罪行為を支援するツール）。
              </p>
              <p>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>日本語コンテンツ：</span>
                ツールの説明文・ニュース本文は、運営担当が一次情報源をもとに編集・監修しています。誤情報・不適切な表現が含まれていると判断した場合は修正または非公開とします。
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
