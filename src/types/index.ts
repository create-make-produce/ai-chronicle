// src/types/index.ts
export type Locale = 'ja' | 'en';

export interface Tool {
  id: string; slug: string; parent_tool_id: string | null;
  name_ja: string; name_en: string;
  tagline_ja: string | null; tagline_en: string | null;
  description_ja: string | null; description_en: string | null;
  official_url: string | null; logo_url: string | null;
  company_name: string | null; company_country: string | null;
  founded_year: number | null; twitter_handle: string | null; github_url: string | null;
  category_id: string | null; status: string; is_published: number;
  has_free_plan: number; free_plan_detail_ja: string | null; free_plan_detail_en: string | null;
  has_free_trial: number; free_trial_days: number | null;
  screenshot_urls: string | null; demo_url: string | null; video_url: string | null;
  ios_url: string | null; android_url: string | null;
  product_hunt_id: string | null; product_hunt_url: string | null;
  user_count_label: string | null;
  affiliate_url: string | null; affiliate_rate: number | null; has_affiliate: number;
  ai_confidence_score: number | null; needs_manual_review: number;
  data_source: string | null; source_url: string | null;
  last_scraped_at: string | null; last_price_checked_at: string | null;
  created_at: string; updated_at: string;
}

export interface PricingPlan {
  id: string; tool_id: string;
  plan_name: string; plan_name_ja: string | null; is_free: number;
  price_usd: number | null; price_jpy_official: number | null; has_japan_pricing: number;
  price_usd_annual: number | null; price_jpy_annual: number | null; annual_discount_pct: number | null;
  billing_cycle: string; price_per_unit: string | null;
  features_ja: string | null; features_en: string | null; usage_limits: string | null;
  price_trend: string | null; previous_price_usd: number | null;
  price_changed_at: string | null; price_source_url: string | null;
  created_at: string; updated_at: string;
}

export interface Category {
  id: string; slug: string; name_ja: string; name_en: string;
  description_ja: string | null; description_en: string | null;
  icon_emoji: string | null; display_order: number; created_at: string;
}

export interface Tag {
  id: string; slug: string; name_ja: string; name_en: string; created_at: string;
}

export interface News {
  id: string; slug: string; title_ja: string; title_en: string | null;
  body_ja: string | null; body_en: string | null;
  news_type: string; tool_id: string | null; is_published: number;
  published_at: string; created_at: string; updated_at: string;
}

export interface ToolLaunch {
  id: string; tool_id: string;
  launch_name: string; name_ja: string | null;
  tagline: string | null; tagline_ja: string | null;
  launch_date: string | null; launch_number: number | null;
  thumbnail_url: string | null; url: string | null;
  created_at: string;
}

export interface NoteArticle {
  id: string; tool_id: string;
  title: string;
  thumbnail_url: string | null;
  author_name: string | null;
  author_icon_url: string | null;
  note_url: string;
  likes_count: number;
  published_at: string | null;
  created_at: string;
}

export interface ToolWithPlans extends Tool {
  plans: PricingPlan[];
  category?: Category | null;
}
