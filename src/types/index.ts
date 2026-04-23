// =============================================
// AI Chronicle - 型定義
// =============================================

export type Locale = 'ja' | 'en';

export type ToolStatus = 'active' | 'inactive' | 'beta' | 'deprecated';

export type NewsType = 'price_change' | 'new_tool' | 'new_feature' | 'other';

export type BillingCycle = 'monthly' | 'annual' | 'one_time' | 'usage_based';

export type PriceTrend = 'up' | 'down' | 'stable';

// ----------------------------------------
// カテゴリ
// ----------------------------------------
export interface Category {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  description_ja: string | null;
  description_en: string | null;
  icon_emoji: string | null;
  display_order: number;
  created_at: string;
}

// ----------------------------------------
// タグ
// ----------------------------------------
export interface Tag {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  created_at: string;
}

// ----------------------------------------
// ツール
// ----------------------------------------
export interface Tool {
  id: string;
  slug: string;
  parent_tool_id: string | null;

  name_ja: string;
  name_en: string;
  tagline_ja: string | null;
  tagline_en: string | null;
  description_ja: string | null;
  description_en: string | null;
  official_url: string | null;
  logo_url: string | null;

  company_name: string | null;
  company_country: string | null;
  founded_year: number | null;
  twitter_handle: string | null;
  github_url: string | null;
  is_open_source: number;
  license_type: string | null;

  category_id: string | null;

  status: ToolStatus;
  is_published: number;

  os_support: string | null;          // JSON配列
  language_support: string | null;    // JSON配列
  has_api: number;
  login_methods: string | null;       // JSON配列
  has_mobile_app: number;
  has_chrome_ext: number;
  data_storage_region: string | null;
  gdpr_compliant: number | null;
  soc2_certified: number | null;
  integration_list: string | null;    // JSON配列

  has_free_plan: number;
  free_plan_detail_ja: string | null;
  free_plan_detail_en: string | null;
  has_free_trial: number;
  free_trial_days: number | null;

  screenshot_urls: string | null;     // JSON配列
  demo_url: string | null;
  video_url: string | null;

  product_hunt_id: string | null;
  product_hunt_url: string | null;
  user_count_label: string | null;

  affiliate_url: string | null;
  affiliate_rate: number | null;
  has_affiliate: number;

  ai_confidence_score: number | null;
  needs_manual_review: number;
  data_source: string | null;
  source_url: string | null;

  last_scraped_at: string | null;
  last_price_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------
// 価格プラン
// ----------------------------------------
export interface PricingPlan {
  id: string;
  tool_id: string;

  plan_name: string;
  plan_name_ja: string | null;
  is_free: number;

  price_usd: number | null;
  price_jpy_official: number | null;
  has_japan_pricing: number;

  price_usd_annual: number | null;
  price_jpy_annual: number | null;
  annual_discount_pct: number | null;

  billing_cycle: BillingCycle;
  price_per_unit: string | null;

  features_ja: string | null;
  features_en: string | null;
  usage_limits: string | null;

  price_trend: PriceTrend | null;
  previous_price_usd: number | null;
  price_changed_at: string | null;

  price_source_url: string | null;

  created_at: string;
  updated_at: string;
}

// ----------------------------------------
// ニュース
// ----------------------------------------
export interface News {
  id: string;
  slug: string;
  title_ja: string;
  title_en: string | null;
  body_ja: string | null;
  body_en: string | null;
  news_type: NewsType;
  tool_id: string | null;
  is_published: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------
// 収集ログ
// ----------------------------------------
export interface ScrapeLog {
  id: string;
  job_name: string;
  status: 'success' | 'error' | 'partial';
  tools_added: number;
  tools_updated: number;
  errors: string | null;
  started_at: string;
  finished_at: string | null;
}

// ----------------------------------------
// Cloudflare D1 Bindings（next-on-pages用）
// ----------------------------------------
export interface CloudflareEnv {
  DB: D1Database;
}

// D1Databaseの型は @cloudflare/workers-types から提供されるが、
// ここでは最小限の宣言を入れておく
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1ExecResult>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
  }
  interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
  }
  interface D1ExecResult {
    count: number;
    duration: number;
  }
}
