-- =============================================================
-- AI Chronicle - 有名ツール シードデータ
-- 使い方：
--   npx wrangler d1 execute ai-chronicle-db --remote --file=scripts/seed-famous-tools.sql
-- =============================================================
-- 既存データとの衝突を避けるため INSERT OR IGNORE を使用
-- slug が重複している場合はスキップされる
-- =============================================================

-- ★ テキスト生成 (text-generation) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-chatgpt',    'chatgpt',    'ChatGPT',    'ChatGPT',    'OpenAIの対話型AI。テキスト生成・コード・画像分析まで対応', 'The leading conversational AI by OpenAI', 'https://chat.openai.com', 'OpenAI', (SELECT id FROM categories WHERE slug='text-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-claude',     'claude',     'Claude',     'Claude',     'Anthropicの高性能AI。長文・分析・コーディングに強い', 'Anthropic''s AI assistant for analysis and coding', 'https://claude.ai', 'Anthropic', (SELECT id FROM categories WHERE slug='text-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-gemini',     'gemini',     'Gemini',     'Gemini',     'GoogleのマルチモーダルAI。検索・翻訳との連携が強力', 'Google''s multimodal AI integrated with Google services', 'https://gemini.google.com', 'Google', (SELECT id FROM categories WHERE slug='text-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-grok',       'grok',       'Grok',       'Grok',       'xAI製のAI。リアルタイムX（旧Twitter）情報にアクセス可能', 'xAI''s AI with real-time access to X (Twitter) data', 'https://grok.x.ai', 'xAI', (SELECT id FROM categories WHERE slug='text-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-perplexity', 'perplexity', 'Perplexity AI', 'Perplexity AI', 'Web検索×AIの回答エンジン。出典付きで最新情報を提供', 'AI-powered answer engine with real-time web search', 'https://www.perplexity.ai', 'Perplexity AI', (SELECT id FROM categories WHERE slug='text-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-copilot-ms', 'microsoft-copilot', 'Microsoft Copilot', 'Microsoft Copilot', 'MicrosoftのAI。EdgeやWindows・Office製品に統合', 'Microsoft''s AI integrated with Windows and Office', 'https://copilot.microsoft.com', 'Microsoft', (SELECT id FROM categories WHERE slug='text-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-mistral',    'mistral',    'Mistral AI',  'Mistral AI', 'フランス発の高効率AIモデル。オープンソース版も提供', 'High-performance AI from France with open-source models', 'https://mistral.ai', 'Mistral AI', (SELECT id FROM categories WHERE slug='text-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-characterai','character-ai','Character.AI','Character.AI','キャラクターとAI会話を楽しめるプラットフォーム','Chat with AI characters and create your own personas','https://character.ai', 'Character.AI', (SELECT id FROM categories WHERE slug='text-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

-- ★ 画像生成 (image-generation) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-midjourney', 'midjourney', 'Midjourney', 'Midjourney', '最高品質の画像生成AI。芸術的・商業的用途に幅広く利用', 'The highest quality AI image generator for art and commercial use', 'https://midjourney.com', 'Midjourney', (SELECT id FROM categories WHERE slug='image-generation'), 0, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-dalle3',     'dall-e-3',   'DALL-E 3',   'DALL-E 3',   'OpenAIの画像生成AI。ChatGPTから直接利用可能', 'OpenAI''s image generator integrated with ChatGPT', 'https://openai.com/dall-e-3', 'OpenAI', (SELECT id FROM categories WHERE slug='image-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-stablediff',  'stable-diffusion', 'Stable Diffusion', 'Stable Diffusion', 'オープンソースの画像生成AI。ローカル実行も可能', 'Open-source image generation AI, runs locally too', 'https://stability.ai', 'Stability AI', (SELECT id FROM categories WHERE slug='image-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-firefly',    'adobe-firefly', 'Adobe Firefly', 'Adobe Firefly', 'Adobeの商用利用安全な画像生成AI。Photoshopとも連携', 'Adobe''s commercially safe AI image generator integrated with Photoshop', 'https://firefly.adobe.com', 'Adobe', (SELECT id FROM categories WHERE slug='image-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-ideogram',   'ideogram',   'Ideogram',   'Ideogram',   'テキスト描写が得意な画像生成AI。ロゴ・デザイン向き', 'AI image generator excelling at text rendering and design', 'https://ideogram.ai', 'Ideogram AI', (SELECT id FROM categories WHERE slug='image-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-leonardo',   'leonardo-ai', 'Leonardo.AI', 'Leonardo.AI', 'ゲーム・イラスト向けの高品質画像生成プラットフォーム', 'High-quality AI image generation platform for games and illustration', 'https://leonardo.ai', 'Leonardo.AI', (SELECT id FROM categories WHERE slug='image-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-flux',       'flux',       'Flux',        'Flux',        'Black Forest Labs製の最新高品質画像生成モデル', 'State-of-the-art image generation model by Black Forest Labs', 'https://blackforestlabs.ai', 'Black Forest Labs', (SELECT id FROM categories WHERE slug='image-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-canva-ai',   'canva-ai',   'Canva AI',   'Canva AI',   'デザインツールCanvaに統合されたAI機能群', 'AI features integrated into the Canva design platform', 'https://www.canva.com', 'Canva', (SELECT id FROM categories WHERE slug='image-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

