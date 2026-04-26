-- =============================================================
-- 有名ツール ロゴURL更新
-- Google Favicon サービスを使用（どのドメインのfaviconも取得可能）
-- 使い方：
--   npx wrangler d1 execute ai-chronicle-db --remote --file=scripts/update-logos.sql
-- =============================================================

-- テキスト生成
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64'   WHERE slug = 'chatgpt';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64'          WHERE slug = 'claude';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64'  WHERE slug = 'gemini';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=grok.x.ai&sz=64'          WHERE slug = 'grok';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64'      WHERE slug = 'perplexity';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=copilot.microsoft.com&sz=64' WHERE slug = 'microsoft-copilot';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=64'         WHERE slug = 'mistral';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=character.ai&sz=64'       WHERE slug = 'character-ai';

-- 画像生成
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=64'     WHERE slug = 'midjourney';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'         WHERE slug = 'dall-e-3';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=stability.ai&sz=64'       WHERE slug = 'stable-diffusion';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=firefly.adobe.com&sz=64'  WHERE slug = 'adobe-firefly';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=ideogram.ai&sz=64'        WHERE slug = 'ideogram';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64'        WHERE slug = 'leonardo-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=blackforestlabs.ai&sz=64' WHERE slug = 'flux';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=canva.com&sz=64'          WHERE slug = 'canva-ai';

-- 動画生成
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=sora.com&sz=64'           WHERE slug = 'sora';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=64'       WHERE slug = 'runway';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=klingai.com&sz=64'        WHERE slug = 'kling-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=pika.art&sz=64'           WHERE slug = 'pika';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=heygen.com&sz=64'         WHERE slug = 'heygen';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=lumalabs.ai&sz=64'        WHERE slug = 'luma-dream-machine';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=synthesia.io&sz=64'       WHERE slug = 'synthesia';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=invideo.io&sz=64'         WHERE slug = 'invideo-ai';

-- コーディング
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=github.com&sz=64'         WHERE slug = 'github-copilot';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=cursor.sh&sz=64'          WHERE slug = 'cursor';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=codeium.com&sz=64'        WHERE slug = 'codeium';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=bolt.new&sz=64'           WHERE slug = 'bolt-new';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=v0.dev&sz=64'             WHERE slug = 'v0';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=tabnine.com&sz=64'        WHERE slug = 'tabnine';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=replit.com&sz=64'         WHERE slug = 'replit-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=cognition.ai&sz=64'       WHERE slug = 'devin';

-- 音声・音楽
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64'      WHERE slug = 'elevenlabs';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=suno.ai&sz=64'            WHERE slug = 'suno';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=udio.com&sz=64'           WHERE slug = 'udio';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=descript.com&sz=64'       WHERE slug = 'descript';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=podcast.adobe.com&sz=64'  WHERE slug = 'adobe-podcast';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=speechify.com&sz=64'      WHERE slug = 'speechify';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=aiva.ai&sz=64'            WHERE slug = 'aiva';

-- データ分析
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=julius.ai&sz=64'          WHERE slug = 'julius-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=powerbi.microsoft.com&sz=64' WHERE slug = 'power-bi';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=tableau.com&sz=64'        WHERE slug = 'tableau';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=rows.com&sz=64'           WHERE slug = 'rows-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=obviously.ai&sz=64'       WHERE slug = 'obviously-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=datarobot.com&sz=64'      WHERE slug = 'datarobot';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=polymersearch.com&sz=64'  WHERE slug = 'polymer';

-- 業務効率化
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=notion.so&sz=64'          WHERE slug = 'notion-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=grammarly.com&sz=64'      WHERE slug = 'grammarly';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=otter.ai&sz=64'           WHERE slug = 'otter-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=fireflies.ai&sz=64'       WHERE slug = 'fireflies-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=zapier.com&sz=64'         WHERE slug = 'zapier-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=reclaim.ai&sz=64'         WHERE slug = 'reclaim-ai';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=make.com&sz=64'           WHERE slug = 'make';
UPDATE tools SET logo_url = 'https://www.google.com/s2/favicons?domain=mem.ai&sz=64'             WHERE slug = 'mem-ai';
