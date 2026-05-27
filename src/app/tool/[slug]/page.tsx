export const runtime = 'edge';

// src/app/tool/[slug]/page.tsx
import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolDetailContent from '@/components/ToolDetailContent';
import { getToolBySlug, batchQueryD1 } from '@/lib/db';
import type { ToolWithPlans } from '@/types';

interface Params {
  params: Promise<{ slug: string }>;
}

// generateMetadataとページコンポーネントでtool取得を共有（重複HTTPリクエスト防止）
const getToolCached = cache(async (slug: string) => getToolBySlug(slug));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolCached(slug);
  if (!tool) return {};
  return {
    title:       `${tool.name_ja}の料金・評判・使い方`,
    description: tool.tagline_ja || `${tool.name_ja}の機能・料金プラン・使い方を詳細解説。`,
    alternates:  { canonical: `/tool/${tool.slug}` },
  };
}

export default async function ToolDetailPage({ params }: Params) {
  const { slug } = await params;
  const tool = await getToolCached(slug);
  if (!tool) notFound();

  // 7クエリを1HTTPリクエストにまとめる（getToolCachedと合わせて計2HTTPリクエスト）
  const [
    plans,
    categoryRows,
    relatedTools,
    toolNews,
    toolLaunches,
    noteArticles,
    relatedFromRelations,
  ] = await batchQueryD1([
    // 料金プラン
    { sql: `SELECT * FROM pricing_plans WHERE tool_id = ? ORDER BY CASE WHEN is_free = 1 THEN 0 ELSE 1 END, COALESCE(price_usd, 999999) ASC`, params: [tool.id] },
    // カテゴリ
    { sql: `SELECT * FROM categories WHERE id = ? LIMIT 1`, params: [tool.category_id ?? ''] },
    // 関連ツール
    { sql: `SELECT * FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 AND category_id = ? AND id != ? ORDER BY created_at DESC LIMIT 6`, params: [tool.category_id ?? '', tool.id] },
    // ニュース
    { sql: `SELECT * FROM news WHERE tool_id = ? AND is_published = 1 ORDER BY published_at DESC`, params: [tool.id] },
    // ローンチ履歴
    { sql: `SELECT * FROM tool_launches WHERE tool_id = ? ORDER BY launch_number DESC LIMIT 100`, params: [tool.id] },
    // Note記事
    { sql: `SELECT * FROM tool_note_articles WHERE tool_id = ? ORDER BY is_pinned DESC, published_at DESC LIMIT 60`, params: [tool.id] },
    // 関連AIツール
    { sql: `SELECT t.id, t.slug, t.name_ja, t.name_en, t.tagline_ja, t.logo_url FROM tool_relations tr JOIN tools t ON tr.tool_id_b = t.id WHERE tr.tool_id_a = ? AND t.is_published = 1 AND t.admin_checked = 1`, params: [tool.id] },
  ]);

  const category   = (categoryRows[0] as any) ?? null;
  const toolWithPlans: ToolWithPlans = { ...tool, plans: plans as any, category };

  return (
    <ToolDetailContent
      tool={toolWithPlans}
      relatedTools={relatedTools as any}
      locale="ja"
      toolNews={toolNews as any}
      toolLaunches={toolLaunches as any}
      noteArticles={noteArticles as any}
      relatedToolsFromRelations={relatedFromRelations as any}
    />
  );
}
