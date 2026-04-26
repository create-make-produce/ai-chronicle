// src/config.ts
// 可変パラメータ集中管理
// Phase 1 で既に存在している可能性が高いため、既存の値と統合してください。
// この値が Phase 2 コード側で参照されます。

export const CONFIG = {
  // =============================================
  // キャッシュ戦略（ISR revalidate 秒数）
  // =============================================
  /** トップページのISR再生成間隔（秒）。30分 */
  REVALIDATE_TOP_PAGE_SECONDS: 1800,
  /** ツール詳細ページのISR再生成間隔（秒）。24時間 */
  REVALIDATE_TOOL_PAGE_SECONDS: 86400,
  /** カテゴリページのISR再生成間隔（秒）。1時間 */
  REVALIDATE_CATEGORY_PAGE_SECONDS: 3600,

  // =============================================
  // 表示件数
  // =============================================
  /** トップに表示する最新ニュース件数 */
  NEWS_TOP_DISPLAY_COUNT: 5,
  /** 「新着」扱いとする時間（時間単位）。24 = 過去24時間以内 */
  NEW_TOOLS_DISPLAY_HOURS: 24,
  /** トップの新着セクションに表示する最大件数 */
  NEW_TOOLS_TOP_DISPLAY_COUNT: 6,
  /** トップの無料特集に表示する最大件数 */
  FREE_TOOLS_TOP_DISPLAY_COUNT: 8,

  // =============================================
  // 価格改定通知
  // =============================================
  /** 何日以内の価格改定をトップに表示するか */
  PRICE_CHANGE_ALERT_DAYS: 30,

  // =============================================
  // データ収集（Phase 1 用・Phase 2 から参照はしない）
  // =============================================
  /** Gemini model 名（Phase 1 のデータ収集スクリプト用） */
  GEMINI_MODEL: 'gemini-3.1-flash-lite-preview',
  /** Gemini API 呼び出しのリトライ回数 */
  GEMINI_MAX_RETRIES: 3,
} as const;

export type Config = typeof CONFIG;
