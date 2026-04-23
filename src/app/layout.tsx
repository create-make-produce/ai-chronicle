import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// ----- フォント設定 -----
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-noto-jp",
  display: "swap",
});

// ----- メタデータ -----
export const metadata: Metadata = {
  title: {
    default: "AI Chronicle - AIツール価格比較データベース",
    template: "%s | AI Chronicle",
  },
  description:
    "日米同時展開のAIツールデータベース。最新のAIツール情報・価格・無料プランを横断比較。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "AI Chronicle",
    description: "AIツールの価格・機能を日英同時で比較できるデータベース",
    type: "website",
  },
  // hreflang は各ページで個別に設定
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
