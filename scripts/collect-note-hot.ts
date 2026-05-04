// =============================================
// AI Chronicle - Note記事収集（急上昇）
// note.com/hashtag/AI 急上昇50件
// =============================================
// 実行: tsx scripts/collect-note-hot.ts
// GitHub Actions: 毎日 UTC 15:00（JST 00:00）

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';
import { generateId } from '../src/lib/uuid';

interface NoteArticle {
  title: string;
  thumbnail_url: string | null;
  author_name: string | null;
  note_url: string;
  likes_count: number;
  published_at: string | null;
  tags: string[];
}

async function fetchNoteHotArticles(): Promise<NoteArticle[]> {
  const url = 'https://note.com/hashtag/AI?f=hot&paid_only=false';
  console.log(`  → フェッチ中: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-Chronicle-Bot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ja,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const articles: NoteArticle[] = [];
  const noteUrls = [...html.matchAll(/"noteUrl"\s*:\s*"(https:\/\/note\.com\/[^"]+)"/g)].map(m => m[1]);
  const titles   = [...html.matchAll(/"name"\s*:\s*"([^"]+)","noteUrl"/g)].map(m => m[1]);
  const likes    = [...html.matchAll(/"likeCount"\s*:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  const thumbs   = [...html.matchAll(/"eyecatch(?:Url)?"\s*:\s*"(https:\/\/[^"]+)"/g)].map(m => m[1]);
  const authors  = [...html.matchAll(/"nickname"\s*:\s*"([^"]+)"/g)].map(m => m[1]);

  for (let i = 0; i < noteUrls.length && i < 50; i++) {
    if (!noteUrls[i]) continue;
    articles.push({
      title: titles[i] ?? '',
      thumbnail_url: thumbs[i] ?? null,
      author_name: authors[i] ?? null,
      note_url: noteUrls[i],
      likes_count: likes[i] ?? 0,
      published_at: null,
      tags: [],
    });
  }

  console.log(`  → ${articles.length}件取得`);
  return articles;
}

function findMatchingTools(
  article: NoteArticle,
  tools: { id: string; name_ja: string; name_en: string }[]
): { id: string; name_en: string }[] {
  const text = (article.title + ' ' + article.tags.join(' ')).toLowerCase();
  const matched: { id: string; name_en: string }[] = [];
  for (const tool of tools) {
    const enNorm = tool.name_en.toLowerCase().replace(/\s+/g, '');
    const jaNorm = tool.name_ja.toLowerCase();
    if (enNorm.length >= 3 && text.replace(/\s+/g, '').includes(enNorm)) { matched.push(tool); continue; }
    if (tool.name_en.length >= 3 && text.includes(tool.name_en.toLowerCase())) { matched.push(tool); continue; }
    if (jaNorm.length >= 3 && text.includes(jaNorm)) { matched.push(tool); }
  }
  return matched;
}

async function main() {
  console.log('🚀 AI Chronicle - Note記事収集（急上昇）開始');

  const db = D1Client.fromEnv();
  const logId = generateId('log');
  await db.execute(
    `INSERT INTO scrape_logs (id, job_name, status, started_at) VALUES (?, 'collect_note_hot', 'running', datetime('now'))`,
    [logId]
  );

  let saved = 0;
  let skipped = 0;

  try {
    const articles = await fetchNoteHotArticles();
    if (articles.length === 0) {
      await db.execute(`UPDATE scrape_logs SET status='error', errors='["0件取得"]', finished_at=datetime('now') WHERE id=?`, [logId]);
      return;
    }

    const tools = await db.all<{ id: string; name_ja: string; name_en: string }>(
      `SELECT id, name_ja, name_en FROM tools WHERE is_published = 1`
    );

    for (const article of articles) {
      if (!article.note_url || !article.title) continue;

      const matchedTools = findMatchingTools(article, tools);
      if (matchedTools.length === 0) { skipped++; continue; }

      for (const tool of matchedTools) {
        const existing = await db.first<{ id: string }>(
          `SELECT id FROM tool_note_articles WHERE note_url = ? AND tool_id = ? LIMIT 1`,
          [article.note_url, tool.id]
        );
        if (existing) continue;

        await db.execute(
          `INSERT OR IGNORE INTO tool_note_articles (id, tool_id, title, thumbnail_url, author_name, author_icon_url, note_url, likes_count, published_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [generateId('note'), tool.id, article.title, article.thumbnail_url, article.author_name, null, article.note_url, article.likes_count, article.published_at]
        );
        console.log(`  ✅ [${tool.name_en}] ${article.title.substring(0, 50)}`);
        saved++;
      }
    }

    await db.execute(`UPDATE scrape_logs SET status='success', tools_added=?, finished_at=datetime('now') WHERE id=?`, [saved, logId]);
    console.log(`\n========== 結果 ==========`);
    console.log(`  ✅ 保存: ${saved}件`);
    console.log(`  ⏭️ スキップ: ${skipped}件`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 エラー:', msg);
    await db.execute(`UPDATE scrape_logs SET status='error', errors=?, finished_at=datetime('now') WHERE id=?`, [JSON.stringify([msg]), logId]);
    process.exit(1);
  }
}

main();
