// =============================================
// AI Chronicle - 可変パラメータ設定ファイル
// =============================================
// スケジュール・件数・API制限に関わる数値は
// すべてここで管理する。コード内にハードコードしない。
// 設計図V2 第6章準拠
// =============================================

export const CONFIG = {

  // ----------------------------------------
  // データ収集スケジュール
  // GitHub Actions の cron に対応する間隔設定
  // ----------------------------------------
  SCRAPE_NEW_TOOLS_INTERVAL_HOURS: 4,       // 新着ツール収集の間隔（時間）※1日6回実行
  SCRAPE_PRICE_INTERVAL_DAYS: 7,            // 価格メンテナンスの間隔（日）
  PRODUCT_HUNT_SCRAPE_HOUR_UTC: 2,          // Product Hunt収集の実行時刻（UTC）
  PRICE_CHECK_HOUR_UTC: 3,                  // 価格チェックの実行時刻（UTC）

  // ----------------------------------------
  // 1回の処理件数上限
  // AI API / GitHub Actions の無料枠を超えないよう制御
  // ----------------------------------------
  MAX_NEW_TOOLS_PER_RUN: 50,                // 1回の実行で新規登録する最大ツール数
  MAX_PRICE_CHECKS_PER_RUN: 50,             // 1回の実行で価格チェックする最大ツール数
  MAX_TRANSLATION_PER_RUN: 40,              // 1回の実行で翻訳処理する最大ツール数

  // ----------------------------------------
  // AI プロバイダー設定
  // ここを変えるだけで別のAI APIに切り替え可能
  // ----------------------------------------
  AI_PROVIDER: 'gemini' as 'gemini' | 'openai' | 'claude',
  // gemini  → Google Gemini API（デフォルト・無料枠あり）
  // openai  → OpenAI API（GPT-4o等）
  // claude  → Anthropic Claude API

  AI_MODEL: 'gemini-3.1-flash-lite-preview',
  // gemini使用時  → 'gemini-3.1-flash-lite-preview'（推奨・500RPD）/ 'gemini-2.5-flash'（250RPD）
  // openai使用時  → 'gpt-4o-mini' / 'gpt-4o'
  // claude使用時  → 'claude-haiku-4-5' / 'claude-sonnet-4-6'

  AI_API_BASE_URL: '',              // カスタムエンドポイント（空欄=各プロバイダーのデフォルト）
  AI_REQUEST_INTERVAL_MS: 5000,     // リクエスト間隔（ms）※レート制限対策（gemini-3.1-flash-lite-preview RPM=15対応）
  AI_MAX_RETRIES: 3,                // リトライ最大回数
  AI_RETRY_DELAY_MS: 10000,         // リトライ待機時間（ms）
  AI_MAX_OUTPUT_TOKENS: 1024,       // 最大出力トークン数

  // ----------------------------------------
  // Product Hunt API 制御
  // 無料枠：1日100リクエスト
  // ----------------------------------------
  PRODUCT_HUNT_DAILY_REQUEST_LIMIT: 80,     // 1日の最大リクエスト数（余裕をもって80）
  PRODUCT_HUNT_POSTS_PER_REQUEST: 50,       // 1リクエストで取得する件数
  PRODUCT_HUNT_MIN_VOTES: 0,                // 登録対象の最小投票数フィルター（0=全件対象）

  // ----------------------------------------
  // スクレイピング制御
  // 公式価格ページへのアクセスのみ許可
  // ----------------------------------------
  SCRAPER_USER_AGENT: 'AI-Chronicle-Bot/1.0 (+https://ai-chronicle.com/about)',
  SCRAPER_REQUEST_DELAY_MS: 3000,           // リクエスト間隔（ms）※サーバー負荷対策
  SCRAPER_TIMEOUT_MS: 10000,                // タイムアウト（ms）
  SCRAPER_MAX_RETRIES: 2,                   // リトライ最大回数

  // ----------------------------------------
  // ISR（増分静的再生成）設定
  // ----------------------------------------
  REVALIDATE_TOOL_PAGE_SECONDS: 86400,      // ツール詳細ページ（24時間）
  REVALIDATE_CATEGORY_PAGE_SECONDS: 3600,   // カテゴリページ（1時間）
  REVALIDATE_TOP_PAGE_SECONDS: 1800,        // トップページ（30分）

  // ----------------------------------------
  // コンテンツ設定
  // ----------------------------------------
  TOOLS_PER_CATEGORY_PAGE: 30,              // カテゴリページの1ページ表示件数
  NEW_TOOLS_DISPLAY_HOURS: 24,              // 「新着」表示する時間範囲
  PRICE_CHANGE_ALERT_DAYS: 7,               // 「価格改定」表示する日数範囲
  MIN_AI_CONFIDENCE_TO_PUBLISH: 0.6,        // 自動公開する最低AIconfidenceスコア

  // ----------------------------------------
  // ニュース設定
  // ----------------------------------------
  NEWS_TOP_DISPLAY_COUNT: 5,                // トップページに表示するニュース件数
  NEWS_GENERATE_ON_PRICE_CHANGE: true,      // 価格変更時にニュース自動生成するか
  NEWS_GENERATE_ON_NEW_TOOL: true,          // 新着ツール登録時にニュース自動生成するか
  NEWS_MIN_BODY_LENGTH: 200,                // ニュース本文の最低文字数（日本語）

} as const;

// ----------------------------------------
// 型エクスポート
// ----------------------------------------
export type Config = typeof CONFIG;
export type AIProvider = typeof CONFIG.AI_PROVIDER;
