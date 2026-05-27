export const runtime = 'edge';

// src/app/page.tsx
import HomeContent from '@/components/HomeContent';
import { batchQueryD1 } from '@/lib/db';
import type { CategoryNoteArticles, NoteArticleForTop } from '@/lib/db';
import { CONFIG } from '@/config';

export default async function HomePage() {
  const since30d        = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sincePriceChange = new Date(Date.now() - CONFIG.PRICE_CHANGE_ALERT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 6クエリ → 1HTTPリクエスト
  const [
    countRows,
    latestNews,
    newTools,
    categories,
    priceChangesRaw,
    noteRows,
  ] = await batchQueryD1([
    // 0: ツール件数
    { sql: `SELECT COUNT(*) AS c FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1` },
    // 1: 最新ニュース
    { sql: `SELECT n.*, t.name_ja as tool_name_ja, t.name_en as tool_name_en, t.logo_url as tool_logo_url FROM news n LEFT JOIN tools t ON n.tool_id = t.id WHERE n.is_published = 1 AND (n.tool_id IS NULL OR (t.is_published = 1 AND t.status != 'archived' AND t.admin_checked = 1)) ORDER BY n.published_at DESC LIMIT ?`, params: [CONFIG.NEWS_TOP_DISPLAY_COUNT] },
    // 2: 最近更新ツール
    { sql: `SELECT * FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 ORDER BY updated_at DESC LIMIT 9` },
    // 3: カテゴリ一覧（ツール件数付き）
    { sql: `SELECT c.*, COUNT(t.id) AS tool_count FROM categories c LEFT JOIN tools t ON t.category_id = c.id AND t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1 GROUP BY c.id ORDER BY c.sort_order ASC, c.name_ja ASC` },
    // 4: 価格変更
    { sql: `SELECT p.*, t.name_ja AS tool_name_ja, t.name_en AS tool_name_en, t.slug AS tool_slug FROM pricing_plans p JOIN tools t ON p.tool_id = t.id WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1 AND p.price_changed_at IS NOT NULL AND p.price_changed_at >= ? ORDER BY p.price_changed_at DESC LIMIT ?`, params: [sincePriceChange, 5] },
    // 5: Note記事（カテゴリ別）
    { sql: `SELECT na.id, na.title, na.thumbnail_url, na.note_url, na.likes_count, na.published_at, c.id as category_id, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug, c.sort_order as category_sort_order FROM tool_note_articles na JOIN tools t ON na.tool_id = t.id JOIN categories c ON t.category_id = c.id WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1 AND na.thumbnail_url IS NOT NULL AND na.thumbnail_url != '' AND na.published_at >= ? ORDER BY c.sort_order ASC, na.likes_count DESC LIMIT 500`, params: [since30d] },
  ]);

  const toolCount = (countRows[0] as any)?.c ?? 0;

  // Note記事をカテゴリ別にグループ化
  const map      = new Map<string, CategoryNoteArticles>();
  const seenUrls = new Set<string>();
  for (const row of noteRows as any[]) {
    if (seenUrls.has(row.note_url)) continue;
    seenUrls.add(row.note_url);
    if (!map.has(row.category_id)) {
      map.set(row.category_id, {
        category_id:      row.category_id,
        category_name_ja: row.category_name_ja,
        category_name_en: row.category_name_en ?? '',
        category_slug:    row.category_slug,
        sort_order:       row.category_sort_order,
        articles:         [],
      });
    }
    const cat = map.get(row.category_id)!;
    if (cat.articles.length < 10) cat.articles.push(row as NoteArticleForTop);
  }
  const categoryNotes = Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order);

  const priceChanges = (priceChangesRaw as any[]).map(p => ({
    tool_slug:           p.tool_slug,
    tool_name_ja:        p.tool_name_ja,
    tool_name_en:        p.tool_name_en,
    plan_name:           p.plan_name,
    price_usd:           p.price_usd,
    previous_price_usd:  p.previous_price_usd,
    price_trend:         p.price_trend,
    price_changed_at:    p.price_changed_at,
  }));

  return (
    <HomeContent
      locale="ja"
      stats={{
        toolCount,
        newToday:        (newTools as any[]).length,
        recentlyUpdated: priceChanges.length,
      }}
      latestNews={latestNews as any}
      newTools={newTools as any}
      categories={categories as any}
      priceChanges={priceChanges}
      categoryNotes={categoryNotes}
    />
  );
}