-- ★ 動画生成 (video-generation) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-sora',       'sora',       'Sora',        'Sora',        'OpenAIのテキストから動画生成AI。高品質なリアル映像が得意', 'OpenAI''s text-to-video AI generating high-quality realistic footage', 'https://sora.com', 'OpenAI', (SELECT id FROM categories WHERE slug='video-generation'), 0, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-runway',     'runway',     'Runway',      'Runway',      '映像クリエイター向けのAI動画生成・編集プラットフォーム', 'AI video generation and editing platform for creators', 'https://runwayml.com', 'Runway AI', (SELECT id FROM categories WHERE slug='video-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-kling',      'kling-ai',   'Kling AI',    'Kling AI',    '中国Kuaishou製の高品質テキスト・画像から動画生成AI', 'High-quality text-to-video AI by Kuaishou', 'https://klingai.com', 'Kuaishou Technology', (SELECT id FROM categories WHERE slug='video-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-pika',       'pika',       'Pika',         'Pika',        'テキストと画像から短編動画を高速生成', 'Fast AI video generation from text and images', 'https://pika.art', 'Pika Labs', (SELECT id FROM categories WHERE slug='video-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-heygen',     'heygen',     'HeyGen',       'HeyGen',      'アバターを使ったAI動画生成。多言語の口パク合成が得意', 'AI video with talking avatars and multilingual lip-sync', 'https://www.heygen.com', 'HeyGen', (SELECT id FROM categories WHERE slug='video-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-luma',       'luma-dream-machine', 'Luma Dream Machine', 'Luma Dream Machine', 'リアルな動きと物理演算に優れたAI動画生成', 'AI video generation with realistic motion and physics', 'https://lumalabs.ai', 'Luma AI', (SELECT id FROM categories WHERE slug='video-generation'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-synthesia',  'synthesia',  'Synthesia',    'Synthesia',   'AIアバターによるビジネス動画制作プラットフォーム', 'Business video creation platform with AI avatars', 'https://www.synthesia.io', 'Synthesia', (SELECT id FROM categories WHERE slug='video-generation'), 0, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-invideo',    'invideo-ai', 'InVideo AI',   'InVideo AI',  'テキストから完成動画を自動生成。ナレーション・BGM付き', 'Turn text into complete videos with narration and music', 'https://invideo.io', 'InVideo', (SELECT id FROM categories WHERE slug='video-generation'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

-- ★ コーディング支援 (coding) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-gh-copilot', 'github-copilot', 'GitHub Copilot', 'GitHub Copilot', 'GitHubとOpenAIが開発したコーディングAI。IDEに統合', 'AI coding assistant by GitHub and OpenAI, integrated into IDEs', 'https://github.com/features/copilot', 'GitHub', (SELECT id FROM categories WHERE slug='coding'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-cursor',     'cursor',     'Cursor',        'Cursor',      'AI統合コードエディタ。チャットでコード全体を編集できる', 'AI-first code editor — chat to edit your entire codebase', 'https://cursor.sh', 'Anysphere', (SELECT id FROM categories WHERE slug='coding'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-codeium',    'codeium',    'Codeium',       'Codeium',     '無料で使えるAIコーディング支援。70以上の言語に対応', 'Free AI coding assistant supporting 70+ languages', 'https://codeium.com', 'Codeium', (SELECT id FROM categories WHERE slug='coding'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-boltnew',    'bolt-new',   'Bolt.new',      'Bolt.new',    'ブラウザ上でフルスタックアプリをAIで即座に構築・デプロイ', 'Build and deploy full-stack apps from your browser with AI', 'https://bolt.new', 'StackBlitz', (SELECT id FROM categories WHERE slug='coding'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-v0',         'v0',         'v0',            'v0',          'VercelのUI生成AI。テキストからReactコンポーネントを生成', 'Vercel''s AI that generates React components from text', 'https://v0.dev', 'Vercel', (SELECT id FROM categories WHERE slug='coding'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-tabnine',    'tabnine',    'Tabnine',       'Tabnine',     'プライバシー重視のAIコード補完ツール。オンプレも対応', 'Privacy-first AI code completion with on-premise option', 'https://www.tabnine.com', 'Tabnine', (SELECT id FROM categories WHERE slug='coding'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-replit',     'replit-ai',  'Replit AI',     'Replit AI',   'ブラウザで動くIDEにAIが統合。学習・プロトタイプ向き', 'Online IDE with integrated AI for learning and prototyping', 'https://replit.com', 'Replit', (SELECT id FROM categories WHERE slug='coding'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-devin',      'devin',      'Devin',         'Devin',       '自律型AIエンジニア。タスクを丸投げして完遂させられる', 'Autonomous AI software engineer that completes full tasks', 'https://cognition.ai', 'Cognition AI', (SELECT id FROM categories WHERE slug='coding'), 0, 0, 'active', 1, datetime('now'), datetime('now'));

