# AI Chronicle

日米同時展開のAIツールデータベース。価格・機能・最新ニュースを自動収集して提供する。

## Phase 1 - ローカル構築フェーズ

このZIPには以下の土台が含まれています：

- ✅ Next.js 15 + TypeScript
- ✅ Tailwind CSS（カラー変数で一元管理）
- ✅ Framer Motion
- ✅ src/config.ts（可変パラメータ）
- ✅ migrations/001_initial.sql（D1スキーマ + 8カテゴリの初期データ）
- ✅ wrangler.toml（Cloudflare設定の雛形）
- ✅ next.config.ts（多言語対応の準備）
- ✅ .gitignore / .gitattributes
- ✅ .env.local（テンプレート・APIキーは未記入）
- ✅ トップページ（日本語）/ /en（英語）

## ローカル動作確認手順

```
1. ZIPを展開して D:\00_ALL\00_WORK\01_WebSite\04_AI-Chronicle\00_Project\AI-Chronicle に配置
2. dev.bat をダブルクリック（初回は npm install が必要）
3. http://localhost:3000 が表示されればOK
```

### 初回のみ：npm install

dev.batに`npm install`は含めていないため、初回は手動で実行が必要：

```
PowerShellを開く
cd D:\00_ALL\00_WORK\01_WebSite\04_AI-Chronicle\00_Project\AI-Chronicle
npm install
```

完了したら dev.bat をダブルクリック。

## ファイル構成

```
AI-Chronicle/
├── src/
│   ├── config.ts                  ← 可変パラメータ（重要・変更頻度高）
│   ├── types/index.ts             ← TypeScript型定義
│   └── app/
│       ├── layout.tsx             ← 共通レイアウト
│       ├── globals.css            ← カラー変数・グローバルCSS
│       ├── page.tsx               ← トップ（日本語）
│       └── en/page.tsx            ← トップ（英語）
├── migrations/
│   └── 001_initial.sql            ← D1テーブル定義 + カテゴリ初期データ
├── public/                        ← 静的ファイル
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── wrangler.toml                  ← Cloudflare設定（DB ID未設定）
├── .env.local                     ← APIキー（要記入・GitHubに上げない）
├── .gitignore
└── .gitattributes
```

## 次のステップ

1. ローカルで `http://localhost:3000` が表示できることを確認
2. APIキーを取得して `.env.local` に記入
3. GitHubリポジトリ作成 → 初回push
4. Cloudflare Pagesと連携
5. Cloudflare D1 セットアップ + マイグレーション実行
6. Phase 2（フロントエンド本実装）へ
