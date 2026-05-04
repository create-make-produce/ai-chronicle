-- scripts/seed-chatgpt-launches.sql
-- ChatGPT のios/android URL & スクリーンショット更新
-- 実行: npx wrangler d1 execute ai-chronicle-db --remote --file=scripts/seed-chatgpt-launches.sql

UPDATE tools SET
  ios_url = 'https://www.producthunt.com/r/6e5d3e8b3c85a5',
  android_url = 'https://www.producthunt.com/r/PUZV4DPNCWSPRP',
  screenshot_urls = '["https://ph-files.imgix.net/ca866866-3c58-4dc3-a082-57aaf57c0dad.svg?auto=format&fit=crop&w=760","https://ph-files.imgix.net/c5bc4c45-9d39-44f5-8ad9-fa10c043c29f.svg?auto=format&fit=crop&w=760","https://ph-files.imgix.net/836a36f4-6187-49d3-a661-bfefe6527a1c.svg?auto=format&fit=crop&w=760"]'
WHERE slug = 'chatgpt';

-- ローンチ履歴（最新10件・launch_number降順）
INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-27', id, 'Library in ChatGPT', 'Find and reuse files across all your ChatGPT conversations', '2026-03-24', 27, 'https://ph-files.imgix.net/cf1b535c-7d7d-46b8-86b2-a323eea90e42.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com/library' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-26', id, 'ChatGPT for Excel', 'Build and update spreadsheets with ChatGPT in real time', '2026-03-06', 26, 'https://ph-files.imgix.net/62952f90-acdc-403f-b72f-6071f74730c9.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-25', id, 'Group Chats in ChatGPT', 'Collaborate with others & ChatGPT in the same conversation', '2025-11-14', 25, 'https://ph-files.imgix.net/f904aec8-e324-4aed-ae3b-ff68795ce44f.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-24', id, 'ChatGPT Atlas', 'The browser with ChatGPT built in', '2025-10-22', 24, 'https://ph-files.imgix.net/7ed6e0c5-56f1-4b3c-8dab-c3ca91824a9e.gif?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-23', id, 'Apps in ChatGPT', 'A new generation of apps you can chat with', '2025-10-07', 23, 'https://ph-files.imgix.net/acf5e8ef-ac06-4677-8268-abade7281acc.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-22', id, 'Instant Checkout in ChatGPT', 'Turn chats into checkouts', '2025-09-30', 22, 'https://ph-files.imgix.net/591afba3-170b-4aa0-a4f7-0b81ae938620.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-21', id, 'ChatGPT Pulse', 'Now ChatGPT can start the conversation', '2025-09-26', 21, 'https://ph-files.imgix.net/f904aec8-e324-4aed-ae3b-ff68795ce44f.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-20', id, 'ChatGPT study mode', 'A new way to learn with ChatGPT', '2025-07-30', 20, 'https://ph-files.imgix.net/95239bc5-1ee9-4dff-8c43-435130ff04f2.jpeg?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-19', id, 'ChatGPT agent', 'Bridging research and action', '2025-07-18', 19, 'https://ph-files.imgix.net/ab9d1922-1570-42b9-8703-a6176d844a98.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';

INSERT OR IGNORE INTO tool_launches (id, tool_id, launch_name, tagline, launch_date, launch_number, thumbnail_url, url)
SELECT 'cgpt-18', id, 'ChatGPT Deep Research', 'Agent capable of doing deep research for you independently', '2025-02-03', 18, 'https://ph-files.imgix.net/f39db1e6-b24a-4e99-a841-237f18fdefc6.png?auto=format&w=120&h=80&fit=crop', 'https://chatgpt.com' FROM tools WHERE slug = 'chatgpt';
