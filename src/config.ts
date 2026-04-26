// src/config.ts
// 可変パラメータ集中管理

export const CONFIG = {
  // =============================================
  // キャッシュ戦略（ISR revalidate 秒数）
  // =============================================
  REVALIDATE_TOP_PAGE_SECONDS: 1800,
  REVALIDATE_TOOL_PAGE_SECONDS: 86400,
  REVALIDATE_CATEGORY_PAGE_SECONDS: 3600,

  // =============================================
  // 表示件数
  // =============================================
  NEWS_TOP_DISPLAY_COUNT: 5,
  NEW_TOOLS_DISPLAY_HOURS: 24,
  NEW_TOOLS_TOP_DISPLAY_COUNT: 6,
  FREE_TOOLS_TOP_DISPLAY_COUNT: 8,

  // =============================================
  // 価格改定通知
  // =============================================
  PRICE_CHANGE_ALERT_DAYS: 30,

  // =============================================
  // データ収集スクリプト用
  // =============================================
  MAX_NEW_TOOLS_PER_RUN: 50,
  MAX_PRICE_CHECKS_PER_RUN: 50,
  MIN_AI_CONFIDENCE_TO_PUBLISH: 0.6,

  // =============================================
  // Product Hunt API
  // =============================================
  PRODUCT_HUNT_POSTS_PER_REQUEST: 50,
  PRODUCT_HUNT_MIN_VOTES: 0,
  PRODUCT_HUNT_DAILY_REQUEST_LIMIT: 80,

  // =============================================
  // AI プロバイダー設定
  // =============================================
  AI_PROVIDER: 'gemini' as 'gemini' | 'openai' | 'claude',
  AI_MODEL: 'gemini-3.1-flash-lite-preview',
  AI_REQUEST_INTERVAL_MS: 5000,
  AI_MAX_RETRIES: 3,
  AI_RETRY_DELAY_MS: 10000,
  AI_MAX_OUTPUT_TOKENS: 1024,

  // =============================================
  // Gemini（後方互換用）
  // =============================================
  GEMINI_MODEL: 'gemini-3.1-flash-lite-preview',
  GEMINI_MAX_RETRIES: 3,

  // =============================================
  // ニュース設定
  // =============================================
  NEWS_GENERATE_ON_PRICE_CHANGE: true,
  NEWS_GENERATE_ON_NEW_TOOL: true,
} as const;

export type Config = typeof CONFIG;
