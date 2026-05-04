// =============================================
// AI Chronicle - Note記事収集（人気順）
// =============================================
// 実行: tsx scripts/collect-note-articles.ts
// GitHub Actions: 毎日 UTC 03:00（JST 12:00）
//
// V9.1修正: __NEXT_DATA__ JSONパース方式に変更
//   → note.comのHTML構造変更に強いアーキテクチャ

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
  author_icon_url: string | null;
  note_url: string;
  likes_count: number;
  published_at: string | null;
  tags: string[];
}

// =============================================
// __NEXT_DATA__ パース（メイン方式）
// note.comのHTML構造変更に強い再帰探索
// =============================================

function traverseForNotes(obj: unknown, results: NoteArticle[], limit: number): void {
  if (results.length >= limit || !obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) traverseForNotes(item, results, limit);
    return;
  }

  const record = obj as Record<string, unknown>;

  // noteUrlを持つオブジェクトを記事として認識
  if (typeof record.noteUrl === 'string' && record.noteUrl.startsWith('https://note.com/')) {
    const user = (record.user as Record<string, unknown> | null) ?? {};
    const tags: string[] = [];
    if (Array.isArray(record.hashtags)) {
      for (const t of record.hashtags) {
        if (typeof t === 'string') tags.push(t);
        else if (t && typeof t === 'object' && typeof (t as Record<string, unknown>).name === 'string') {
          tags.push((t as Record<string, unknown>).name as string);
        }
      }
    }
    results.push({
      title: String(record.name ?? record.title ?? ''),
      thumbnail_url: (String(record.eyecatchUrl ?? record.thumbnailUrl ?? '') || null),
      author_name: (String(user.nickname ?? user.name ?? '') || null),
      author_icon_url: null,
      note_url: record.noteUrl,
      likes_count: Number(record.likeCount ?? record.likesCount ?? 0),
      published_at: (String(record.publishAt ?? record.publishedAt ?? '') || null),
      tags,
    });
    return;
  }

  for (const value of Object.values(record)) {
    if (results.length >= limit) break;
    traverseForNotes(value, results, limit);
  }
}

function extractFromNextData(html: string, limit: number): NoteArticle[] {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    console.log('  ⚠️ __NEXT_DATA__が見つかりません');
    return [];
  }
  try {
    const data = JSON.parse(match[1]);
    const articles: NoteArticle[] = [];
    traverseForNotes(data, articles, limit);
    return articles;
  } catch {
    console.log('  ⚠️ __NEXT_DATA__のJSONパース失敗');
    return [];
  }
}

// =============================================
// フォールバック: 旧regex方式
// =============================================

