-- =============================================
-- AI Chronicle - 特集テーブル追加
-- 実行: wrangler d1 execute ai-chronicle-db --remote --file=./migrations/002_features.sql
-- =============================================

CREATE TABLE IF NOT EXISTS features (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  tool_id      TEXT REFERENCES tools(id),
  is_published INTEGER DEFAULT 1,
  published_at TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now')),
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_features_slug      ON features(slug);
CREATE INDEX IF NOT EXISTS idx_features_published ON features(published_at);
CREATE INDEX IF NOT EXISTS idx_features_tool      ON features(tool_id);
