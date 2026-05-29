// src/lib/db.ts
// Cloudflare D1 クライアント
// 本番（Cloudflare Pages）: Direct Binding（env.DB）経由で高速アクセス
// ローカル（next dev）: getCloudflareContext が失敗するためREST APIにフォールバック

import { getCloudflareContext } from '@opennextjs/cloudflare'
import type {
  Tool,
  PricingPlan,
  Category,
  News,
  ToolWithPlans,
} from '@/types'
import { CONFIG } from '@/config'

// =============================================
// D1 REST API fallback（ローカル開発用）
// =============================================

interface D1QueryResult<T> {
  success: boolean
  result?: Array<{ results?: T[] }>
  errors?: Array<{ message: string }>
}

async function queryD1Rest<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !databaseId || !apiToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[db] Cloudflare env vars are not set; returning empty result.')
    }
    return []
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    })

    if (!res.ok) {
      console.error('[db] D1 REST HTTP error:', res.status)
      return []
    }

    const text = await res.text()
    let data: D1QueryResult<T>
    try {
      data = JSON.parse(text) as D1QueryResult<T>
    } catch {
      console.error('[db] D1 REST JSON parse error. First 200 chars:', text.slice(0, 200))
      return []
    }

    if (!data.success) {
      console.error('[db] D1 REST query failed:', JSON.stringify(data.errors))
      return []
    }
    return data.result?.[0]?.results ?? []
  } catch (e) {
    console.error('[db] D1 REST query exception:', e)
    return []
  }
}

// =============================================
// D1 クエリ実行（Direct Binding優先・REST APIフォールバック）
// =============================================

export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  // Direct Binding（本番Cloudflare Pages・高速）
  try {
    const { env } = await getCloudflareContext<{ DB: D1Database }>()
    if (env?.DB) {
      const stmt = env.DB.prepare(sql)
      const bound = params.length > 0 ? stmt.bind(...params) : stmt
      const result = await bound.all<T>()
      return result.results ?? []
    }
  } catch {
    // ローカル開発（next dev）ではgetCloudflareContextが失敗するためREST APIで継続
  }

  return queryD1Rest<T>(sql, params)
}

// =============================================
// Tools
// =============================================

