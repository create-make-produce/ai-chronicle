// next.config.ts
// AI Chronicle - Next.js 15 設定

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 外部ドメインからのロゴ画像読み込みを許可（favicon等）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // Cloudflare Pages では Next.js 画像最適化を切る
    unoptimized: true,
  },

  // 長いビルド時にタイムアウトしないように
  experimental: {
    // App Router で Server Components のキャッシュ戦略を制御
  },

  // TypeScript strict モード（ビルドエラーで止めない）
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ビルド時の ESLint エラーで止めない（警告は残す）
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
