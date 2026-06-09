// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import FooterWrapper from '@/components/FooterWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getPublishedFeaturesCount } from '@/lib/db';
import CookieBanner from '@/components/CookieBanner';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-chron.com';

export const metadata: Metadata = {
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/icon.png' }], shortcut: '/favicon.ico', apple: '/icon.png' },
  metadataBase: new URL(SITE_URL),
  title: { default: 'AI Chronicle - AIツール最新情報データベース', template: '%s | AI Chronicle' },
  description: '日本語専用AIツールデータベース：世界の最新AIツール情報・ニュース・アップデートをいち早くお届け',
  openGraph: { type: 'website', siteName: 'AI Chronicle', locale: 'ja_JP', images: [{ url: '/og-image.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const featuresCount = await getPublishedFeaturesCount().catch(() => 0);
  const hasFeatures = featuresCount > 0;
  return (
    <html lang="ja" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-F28WYMCPT1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-F28WYMCPT1');`,
          }}
        />
        {/* Google Fonts CDN経由（自己ホスティング廃止・Workers負荷軽減） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 最優先：ロゴ・ナビに使用するフォントをpreload */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=Fira+Sans:wght@700;800;900&display=swap" as="style" />
        {/* 全フォントをstylesheetとして読み込み */}
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Fira+Sans:wght@400;600;700;800;900&family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ai-chronicle-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function show(){document.body.classList.add('fonts-loaded');}if(document.fonts&&document.fonts.ready){document.fonts.ready.then(show);}else{window.addEventListener('load',show);}setTimeout(show,1000);}());`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--color-bg)', overflowX: 'hidden' }} suppressHydrationWarning>
        <ThemeProvider>
          <Header showFeatures={hasFeatures} />
          {children}
          <FooterWrapper showFeatures={hasFeatures} />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
