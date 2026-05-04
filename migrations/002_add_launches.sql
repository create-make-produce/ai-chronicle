-- migrations/002_add_launches.sql
-- ツールのApp Store / Google Play URL カラム追加
ALTER TABLE tools ADD COLUMN ios_url TEXT;
ALTER TABLE tools ADD COLUMN android_url TEXT;

-- ローンチ履歴テーブル（Product Huntの発売タブ相当）
CREATE TABLE IF NOT EXISTS tool_launches (
  id            TEXT PRIMARY KEY,
  tool_id       TEXT NOT NULL REFERENCES tools(id),
  launch_name   TEXT NOT NULL,
  tagline       TEXT,
  launch_date   TEXT,
  launch_number INTEGER,
  thumbnail_url TEXT,
  url           TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tool_launches_tool_id ON tool_launches(tool_id);