-- ★ 音声・音楽 (audio) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-elevenlabs', 'elevenlabs', 'ElevenLabs',   'ElevenLabs',  '最高品質のAI音声合成。クローン・多言語・感情表現に対応', 'Best-in-class AI voice synthesis with cloning and emotion', 'https://elevenlabs.io', 'ElevenLabs', (SELECT id FROM categories WHERE slug='audio'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-suno',       'suno',       'Suno',          'Suno',        'テキストから完成した楽曲（ボーカル付き）を生成するAI', 'Generate complete songs with vocals from text', 'https://suno.ai', 'Suno AI', (SELECT id FROM categories WHERE slug='audio'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-udio',       'udio',       'Udio',          'Udio',        '高品質なAI音楽生成。ジャンルやスタイルを細かく指定可能', 'High-quality AI music generation with detailed style control', 'https://udio.com', 'Udio', (SELECT id FROM categories WHERE slug='audio'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-descript',   'descript',   'Descript',      'Descript',    'テキスト編集で音声・動画を編集できる革新的ツール', 'Edit audio and video by editing text — revolutionary workflow', 'https://www.descript.com', 'Descript', (SELECT id FROM categories WHERE slug='audio'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-adobe-pod',  'adobe-podcast', 'Adobe Podcast AI', 'Adobe Podcast AI', 'ブラウザで音声ノイズ除去・品質向上ができる無料ツール', 'Free browser-based AI audio enhancement and noise removal', 'https://podcast.adobe.com', 'Adobe', (SELECT id FROM categories WHERE slug='audio'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-speechify',  'speechify',  'Speechify',     'Speechify',   'テキストを自然な音声で読み上げるAI。学習・読書補助向き', 'AI text-to-speech for learning and reading assistance', 'https://speechify.com', 'Speechify', (SELECT id FROM categories WHERE slug='audio'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-aiva',       'aiva',       'AIVA',          'AIVA',        'AI作曲家。映像・ゲーム・広告向けのBGMを自動生成', 'AI composer for film, game, and advertising music', 'https://www.aiva.ai', 'AIVA Technologies', (SELECT id FROM categories WHERE slug='audio'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

-- ★ データ分析 (data-analysis) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-julius',     'julius-ai',  'Julius AI',     'Julius AI',   'データをアップロードするだけでAIがグラフ化・分析', 'Upload data and AI instantly analyzes and visualizes it', 'https://julius.ai', 'Julius AI', (SELECT id FROM categories WHERE slug='data-analysis'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-powerbi',    'power-bi',   'Power BI',      'Power BI',    'MicrosoftのBIツール。AIによる自然言語での質問機能搭載', 'Microsoft''s BI tool with AI-powered natural language queries', 'https://powerbi.microsoft.com', 'Microsoft', (SELECT id FROM categories WHERE slug='data-analysis'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-tableau',    'tableau',    'Tableau',       'Tableau',     'データ可視化のリーダー。AI機能で予測・異常検知も可能', 'Data visualization leader with AI-powered predictions', 'https://www.tableau.com', 'Salesforce', (SELECT id FROM categories WHERE slug='data-analysis'), 0, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-rows',       'rows-ai',    'Rows AI',       'Rows AI',     'AIが組み込まれたスプレッドシート。自然言語でデータ集計', 'Spreadsheet with built-in AI for natural language data aggregation', 'https://rows.com', 'Rows', (SELECT id FROM categories WHERE slug='data-analysis'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-obviously',  'obviously-ai','Obviously AI', 'Obviously AI','コードなしで機械学習モデルを構築・予測できるAIツール', 'Build and deploy ML models without code', 'https://www.obviously.ai', 'Obviously AI', (SELECT id FROM categories WHERE slug='data-analysis'), 0, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-datarobot',  'datarobot',  'DataRobot',     'DataRobot',   'エンタープライズ向けAIプラットフォーム。MLOpsまで対応', 'Enterprise AI platform with end-to-end MLOps support', 'https://www.datarobot.com', 'DataRobot', (SELECT id FROM categories WHERE slug='data-analysis'), 0, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-polymer',    'polymer',    'Polymer',       'Polymer',     'CSVをアップロードするだけでインタラクティブなダッシュボードを自動生成', 'Auto-generate interactive dashboards from CSV uploads', 'https://www.polymersearch.com', 'Polymer', (SELECT id FROM categories WHERE slug='data-analysis'), 1, 0, 'active', 1, datetime('now'), datetime('now'));

