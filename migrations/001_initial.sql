-- =============================================
-- AI Chronicle - 初期テーブル定義
-- 設計図V2 第7章準拠
-- =============================================
-- 実行コマンド（ローカル）:
--   wrangler d1 execute ai-chronicle-db --local --file=./migrations/001_initial.sql
-- 実行コマンド（本番）:
--   wrangler d1 execute ai-chronicle-db --remote --file=./migrations/001_initial.sql
-- =============================================

-- ===== カテゴリマスター =====
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name_ja       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  description_ja TEXT,
  description_en TEXT,
  icon_emoji    TEXT,
  display_order INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);

-- ===== タグマスター =====
CREATE TABLE IF NOT EXISTS tags (
  id        TEXT PRIMARY KEY,
  slug      TEXT UNIQUE NOT NULL,
  name_ja   TEXT NOT NULL,
  name_en   TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- ===== ツール基本情報（メインテーブル） =====
CREATE TABLE IF NOT EXISTS tools (
  -- 識別
  id                    TEXT PRIMARY KEY,
  slug                  TEXT UNIQUE NOT NULL,
  parent_tool_id        TEXT REFERENCES tools(id),

  -- 基本情報
  name_ja               TEXT NOT NULL,
  name_en               TEXT NOT NULL,
  tagline_ja            TEXT,
  tagline_en            TEXT,
  description_ja        TEXT,
  description_en        TEXT,
  official_url          TEXT,
  logo_url              TEXT,

  -- 会社・開発元
  company_name          TEXT,
  company_country       TEXT,
  founded_year          INTEGER,
  twitter_handle        TEXT,
  github_url            TEXT,
  is_open_source        INTEGER DEFAULT 0,
  license_type          TEXT,

  -- カテゴリ
  category_id           TEXT REFERENCES categories(id),

  -- ステータス
  status                TEXT DEFAULT 'active',
  is_published          INTEGER DEFAULT 0,

  -- 機能・スペック
  os_support            TEXT,                      -- JSON配列
  language_support      TEXT,                      -- JSON配列
  has_api               INTEGER DEFAULT 0,
  login_methods         TEXT,                      -- JSON配列
  has_mobile_app        INTEGER DEFAULT 0,
  has_chrome_ext        INTEGER DEFAULT 0,
  data_storage_region   TEXT,
  gdpr_compliant        INTEGER,
  soc2_certified        INTEGER,
  integration_list      TEXT,                      -- JSON配列

  -- 無料プラン
  has_free_plan         INTEGER DEFAULT 0,
  free_plan_detail_ja   TEXT,
  free_plan_detail_en   TEXT,
  has_free_trial        INTEGER DEFAULT 0,
  free_trial_days       INTEGER,

  -- メディア
  screenshot_urls       TEXT,                      -- JSON配列
  demo_url              TEXT,
  video_url             TEXT,

  -- 評判・集客
  product_hunt_id       TEXT,
  product_hunt_url      TEXT,
  user_count_label      TEXT,

  -- 収益化
  affiliate_url         TEXT,
  affiliate_rate        REAL,
  has_affiliate         INTEGER DEFAULT 0,

  -- データ品質・管理
  ai_confidence_score   REAL,
  needs_manual_review   INTEGER DEFAULT 0,
  data_source           TEXT,
  source_url            TEXT,

  -- タイムスタンプ
  last_scraped_at       TEXT,
  last_price_checked_at TEXT,
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category_id);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_published ON tools(is_published);
CREATE INDEX IF NOT EXISTS idx_tools_created ON tools(created_at);
CREATE INDEX IF NOT EXISTS idx_tools_parent ON tools(parent_tool_id);
CREATE INDEX IF NOT EXISTS idx_tools_review ON tools(needs_manual_review);

-- ===== 価格プラン =====
CREATE TABLE IF NOT EXISTS pricing_plans (
  id                    TEXT PRIMARY KEY,
  tool_id               TEXT NOT NULL REFERENCES tools(id),

  -- プラン基本情報
  plan_name             TEXT NOT NULL,
  plan_name_ja          TEXT,
  is_free               INTEGER DEFAULT 0,

  -- 価格（月額）
  price_usd             REAL,
  price_jpy_official    INTEGER,
  has_japan_pricing     INTEGER DEFAULT 0,

  -- 価格（年額）
  price_usd_annual      REAL,
  price_jpy_annual      INTEGER,
  annual_discount_pct   REAL,

  -- 請求
  billing_cycle         TEXT DEFAULT 'monthly',
  price_per_unit        TEXT,

  -- プラン内容
  features_ja           TEXT,                      -- JSON配列
  features_en           TEXT,                      -- JSON配列
  usage_limits          TEXT,                      -- JSON

  -- 価格変動追跡
  price_trend           TEXT,
  previous_price_usd    REAL,
  price_changed_at      TEXT,

  -- 価格取得元
  price_source_url      TEXT,

  -- タイムスタンプ
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pricing_tool ON pricing_plans(tool_id);
CREATE INDEX IF NOT EXISTS idx_pricing_changed ON pricing_plans(price_changed_at);

-- ===== ツールとタグの中間テーブル =====
CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id   TEXT NOT NULL REFERENCES tools(id),
  tag_id    TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (tool_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_tags_tool ON tool_tags(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tag ON tool_tags(tag_id);

-- ===== ニュース =====
CREATE TABLE IF NOT EXISTS news (
  id              TEXT PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,

  -- 基本情報
  title_ja        TEXT NOT NULL,
  title_en        TEXT,
  body_ja         TEXT,
  body_en         TEXT,

  -- 分類
  news_type       TEXT NOT NULL,                  -- price_change / new_tool / new_feature / other
  tool_id         TEXT REFERENCES tools(id),

  -- 公開
  is_published    INTEGER DEFAULT 1,
  published_at    TEXT NOT NULL,

  -- タイムスタンプ
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_type ON news(news_type);
CREATE INDEX IF NOT EXISTS idx_news_tool ON news(tool_id);

-- ===== 収集処理ログ =====
CREATE TABLE IF NOT EXISTS scrape_logs (
  id            TEXT PRIMARY KEY,
  job_name      TEXT NOT NULL,
  status        TEXT NOT NULL,                    -- success / error / partial
  tools_added   INTEGER DEFAULT 0,
  tools_updated INTEGER DEFAULT 0,
  errors        TEXT,                             -- JSON
  started_at    TEXT NOT NULL,
  finished_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_logs_job ON scrape_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_logs_started ON scrape_logs(started_at);

-- =============================================
-- 初期マスターデータ：8カテゴリの投入
-- 設計図V2 4.2節準拠
-- =============================================

INSERT OR IGNORE INTO categories (id, slug, name_ja, name_en, description_ja, description_en, icon_emoji, display_order) VALUES
  ('cat_text',         'text-generation',  'テキスト生成',     'Text Generation',  '文章作成・要約・翻訳などのテキスト系AIツール',                    'AI tools for writing, summarization, and translation',           '✍️',  1),
  ('cat_image',        'image-generation', '画像生成',         'Image Generation', '画像・イラスト・写真を生成するAIツール',                          'AI tools for generating images, illustrations, and photos',      '🎨',  2),
  ('cat_video',        'video-generation', '動画生成',         'Video Generation', '動画の生成・編集・補完を行うAIツール',                            'AI tools for video generation, editing, and enhancement',        '🎬',  3),
  ('cat_coding',       'coding',           'コーディング支援', 'Coding Assistant', 'コード生成・デバッグ・リファクタリングを支援するAIツール',         'AI tools for code generation, debugging, and refactoring',       '💻',  4),
  ('cat_audio',        'audio',            '音声・音楽',       'Audio & Music',    '音声合成・音楽生成・音声認識のAIツール',                          'AI tools for speech synthesis, music generation, and recognition','🎵',  5),
  ('cat_data',         'data-analysis',    'データ分析',       'Data Analysis',    'データ可視化・統計解析・予測モデル構築のAIツール',                'AI tools for data visualization, statistics, and prediction',    '📊',  6),
  ('cat_productivity', 'productivity',     '業務効率化',       'Productivity',     'タスク管理・自動化・コラボレーションを支援するAIツール',          'AI tools for task management, automation, and collaboration',    '⚡',  7),
  ('cat_other',        'other',            'その他',           'Other',            '上記カテゴリに分類されないAIツール',                              'AI tools that do not fit into the above categories',             '🔧',  8);
