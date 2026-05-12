// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP, Anton, Orbitron, Fira_Sans, Merriweather, Shippori_Mincho } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import FooterWrapper from '@/components/FooterWrapper';

const inter = Inter({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-inter', display: 'swap' });
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['300','400','700'], variable: '--font-noto', display: 'swap' });
const anton = Anton({ subsets: ['latin'], weight: ['400'], variable: '--font-anton', display: 'swap' });
const firaSans = Fira_Sans({ subsets: ['latin'], weight: ['400','600','700','800','900'], variable: '--font-fira', display: 'swap' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-merriweather', display: 'swap' });
const shipporiMincho = Shippori_Mincho({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-shippori', display: 'swap' });
const orbitron = Orbitron({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-orbitron', display: 'swap' });

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
      className={`${inter.variable} ${notoSansJP.variable} ${anton.variable} ${orbitron.variable} ${firaSans.variable} ${merriweather.variable} ${shipporiMincho.variable}`}
    >
      <head />
      <body className="min-h-screen flex flex-col antialiased" style={{ background: '#111318', overflowX: 'hidden' }}>
        <Header />
        {children}
        <FooterWrapper />
      </body>
    </html>
  );
}