-- ★ 業務効率化 (productivity) ★ --

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-notion-ai',  'notion-ai',  'Notion AI',     'Notion AI',   'Notionに統合されたAI。文章生成・要約・翻訳が即座に可能', 'AI integrated into Notion for writing, summarizing, and translation', 'https://www.notion.so', 'Notion Labs', (SELECT id FROM categories WHERE slug='productivity'), 0, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-grammarly',  'grammarly',  'Grammarly',     'Grammarly',   'AI文章校正ツール。英文のミス・スタイル改善をリアルタイムで提案', 'AI writing assistant for grammar, style, and clarity in English', 'https://www.grammarly.com', 'Grammarly', (SELECT id FROM categories WHERE slug='productivity'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-otterai',    'otter-ai',   'Otter.ai',      'Otter.ai',    '会議・講義を自動文字起こし・要約するAIツール', 'AI tool that automatically transcribes and summarizes meetings', 'https://otter.ai', 'Otter.ai', (SELECT id FROM categories WHERE slug='productivity'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-fireflies',  'fireflies-ai','Fireflies.ai', 'Fireflies.ai','オンライン会議を自動録音・文字起こし・タスク抽出するAI', 'Auto-record, transcribe, and extract action items from meetings', 'https://fireflies.ai', 'Fireflies.ai', (SELECT id FROM categories WHERE slug='productivity'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-zapier',     'zapier-ai',  'Zapier AI',     'Zapier AI',   'ノーコードで6,000以上のアプリをAIで自動連携', 'No-code AI automation connecting 6,000+ apps', 'https://zapier.com', 'Zapier', (SELECT id FROM categories WHERE slug='productivity'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-reclaim',    'reclaim-ai', 'Reclaim.ai',    'Reclaim.ai',  'AIがGoogleカレンダーを最適化。集中時間・習慣を自動確保', 'AI that optimizes your Google Calendar for focus and habits', 'https://reclaim.ai', 'Reclaim', (SELECT id FROM categories WHERE slug='productivity'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-make',       'make',       'Make',          'Make',        'ビジュアルな自動化プラットフォーム。AIシナリオも構築可能', 'Visual automation platform supporting AI-powered workflows', 'https://www.make.com', 'Make', (SELECT id FROM categories WHERE slug='productivity'), 1, 1, 'active', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tools (id, slug, name_ja, name_en, tagline_ja, tagline_en, official_url, company_name, category_id, has_free_plan, has_api, status, is_published, created_at, updated_at) VALUES
('seed-mem',        'mem-ai',     'Mem AI',        'Mem AI',       'AIが自動整理するセカンドブレイン型ノートツール', 'AI-powered second brain that automatically organizes your notes', 'https://mem.ai', 'Mem Labs', (SELECT id FROM categories WHERE slug='productivity'), 0, 0, 'active', 1, datetime('now'), datetime('now'));

-- =============================================================
-- 価格プラン (pricing_plans)
-- =============================================================

-- ChatGPT
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-chatgpt-1', 'seed-chatgpt', 'Free', '無料', 1, NULL, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-chatgpt-2', 'seed-chatgpt', 'Plus', 'Plus', 0, 20.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-chatgpt-3', 'seed-chatgpt', 'Pro',  'Pro',  0, 200.00, 'monthly', datetime('now'), datetime('now'));

