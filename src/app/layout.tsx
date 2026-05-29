// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import FooterWrapper from '@/components/FooterWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getPublishedFeaturesCount } from '@/lib/db';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const featuresCount = await getPublishedFeaturesCount().catch(() => 0);
  const hasFeatures = featuresCount > 0;
  return (
    <html lang="ja" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Google Fonts CDN経由（自己ホスティング廃止・Workers負荷軽減） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Fira+Sans:wght@400;600;700;800;900&family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ai-chronicle-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--color-bg)', overflowX: 'hidden' }}>
        <ThemeProvider>
          <Header showFeatures={hasFeatures} />
          {children}
          <FooterWrapper showFeatures={hasFeatures} />
        </ThemeProvider>
      </body>
    </html>
  );
}
