// src/env.d.ts
// Cloudflare Bindings の型定義
// wrangler.toml の [[d1_databases]] binding = "DB" に対応

interface CloudflareEnv {
  DB: D1Database;
}
