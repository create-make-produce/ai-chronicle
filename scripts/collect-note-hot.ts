// =============================================
// AI Chronicle - Note記事収集（急上昇）
// =============================================
// V9.2: note.com API方式 + ツールごと50件上限
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';
import { generateId } from '../src/lib/uuid';

const MAX_NOTES_PER_TOOL = 50;

interface NoteApiNote {
  key: string;
  name: string;
  eyecatch_url: string | null;
  user: { urlname: string; nickname: string; user_profile_image_path: string | null } | null;
  like_count: number;
  publish_at: string | null;
  hashtag_notes: Array<{ hashtag: { name: string } }> | null;
}

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
  const url = 'https://note.com/api/v2/hashtags/AI/notes?sort=hot&paid_only=false&page=1';
  console.log(`  → APIフェッチ: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'ja',
      'Referer': 'https://note.com/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as { data: { notes: NoteApiNote[] } };
  const notes = json?.data?.notes ?? [];
  console.log(`  → ${notes.length}件取得`);
  return notes.slice(0, 50).map((n) => ({
    title: n.name ?? '',
    thumbnail_url: n.eyecatch_url ?? null,
    author_name: n.user?.nickname ?? null,
    note_url: `https://note.com/${n.user?.urlname ?? '_'}/n/${n.key}`,
    likes_count: n.like_count ?? 0,
    published_at: n.publish_at ?? null,
    tags: (n.hashtag_notes ?? []).map((h) => h.hashtag.name),
  }));
}

function findMatchingTools(article: NoteArticle, tools: { id: string; name_ja: string; name_en: string }[]): { id: string; name_en: string }[] {
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

async function enforceNoteLimit(db: D1Client, toolId: string): Promise<void> {
  await db.execute(
    `DELETE FROM tool_note_articles WHERE tool_id = ? AND id NOT IN (SELECT id FROM tool_note_articles WHERE tool_id = ? ORDER BY created_at DESC LIMIT ${MAX_NOTES_PER_TOOL})`,
    [toolId, toolId]
  );
}

async function main() {
  console.log('🚀 AI Chronicle - Note記事収集（急上昇）開始');
  const db = D1Client.fromEnv();
  const logId = generateId('log');
  await db.execute(`INSERT INTO scrape_logs (id, job_name, status, started_at) VALUES (?, 'collect_note_hot', 'running', datetime('now'))`, [logId]);

  let saved = 0, skipped = 0;
  try {
    const articles = await fetchNoteHotArticles();
    if (articles.length === 0) {
      await db.execute(`UPDATE scrape_logs SET status='error', errors='["0件取得"]', finished_at=datetime('now') WHERE id=?`, [logId]);
      return;
    }
    const tools = await db.query<{ id: string; name_ja: string; name_en: string }>(`SELECT id, name_ja, name_en FROM tools WHERE is_published = 1`);
    console.log(`  → ${tools.length}件のツールと照合`);
    const updatedToolIds = new Set<string>();
    for (const article of articles) {
      if (!article.note_url || !article.title) continue;
      const matchedTools = findMatchingTools(article, tools);
      if (matchedTools.length === 0) { skipped++; continue; }
      for (const tool of matchedTools) {
        const existing = await db.first<{ id: string }>(`SELECT id FROM tool_note_articles WHERE note_url = ? AND tool_id = ? LIMIT 1`, [article.note_url, tool.id]);
        if (existing) continue;
        await db.execute(
          `INSERT OR IGNORE INTO tool_note_articles (id, tool_id, title, thumbnail_url, author_name, author_icon_url, note_url, likes_count, published_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [generateId('note'), tool.id, article.title, article.thumbnail_url, article.author_name, null, article.note_url, article.likes_count, article.published_at]
        );
        console.log(`  ✅ [${tool.name_en}] ${article.title.substring(0, 50)}`);
        saved++;
        updatedToolIds.add(tool.id);
      }
    }
    for (const toolId of updatedToolIds) await enforceNoteLimit(db, toolId);
    if (updatedToolIds.size > 0) console.log(`  🧹 ${updatedToolIds.size}件のツールで上限（${MAX_NOTES_PER_TOOL}件）を適用`);
    await db.execute(`UPDATE scrape_logs SET status='success', tools_added=?, finished_at=datetime('now') WHERE id=?`, [saved, logId]);
    console.log(`\n========== 結果 ==========\n  ✅ 保存: ${saved}件\n  ⏭️ スキップ: ${skipped}件`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 エラー:', msg);
    await db.execute(`UPDATE scrape_logs SET status='error', errors=?, finished_at=datetime('now') WHERE id=?`, [JSON.stringify([msg]), logId]);
    process.exit(1);
  }
}

main();
