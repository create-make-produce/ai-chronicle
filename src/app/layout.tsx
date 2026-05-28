// src/app/layout.tsx
import type { Metadata } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP, Orbitron, Fira_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import FooterWrapper from '@/components/FooterWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';

// ── 固定UIテキストのみサブセットダウンロード ──────────────────────────────
// ※ Next.js font loaderの制約によりリテラル文字列で直接記述が必要
// ※ textパラメータ使用時はpreload:falseが必要（カスタムサブセットのため）
// ※ 文字の追加・変更はここと src/font-subsets.ts を同期して更新すること

const orbitron = Orbitron({
  // ロゴ「AI/CHRONICLE」「AI CHRONICLE」専用
  text:     'AI/CHRONICLE ',
  weight:   ['400', '700', '900'],
  variable: '--font-orbitron',
  display:  'swap',
  preload:  false,
});

const firaSans = Fira_Sans({
  // ナビ英語・ヒーロー・バッジ・日付・著作権等（固定英語UIのみ）
  text:     'TOP NEWS MONTHLY TOOLS ABOUT AI TOOLS LATEST INFO AI CHRONICLE AI NEWS AI TOOL Price Change New Tool New Feature Other Learn more © AI Chronicle. All rights reserved. 0123456789/:- JST Select period: Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec Text Generation Image Video Audio Music Coding Assistant Productivity Research Analysis Marketing Other Visit App Store Google Play ▶ . , & ( ) _',
  weight:   ['400', '600', '700', '800', '900'],
  variable: '--font-fira',
  display:  'swap',
  preload:  false,
});

const notoSansJP = Noto_Sans_JP({
  // ナビ日本語・フッター・バッジ・カテゴリ・固定ラベル等（固定日本語UIのみ）
  text:     'トップニュース月刊AIツール一覧運営についてプライバシーポリシーお問い合わせAI最新情報データベース：最新ニュース・アップデート情報を一つの場所で確認※最新・正確な情報は各ツールの公式ページをご確認ください。AI一覧料金改定新ツール新機能その他テキスト生成画像動画音声音楽コーディング業務効率化情報分析マーケティング詳しく見るホームすべてのAI概要リンクメディアWebサイトダウンロードデモを見る動画を見るユーザー数ニュース一覧に戻る期間を選択：年月日',
  weight:   ['300', '400', '700'],
  variable: '--font-noto',
  display:  'swap',
  preload:  false,
});

const notoSerifJP = Noto_Serif_JP({
  // HeroSectionキャッチコピー4行のみ
  text:     'AIの世界は、毎日動いている海外発の最新ツールを日本語でいち早く新機能／新サービス／料金改定知るべきニュースを、見逃さないThe AI world moves every day latest tools from overseas in Japanese features services Price changes Stay ahead Miss nothing',
  weight:   ['400', '500', '600', '700'],
  variable: '--font-noto-serif',
  display:  'swap',
  preload:  false,
});
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-chronicle-76h.pages.dev';

export const metadata: Metadata = {
  icons: { icon: '/icon.png', apple: '/icon.png' },
  metadataBase: new URL(SITE_URL),
  title: { default: 'AI Chronicle - AIツール最新情報データベース', template: '%s | AI Chronicle' },
  description: 'AIツールの最新情報データベース。最新ニュース・価格・アップデートを一つの場所で確認。',
  openGraph: { type: 'website', siteName: 'AI Chronicle', locale: 'ja_JP', alternateLocale: ['en_US'] },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/', languages: { ja: '/', en: '/en', 'x-default': '/' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      data-theme="dark"
      suppressHydrationWarning
      className={`${orbitron.variable} ${firaSans.variable} ${notoSansJP.variable} ${notoSerifJP.variable}`}
    >
      <head>
        {/* テーマフラッシュ防止：JS実行前にdata-themeをlocalStorageから復元 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ai-chronicle-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--color-bg)', overflowX: 'hidden' }}>
        <ThemeProvider>
          <Header />
          {children}
          <FooterWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
