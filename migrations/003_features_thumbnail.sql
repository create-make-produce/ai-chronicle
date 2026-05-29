-- features テーブルにサムネイルURLカラム追加
-- 実行: npx wrangler d1 execute ai-chronicle-db --remote --file=./migrations/003_features_thumbnail.sql
ALTER TABLE features ADD COLUMN thumbnail_url TEXT;
