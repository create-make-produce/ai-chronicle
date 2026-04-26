// src/lib/db.ts
// Cloudflare D1 クライアント（REST API 経由）
// キャッシュ戦略：unstable_cache でクエリ結果をオブジェクトレベルでキャッシュ
// → fetch 自体は cache:'no-store'（JSONエラー回避）
// → 結果の JavaScript オブジェクトを unstable_cache で TTL 管理

import { unstable_cache } from 'next/cache';
import type {
  Tool,
  PricingPlan,
  Category,
  News,
  ToolWithPlans,
} from '@/types';
import { CONFIG } from '@/config';

// =============================================
// D1 クエリ実行（基本ラッパー・キャッシュなし）
// =============================================

interface D1QueryResult<T> {
  success: boolean;
  result?: Array<{ results?: T[] }>;
  errors?: Array<{ message: string }>;
}

async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[db] Cloudflare env vars are not set; returning empty result.');
    }
    return [];
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store', // HTTP レスポンスはキャッシュしない（JSONエラー回避）
    });

    if (!res.ok) {
      console.error('[db] D1 HTTP error:', res.status);
      return [];
    }

    const text = await res.text();
    let data: D1QueryResult<T>;
    try {
      data = JSON.parse(text) as D1QueryResult<T>;
    } catch {
      console.error('[db] D1 JSON parse error. First 200 chars:', text.slice(0, 200));
      return [];
    }

    if (!data.success) {
      console.error('[db] D1 query failed:', JSON.stringify(data.errors));
      return [];
    }
    return data.result?.[0]?.results ?? [];
  } catch (e) {
    console.error('[db] D1 query exception:', e);
    return [];
  }
}

// =============================================
// Tools
// =============================================