-- Claude
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-claude-1', 'seed-claude', 'Free', '無料', 1, NULL, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-claude-2', 'seed-claude', 'Pro',  'Pro',  0, 20.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, price_jpy_official, has_japan_pricing, created_at, updated_at) VALUES ('pp-claude-3', 'seed-claude', 'Pro (Japan)', 'Pro（日本向け）', 0, 20.00, 'monthly', 3200, 1, datetime('now'), datetime('now'));

-- Gemini
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-gemini-1', 'seed-gemini', 'Free', '無料', 1, NULL, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, price_jpy_official, has_japan_pricing, created_at, updated_at) VALUES ('pp-gemini-2', 'seed-gemini', 'Advanced', 'Advanced', 0, 19.99, 'monthly', 2900, 1, datetime('now'), datetime('now'));

-- Midjourney
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-mj-1', 'seed-midjourney', 'Basic',    'Basic',    0, 10.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-mj-2', 'seed-midjourney', 'Standard', 'Standard', 0, 30.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-mj-3', 'seed-midjourney', 'Pro',      'Pro',      0, 60.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-mj-4', 'seed-midjourney', 'Mega',     'Mega',     0, 120.00,'monthly', datetime('now'), datetime('now'));

-- GitHub Copilot
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-ghcp-1', 'seed-gh-copilot', 'Free (limited)', '無料（制限あり）', 1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-ghcp-2', 'seed-gh-copilot', 'Individual',      '個人',             0, 10.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-ghcp-3', 'seed-gh-copilot', 'Business',        'ビジネス',         0, 19.00, 'monthly', datetime('now'), datetime('now'));

-- Cursor
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-cursor-1', 'seed-cursor', 'Hobby',    '無料',     1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-cursor-2', 'seed-cursor', 'Pro',      'Pro',      0, 20.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-cursor-3', 'seed-cursor', 'Business', 'ビジネス', 0, 40.00, 'monthly', datetime('now'), datetime('now'));

-- ElevenLabs
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-11labs-1', 'seed-elevenlabs', 'Free',    '無料',    1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-11labs-2', 'seed-elevenlabs', 'Starter', 'スターター', 0, 5.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-11labs-3', 'seed-elevenlabs', 'Creator', 'クリエイター', 0, 22.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-11labs-4', 'seed-elevenlabs', 'Pro',     'Pro',     0, 99.00, 'monthly', datetime('now'), datetime('now'));

-- Suno
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-suno-1', 'seed-suno', 'Basic',   '無料',     1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-suno-2', 'seed-suno', 'Pro',     'Pro',      0, 8.00,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-suno-3', 'seed-suno', 'Premier', 'プレミア', 0, 24.00, 'monthly', datetime('now'), datetime('now'));

-- Runway
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-runway-1', 'seed-runway', 'Free',      '無料',       1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-runway-2', 'seed-runway', 'Standard',  'Standard',   0, 12.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-runway-3', 'seed-runway', 'Pro',       'Pro',        0, 28.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-runway-4', 'seed-runway', 'Unlimited', 'Unlimited',  0, 76.00, 'monthly', datetime('now'), datetime('now'));

-- Notion AI
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-notion-1', 'seed-notion-ai', 'Notion Free + AI add-on', '無料プラン＋AIアドオン', 0, 10.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, price_jpy_official, has_japan_pricing, billing_cycle, created_at, updated_at) VALUES ('pp-notion-2', 'seed-notion-ai', 'Plus + AI', 'Plusプラン＋AI', 0, 20.00, 3000, 1, 'monthly', datetime('now'), datetime('now'));

-- Perplexity
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-pp-1', 'seed-perplexity', 'Free', '無料', 1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-pp-2', 'seed-perplexity', 'Pro',  'Pro',  0, 20.00, 'monthly', datetime('now'), datetime('now'));

-- HeyGen
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-heygen-1', 'seed-heygen', 'Free',     '無料',       1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-heygen-2', 'seed-heygen', 'Creator',  'クリエイター', 0, 24.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-heygen-3', 'seed-heygen', 'Business', 'ビジネス',   0, 72.00, 'monthly', datetime('now'), datetime('now'));

-- Grammarly
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-gram-1', 'seed-grammarly', 'Free',    '無料',     1, NULL,  'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-gram-2', 'seed-grammarly', 'Pro',     'Pro',      0, 12.00, 'monthly', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, billing_cycle, created_at, updated_at) VALUES ('pp-gram-3', 'seed-grammarly', 'Business','ビジネス', 0, 15.00, 'monthly', datetime('now'), datetime('now'));
