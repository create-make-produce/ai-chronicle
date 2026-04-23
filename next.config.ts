import type { NextConfig } from "next";

/**
 * AI Chronicle - Next.js設定
 *
 * 多言語対応について：
 * Next.js 15のApp Routerでは、従来のi18nオプションが使えない。
 * 代わりに /en/* ルートを物理的に分けて配置することで対応している。
 * Accept-Languageヘッダーによる自動判定は src/middleware.ts で実装。
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 画像最適化
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Cloudflare Pages対応
  // 注：Cloudflare Pages with Next.jsを使う場合、@cloudflare/next-on-pagesのビルドコマンド経由でデプロイ
};

export default nextConfig;
