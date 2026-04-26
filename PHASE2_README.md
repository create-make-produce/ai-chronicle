# AI Chronicle — Phase 2 フロントエンド実装

このZIPには Phase 2 のフロントエンド実装一式が含まれています。

## 同梱ファイル

- `src/app/**` — Next.js 15 App Router 配下のページ群（日英両対応）
  - `page.tsx`, `layout.tsx`, `globals.css`, `not-found.tsx`, `sitemap.ts`, `robots.ts`
  - ツール詳細 `/tool/[slug]`、カテゴリ `/category/[slug]`、ニュース一覧・詳細
  - 新着 `/new`、無料 `/free`、全ツール `/tools`、About、Privacy、Contact
  - 英語版 `/en/**` 一式
- `src/components/**` — 再利用コンポーネント（Header, Footer, ToolCard, PriceTable, SpecTable, CategoryCompare, CategoryGrid, AdSlot, SearchBox, ToolsFilter, HeroSection, HomeContent, ToolDetailContent, CategoryContent, ToolsListContent, NewsListContent, NewsDetailContent, DisclaimerBadge）
- `src/lib/**` — `db.ts`（D1 REST API クライアント）, `i18n.ts`（日英辞書・パスヘルパー）, `price.ts`（価格表示ロジック）
- `src/types/index.ts` — 型定義
- `src/middleware.ts` — Accept-Language 自動判定
- `src/config.ts` — 可変パラメータ（Phase 1 の config に Phase 2 で必要な値を追加）
- `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `package.json`

## 展開先

ZIPを `D:\00_ALL\00_WORK\01_WebSite\04_AI-Chronicle\00_Project\` に展開すると、
`AI-Chronicle\` フォルダが作成・上書きされます。
`dev.bat` `push.bat` は `00_Project\` 直下にあるまま（変更なし）。

## 初回セットアップ

1. ZIP展開後、`AI-Chronicle\` フォルダで次を実行：
   ```
   cd AI-Chronicle
   npm install
   ```
   （`framer-motion`, `@tailwindcss/postcss` が新規追加されます）

2. `.env.local` に Cloudflare 認証情報を設定（Phase 1 で既にあればそのまま）：
   ```
   CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLOUDFLARE_D1_DATABASE_ID=f6fecbd5-d72c-4b80-b4ae-42746a527583
   CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_SITE_URL=https://ai-chronicle-76h.pages.dev
   ```

3. 動作確認：
   ```
   dev.bat
   ```
   → `http://localhost:3000` で日本語トップ、`http://localhost:3000/en` で英語トップ。

4. 本番デプロイ：
   ```
   push.bat
   ```

## 注意事項

### Cloudflare Pages のビルド設定

Cloudflare Pages 側で下記が設定されていること：
- Build command: `npm run build`
- Build output: `.next`
- Framework preset: `Next.js`
- 環境変数：上記 `.env.local` の3つ（`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_SITE_URL`）

### D1 への読み取りは REST API 経由

Phase 2 のフロントエンドは D1 バインディングではなく Cloudflare REST API 経由で D1 を読みます。
利点：ローカル開発（`npm run dev`）でも本番と同じコードで動く／ Edge runtime 強制が不要／ ISR ビルド時のみコールされるのでランタイムオーバーヘッドもほぼなし。

### 広告枠（AdSlot）

`src/components/AdSlot.tsx` および `globals.css` の `.ad-slot` クラスで、
広告枠は初期状態で `display: none !important` になっています。
AdSense 承認後は、`globals.css` の該当箇所を `display: block` に変更し、
`AdSlot.tsx` の中身に `<ins class="adsbygoogle">` タグを追加することで切り替えられます（HayakatsuLabo方式）。

### 日英切替

- 初回アクセス時、ブラウザの `Accept-Language` に応じて `/` または `/en` に自動リダイレクト
- ヘッダー右上の `JP / EN` ボタンで手動切替（Cookie `NEXT_LOCALE` に保存、1年有効）

### データが少ないときの挙動

トップページの各セクション（最新ニュース、新着ツール、価格改定、無料特集）は、
データが0件のときは表示をスキップします。全セクションが0件の場合のみ
「データ収集中」のメッセージが表示されます。

## Phase 1 既存ファイルとの関係

以下のPhase 1ファイルは**変更していません**（同梱していません）：
- `scripts/collect-new-tools.ts`
- `scripts/update-prices.ts`
- `migrations/*.sql`
- `wrangler.toml`
- `.github/workflows/*.yml`
- `dev.bat`, `push.bat`

Phase 1 の `src/config.ts` は、今回同梱の `src/config.ts` で上書きされます。
上書きしても Phase 1 の値（`GEMINI_MODEL`, `GEMINI_MAX_RETRIES` 等）は保持しているので、データ収集スクリプトはそのまま動作するはずです。
もし既存 `config.ts` に独自の値を追加していた場合は、マージしてください。