function extractFromRegex(html: string, limit: number): NoteArticle[] {
  const articles: NoteArticle[] = [];
  const noteUrls = [...html.matchAll(/"noteUrl"\s*:\s*"(https:\/\/note\.com\/[^"]+)"/g)].map(m => m[1]);
  if (noteUrls.length === 0) return [];

  const titles   = [...html.matchAll(/"name"\s*:\s*"([^"]+)","noteUrl"/g)].map(m => m[1]);
  const likes    = [...html.matchAll(/"likeCount"\s*:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  const thumbs   = [...html.matchAll(/"eyecatch(?:Url)?"\s*:\s*"(https:\/\/[^"]+)"/g)].map(m => m[1]);
  const authors  = [...html.matchAll(/"nickname"\s*:\s*"([^"]+)"/g)].map(m => m[1]);

  for (let i = 0; i < noteUrls.length && i < limit; i++) {
    if (!noteUrls[i]) continue;
    articles.push({
      title: titles[i] ?? '',
      thumbnail_url: thumbs[i] ?? null,
      author_name: authors[i] ?? null,
      author_icon_url: null,
      note_url: noteUrls[i],
      likes_count: likes[i] ?? 0,
      published_at: null,
      tags: [],
    });
  }
  return articles;
}

// =============================================
// メインフェッチ
// =============================================

async function fetchNoteArticles(url: string, limit: number): Promise<NoteArticle[]> {
  console.log(`  → フェッチ中: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const html = await res.text();

  console.log(`  → HTML取得完了 (${Math.round(html.length / 1024)}KB)`);

  // 方法1: __NEXT_DATA__パース（推奨）
  let articles = extractFromNextData(html, limit);
  if (articles.length > 0) {
    console.log(`  → __NEXT_DATA__から${articles.length}件取得`);
    return articles;
  }

  // 方法2: regex（フォールバック）
  articles = extractFromRegex(html, limit);
  if (articles.length > 0) {
    console.log(`  → regex fallbackから${articles.length}件取得`);
    return articles;
  }

  // デバッグ: note.comのURLが含まれるか確認
  const noteCount = (html.match(/https:\/\/note\.com\//g) ?? []).length;
  console.log(`  ⚠️ 0件 → HTML内のnote.com URL数: ${noteCount} / __NEXT_DATA__あり: ${html.includes('__NEXT_DATA__')}`);
  return [];
}

// =============================================
// ツール照合
// =============================================

function findMatchingTools(
  article: NoteArticle,
  tools: { id: string; name_ja: string; name_en: string }[]
): { id: string; name_en: string }[] {
  const titleAndTags = (article.title + ' ' + article.tags.join(' ')).toLowerCase();
  const matched: { id: string; name_en: string }[] = [];
  for (const tool of tools) {
    const enNorm = tool.name_en.toLowerCase().replace(/\s+/g, '');
    const jaNorm = tool.name_ja.toLowerCase();
    if (enNorm.length >= 3 && titleAndTags.replace(/\s+/g, '').includes(enNorm)) { matched.push(tool); continue; }
    if (tool.name_en.length >= 3 && titleAndTags.includes(tool.name_en.toLowerCase())) { matched.push(tool); continue; }
    if (jaNorm.length >= 3 && titleAndTags.includes(jaNorm)) { matched.push(tool); }
  }
  return matched;
}

async function saveArticleForTool(db: D1Client, toolId: string, article: NoteArticle): Promise<boolean> {
  const existing = await db.first<{ id: string }>(
    `SELECT id FROM tool_note_articles WHERE note_url = ? AND tool_id = ? LIMIT 1`,
    [article.note_url, toolId]
  );
  if (existing) return false;

  await db.execute(
    `INSERT OR IGNORE INTO tool_note_articles (id, tool_id, title, thumbnail_url, author_name, author_icon_url, note_url, likes_count, published_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [generateId('note'), toolId, article.title, article.thumbnail_url, article.author_name, article.author_icon_url, article.note_url, article.likes_count, article.published_at]
  );
  return true;
}

// =============================================
// main
// =============================================

async function main() {
  console.log('🚀 AI Chronicle - Note記事収集（人気順）開始');

  const db = D1Client.fromEnv();
  const logId = generateId('log');
  await db.execute(
    `INSERT INTO scrape_logs (id, job_name, status, started_at) VALUES (?, 'collect_note_popular', 'running', datetime('now'))`,
    [logId]
  );

  let saved = 0;
  let skipped = 0;

  try {
    const articles = await fetchNoteArticles('https://note.com/hashtag/AI?f=popular&paid_only=false', 100);

    if (articles.length === 0) {
      console.log('  ⚠️ 0件 → note.comのHTML構造変更の可能性');
      await db.execute(`UPDATE scrape_logs SET status='error', errors='["0件取得"]', finished_at=datetime('now') WHERE id=?`, [logId]);
      return;
    }

    const tools = await db.query<{ id: string; name_ja: string; name_en: string }>(
      `SELECT id, name_ja, name_en FROM tools WHERE is_published = 1`
    );
    console.log(`  → ${tools.length}件のツールと照合`);

    for (const article of articles) {
      if (!article.note_url || !article.title) continue;

      const matchedTools = findMatchingTools(article, tools);
      if (matchedTools.length === 0) { skipped++; continue; }

      for (const tool of matchedTools) {
        const wasSaved = await saveArticleForTool(db, tool.id, article);
        if (wasSaved) {
          console.log(`  ✅ [${tool.name_en}] ${article.title.substring(0, 50)}`);
          saved++;
        }
      }
    }

    await db.execute(
      `UPDATE scrape_logs SET status='success', tools_added=?, finished_at=datetime('now') WHERE id=?`,
      [saved, logId]
    );
    console.log(`\n========== 結果 ==========`);
    console.log(`  ✅ 保存: ${saved}件`);
    console.log(`  ⏭️ スキップ（マッチなし）: ${skipped}件`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 エラー:', msg);
    await db.execute(`UPDATE scrape_logs SET status='error', errors=?, finished_at=datetime('now') WHERE id=?`, [JSON.stringify([msg]), logId]);
    process.exit(1);
  }
}

main();