export const getPublishedTools = unstable_cache(
  async (limit = 30, offset = 0): Promise<Tool[]> => {
    return queryD1<Tool>(
      `SELECT * FROM tools WHERE is_published = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  },
  ['published-tools'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getToolCount = unstable_cache(
  async (): Promise<number> => {
    const rows = await queryD1<{ c: number }>(
      `SELECT COUNT(*) AS c FROM tools WHERE is_published = 1`,
    );
    return rows[0]?.c ?? 0;
  },
  ['tool-count'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getToolBySlug = unstable_cache(
  async (slug: string): Promise<Tool | null> => {
    const rows = await queryD1<Tool>(
      `SELECT * FROM tools WHERE slug = ? AND is_published = 1 LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  },
  ['tool-by-slug'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

export const getAllToolSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await queryD1<{ slug: string }>(
      `SELECT slug FROM tools WHERE is_published = 1`,
    );
    return rows.map((r) => r.slug);
  },
  ['all-tool-slugs'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

export const getToolById = unstable_cache(
  async (id: string): Promise<Tool | null> => {
    const rows = await queryD1<Tool>(
      `SELECT * FROM tools WHERE id = ? AND is_published = 1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  },
  ['tool-by-id'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

export const getToolsByCategory = unstable_cache(
  async (categorySlug: string, limit = 30, offset = 0): Promise<Tool[]> => {
    return queryD1<Tool>(
      `SELECT t.* FROM tools t
       JOIN categories c ON t.category_id = c.id
       WHERE c.slug = ? AND t.is_published = 1
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [categorySlug, limit, offset],
    );
  },
  ['tools-by-category'],
  { revalidate: CONFIG.REVALIDATE_CATEGORY_PAGE_SECONDS },
);

export const getToolCountByCategory = unstable_cache(
  async (categorySlug: string): Promise<number> => {
    const rows = await queryD1<{ c: number }>(
      `SELECT COUNT(*) AS c FROM tools t
       JOIN categories c ON t.category_id = c.id
       WHERE c.slug = ? AND t.is_published = 1`,
      [categorySlug],
    );
    return rows[0]?.c ?? 0;
  },
  ['tool-count-by-category'],
  { revalidate: CONFIG.REVALIDATE_CATEGORY_PAGE_SECONDS },
);

export const getNewToolsSince = unstable_cache(
  async (hoursAgo: number, limit = 10): Promise<Tool[]> => {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    return queryD1<Tool>(
      `SELECT * FROM tools
       WHERE is_published = 1 AND created_at >= ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [since, limit],
    );
  },
  ['new-tools-since'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getRecentlyUpdatedTools = unstable_cache(
  async (limit = 9): Promise<Tool[]> => {
    return queryD1<Tool>(
      `SELECT * FROM tools
       WHERE is_published = 1
       ORDER BY updated_at DESC
       LIMIT ?`,
      [limit],
    );
  },
  ['recently-updated-tools'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getFreeTools = unstable_cache(
  async (limit = 12): Promise<Tool[]> => {
    return queryD1<Tool>(
      `SELECT * FROM tools
       WHERE is_published = 1 AND has_free_plan = 1
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit],
    );
  },
  ['free-tools'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getRelatedTools = unstable_cache(
  async (categoryId: string | null, excludeId: string, limit = 5): Promise<Tool[]> => {
    if (!categoryId) return [];
    return queryD1<Tool>(
      `SELECT * FROM tools
       WHERE is_published = 1 AND category_id = ? AND id != ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [categoryId, excludeId, limit],
    );
  },
  ['related-tools'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

// =============================================
// Pricing
// =============================================

export const getPlansForTool = unstable_cache(
  async (toolId: string): Promise<PricingPlan[]> => {
    return queryD1<PricingPlan>(
      `SELECT * FROM pricing_plans WHERE tool_id = ? ORDER BY
        CASE WHEN is_free = 1 THEN 0 ELSE 1 END,
        COALESCE(price_usd, 999999) ASC`,
      [toolId],
    );
  },
  ['plans-for-tool'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

export const getRecentPriceChanges = unstable_cache(
  async (days: number, limit = 5) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return queryD1<
      PricingPlan & { tool_name_ja: string; tool_name_en: string; tool_slug: string }
    >(
      `SELECT p.*, t.name_ja AS tool_name_ja, t.name_en AS tool_name_en, t.slug AS tool_slug
       FROM pricing_plans p
       JOIN tools t ON p.tool_id = t.id
       WHERE t.is_published = 1
         AND p.price_changed_at IS NOT NULL
         AND p.price_changed_at >= ?
       ORDER BY p.price_changed_at DESC
       LIMIT ?`,
      [since, limit],
    );
  },
  ['recent-price-changes'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

// =============================================
// Categories
// =============================================

export const getAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    return queryD1<Category>(
      `SELECT * FROM categories ORDER BY display_order ASC, name_ja ASC`,
    );
  },
  ['all-categories'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string): Promise<Category | null> => {
    const rows = await queryD1<Category>(
      `SELECT * FROM categories WHERE slug = ? LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  },
  ['category-by-slug'],
  { revalidate: CONFIG.REVALIDATE_CATEGORY_PAGE_SECONDS },
);

export const getCategoryById = unstable_cache(
  async (id: string): Promise<Category | null> => {
    const rows = await queryD1<Category>(
      `SELECT * FROM categories WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  },
  ['category-by-id'],
  { revalidate: CONFIG.REVALIDATE_CATEGORY_PAGE_SECONDS },
);

export interface CategoryWithCount extends Category {
  tool_count: number;
}

export const getCategoriesWithCount = unstable_cache(
  async (): Promise<CategoryWithCount[]> => {
    return queryD1<CategoryWithCount>(
      `SELECT c.*, COUNT(t.id) AS tool_count
       FROM categories c
       LEFT JOIN tools t ON t.category_id = c.id AND t.is_published = 1
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name_ja ASC`,
    );
  },
  ['categories-with-count'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

// =============================================
// News
// =============================================

export const getLatestNews = unstable_cache(
  async (limit = 5): Promise<News[]> => {
    return queryD1<News>(
      `SELECT * FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT ?`,
      [limit],
    );
  },
  ['latest-news'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getAllNews = unstable_cache(
  async (limit = 200): Promise<News[]> => {
    return queryD1<News>(
      `SELECT * FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT ?`,
      [limit],
    );
  },
  ['all-news'],
  { revalidate: CONFIG.REVALIDATE_TOP_PAGE_SECONDS },
);

export const getNewsBySlug = unstable_cache(
  async (slug: string): Promise<News | null> => {
    const rows = await queryD1<News>(
      `SELECT * FROM news WHERE slug = ? AND is_published = 1 LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  },
  ['news-by-slug'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

export const getAllNewsSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await queryD1<{ slug: string }>(
      `SELECT slug FROM news WHERE is_published = 1`,
    );
    return rows.map((r) => r.slug);
  },
  ['all-news-slugs'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

export const getRelatedNews = unstable_cache(
  async (toolId: string | null, excludeId: string, limit = 3): Promise<News[]> => {
    if (!toolId) return [];
    return queryD1<News>(
      `SELECT * FROM news
       WHERE is_published = 1 AND tool_id = ? AND id != ?
       ORDER BY published_at DESC
       LIMIT ?`,
      [toolId, excludeId, limit],
    );
  },
  ['related-news'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);

// =============================================
// 集約（ツール詳細ページ用）
// =============================================

export const getToolDetailBySlug = unstable_cache(
  async (slug: string): Promise<ToolWithPlans | null> => {
    const tool = await getToolBySlug(slug);
    if (!tool) return null;
    const [plans, category] = await Promise.all([
      getPlansForTool(tool.id),
      tool.category_id ? getCategoryById(tool.category_id) : Promise.resolve(null),
    ]);
    return { ...tool, plans, category };
  },
  ['tool-detail-by-slug'],
  { revalidate: CONFIG.REVALIDATE_TOOL_PAGE_SECONDS },
);