export async function getPublishedTools(limit = 30, offset = 0): Promise<Tool[]> {
  return queryD1<Tool>(
    `SELECT * FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  )
}

export async function getToolCount(): Promise<number> {
  const rows = await queryD1<{ c: number }>(
    `SELECT COUNT(*) AS c FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1`,
  )
  return rows[0]?.c ?? 0
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const rows = await queryD1<Tool>(
    `SELECT * FROM tools WHERE slug = ? AND is_published = 1 AND status != 'archived' AND admin_checked = 1 LIMIT 1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function getAllToolSlugs(): Promise<string[]> {
  const rows = await queryD1<{ slug: string }>(
    `SELECT slug FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1`,
  )
  return rows.map((r) => r.slug)
}

export async function getToolById(id: string): Promise<Tool | null> {
  const rows = await queryD1<Tool>(
    `SELECT * FROM tools WHERE id = ? AND is_published = 1 AND status != 'archived' AND admin_checked = 1 LIMIT 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function getToolsByCategory(categorySlug: string, limit = 30, offset = 0): Promise<Tool[]> {
  return queryD1<Tool>(
    `SELECT t.* FROM tools t
     JOIN categories c ON t.category_id = c.id
     WHERE c.slug = ? AND t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [categorySlug, limit, offset],
  )
}

export async function getToolCountByCategory(categorySlug: string): Promise<number> {
  const rows = await queryD1<{ c: number }>(
    `SELECT COUNT(*) AS c FROM tools t
     JOIN categories c ON t.category_id = c.id
     WHERE c.slug = ? AND t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1`,
    [categorySlug],
  )
  return rows[0]?.c ?? 0
}

export async function getNewToolsSince(hoursAgo: number, limit = 10): Promise<Tool[]> {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
  return queryD1<Tool>(
    `SELECT * FROM tools
     WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 AND created_at >= ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [since, limit],
  )
}

export async function getRecentlyUpdatedTools(limit = 9): Promise<Tool[]> {
  return queryD1<Tool>(
    `SELECT * FROM tools
     WHERE is_published = 1 AND status = 'active' AND admin_checked = 1
     ORDER BY updated_at DESC
     LIMIT ?`,
    [limit],
  )
}

export async function getFreeTools(limit = 12): Promise<Tool[]> {
  return queryD1<Tool>(
    `SELECT * FROM tools
     WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 AND has_free_plan = 1
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  )
}

export async function getRelatedTools(categoryId: string | null, excludeId: string, limit = 5): Promise<Tool[]> {
  if (!categoryId) return []
  return queryD1<Tool>(
    `SELECT * FROM tools
     WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 AND category_id = ? AND id != ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [categoryId, excludeId, limit],
  )
}

// =============================================
// Pricing
// =============================================

export async function getPlansForTool(toolId: string): Promise<PricingPlan[]> {
  return queryD1<PricingPlan>(
    `SELECT * FROM pricing_plans WHERE tool_id = ? ORDER BY
      CASE WHEN is_free = 1 THEN 0 ELSE 1 END,
      COALESCE(price_usd, 999999) ASC`,
    [toolId],
  )
}

export async function getRecentPriceChanges(days: number, limit = 5) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  return queryD1<
    PricingPlan & { tool_name_ja: string; tool_name_en: string; tool_slug: string }
  >(
    `SELECT p.*, t.name_ja AS tool_name_ja, t.name_en AS tool_name_en, t.slug AS tool_slug
     FROM pricing_plans p
     JOIN tools t ON p.tool_id = t.id
     WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1
       AND p.price_changed_at IS NOT NULL
       AND p.price_changed_at >= ?
     ORDER BY p.price_changed_at DESC
     LIMIT ?`,
    [since, limit],
  )
}

// =============================================
// Categories
// =============================================

export async function getAllCategories(): Promise<Category[]> {
  return queryD1<Category>(
    `SELECT * FROM categories ORDER BY sort_order ASC, name_ja ASC`,
  )
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await queryD1<Category>(
    `SELECT * FROM categories WHERE slug = ? LIMIT 1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const rows = await queryD1<Category>(
    `SELECT * FROM categories WHERE id = ? LIMIT 1`,
    [id],
  )
  return rows[0] ?? null
}

export interface CategoryWithCount extends Category {
  tool_count: number
}

export async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  return queryD1<CategoryWithCount>(
    `SELECT c.*, COUNT(t.id) AS tool_count
     FROM categories c
     LEFT JOIN tools t ON t.category_id = c.id AND t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name_ja ASC`,
  )
}

// =============================================
// News
// =============================================

export async function getLatestNews(limit = 5): Promise<News[]> {
  return queryD1<News>(
    `SELECT n.*, t.name_ja as tool_name_ja, t.name_en as tool_name_en, t.logo_url as tool_logo_url
     FROM news n
     LEFT JOIN tools t ON n.tool_id = t.id
     WHERE n.is_published = 1
       AND (n.tool_id IS NULL OR (t.is_published = 1 AND t.status != 'archived' AND t.admin_checked = 1))
     ORDER BY n.published_at DESC LIMIT ?`,
    [limit],
  )
}

export async function getAllNews(limit = 200): Promise<News[]> {
  return queryD1<News>(
    `SELECT * FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT ?`,
    [limit],
  )
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const rows = await queryD1<News>(
    `SELECT * FROM news WHERE slug = ? AND is_published = 1 LIMIT 1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function getAllNewsSlugs(): Promise<string[]> {
  const rows = await queryD1<{ slug: string }>(
    `SELECT slug FROM news WHERE is_published = 1`,
  )
  return rows.map((r) => r.slug)
}

export async function getRelatedNews(toolId: string | null, excludeId: string, limit = 3): Promise<News[]> {
  if (!toolId) return []
  return queryD1<News>(
    `SELECT * FROM news
     WHERE is_published = 1 AND tool_id = ? AND id != ?
     ORDER BY published_at DESC
     LIMIT ?`,
    [toolId, excludeId, limit],
  )
}

// =============================================
// Note記事（TOPページ用・カテゴリ別）
// =============================================

export interface NoteArticleForTop {
  id: string
  title: string
  thumbnail_url: string
  note_url: string
  likes_count: number
  published_at: string | null
  category_id: string
  category_name_ja: string
  category_slug: string
  category_sort_order: number
}

export interface CategoryNoteArticles {
  category_id: string
  category_name_ja: string
  category_name_en: string
  category_slug: string
  sort_order: number
  articles: NoteArticleForTop[]
}

export async function getTopNoteArticlesByCategory(limitPerCategory = 10): Promise<CategoryNoteArticles[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const rows = await queryD1<NoteArticleForTop>(
    `SELECT
       na.id, na.title, na.thumbnail_url, na.note_url, na.likes_count, na.published_at,
       c.id as category_id, c.name_ja as category_name_ja, c.name_en as category_name_en,
       c.slug as category_slug, c.sort_order as category_sort_order
     FROM tool_note_articles na
     JOIN tools t ON na.tool_id = t.id
     JOIN categories c ON t.category_id = c.id
     WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1
       AND na.thumbnail_url IS NOT NULL
       AND na.thumbnail_url != ''
       AND na.published_at >= ?
     ORDER BY c.sort_order ASC, na.likes_count DESC
     LIMIT 500`,
    [since],
  )

  const map = new Map<string, CategoryNoteArticles>()
  const seenUrls = new Set<string>()
  for (const row of rows) {
    if (seenUrls.has(row.note_url)) continue
    seenUrls.add(row.note_url)
    if (!map.has(row.category_id)) {
      map.set(row.category_id, {
        category_id: row.category_id,
        category_name_ja: row.category_name_ja,
        category_name_en: (row as any).category_name_en ?? '',
        category_slug: row.category_slug,
        sort_order: row.category_sort_order,
        articles: [],
      })
    }
    const cat = map.get(row.category_id)!
    if (cat.articles.length < limitPerCategory) {
      cat.articles.push(row)
    }
  }

  return Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order)
}

// =============================================
// 集約（ツール詳細ページ用）
// =============================================

export async function getToolDetailBySlug(slug: string): Promise<ToolWithPlans | null> {
  const tool = await getToolBySlug(slug)
  if (!tool) return null
  const [plans, category] = await Promise.all([
    getPlansForTool(tool.id),
    tool.category_id ? getCategoryById(tool.category_id) : Promise.resolve(null),
  ])
  return { ...tool, plans, category }
}

// =============================================
// Features（特集記事）
// =============================================

export interface Feature {
  id: string
  slug: string
  title: string
  body: string | null
  tool_id: string | null
  tool_name_en?: string | null
  tool_name_ja?: string | null
  tool_slug?: string | null
  tool_logo_url?: string | null
  is_published: number
  published_at: string
  updated_at: string
  created_at: string
}

export async function getPublishedFeaturesCount(): Promise<number> {
  try {
    const rows = await queryD1<{ c: number }>(
      `SELECT COUNT(*) AS c FROM features WHERE is_published = 1`
    )
    return rows[0]?.c ?? 0
  } catch {
    return 0
  }
}

export async function getAllFeatures(): Promise<Feature[]> {
  return queryD1<Feature>(
    `SELECT f.*, t.name_en as tool_name_en, t.name_ja as tool_name_ja,
            t.slug as tool_slug, t.logo_url as tool_logo_url
     FROM features f
     LEFT JOIN tools t ON f.tool_id = t.id
     WHERE f.is_published = 1
     ORDER BY f.published_at DESC`
  )
}

export async function getFeatureBySlug(slug: string): Promise<Feature | null> {
  const rows = await queryD1<Feature>(
    `SELECT f.*, t.name_en as tool_name_en, t.name_ja as tool_name_ja,
            t.slug as tool_slug, t.logo_url as tool_logo_url
     FROM features f
     LEFT JOIN tools t ON f.tool_id = t.id
     WHERE f.slug = ? AND f.is_published = 1 LIMIT 1`,
    [slug]
  )
  return rows[0] ?? null
}

export async function getFeaturesByToolId(toolId: string): Promise<Feature[]> {
  return queryD1<Feature>(
    `SELECT id, slug, title, thumbnail_url, published_at, updated_at FROM features WHERE tool_id = ? AND is_published = 1 ORDER BY published_at DESC`,
    [toolId]
  )
}

export async function getRecentFeatures(days = 30): Promise<Feature[]> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    return queryD1<Feature>(
      `SELECT id, slug, title, thumbnail_url, published_at
       FROM features
       WHERE is_published = 1 AND published_at >= ?
       ORDER BY published_at DESC
       LIMIT 5`,
      [since]
    )
  } catch {
    return []
  }
}
