// src/app/tool/[slug]/page.tsx
export const revalidate = 5400;
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolDetailContent from '@/components/ToolDetailContent';
import { getToolDetailBySlug, getRelatedTools, queryD1, getFeaturesByToolId } from '@/lib/db';

interface Params {
  params: Promise<{ slug: string }>;
}

async function getToolNews(toolId: string) {
  return queryD1(
    `SELECT * FROM news WHERE tool_id = ? AND is_published = 1 ORDER BY published_at DESC`,
    [toolId]
  );
}


async function getNoteArticles(toolId: string) {
  return queryD1(
    `SELECT * FROM tool_note_articles WHERE tool_id = ? ORDER BY is_pinned DESC, published_at DESC LIMIT 60`,
    [toolId]
  );
}

async function getRelatedToolsFromRelations(toolId: string) {
  return queryD1(
    `SELECT t.id, t.slug, t.name_ja, t.name_en, t.tagline_ja, t.logo_url
     FROM tool_relations tr
     JOIN tools t ON tr.tool_id_b = t.id
     WHERE tr.tool_id_a = ? AND t.is_published = 1`,
    [toolId]
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) return {};
  const name = tool.name_ja;
  const tagline = tool.tagline_ja || '';
  return {
    title: `${name} - AIツール詳細`,
    description: tagline || `${name}の機能・特徴を日本語で解説。`,
    alternates: {
      canonical: `/tool/${tool.slug}`,
    },
  };
}

export default async function ToolDetailPage({ params }: Params) {
  const { slug } = await params;
  const tool = await getToolDetailBySlug(slug);
  if (!tool) notFound();

  const [related, toolNews, noteArticles, relatedFromRelations, toolFeatures] = await Promise.all([
    getRelatedTools(tool.category_id, tool.id, 6),
    getToolNews(tool.id),
    getNoteArticles(tool.id),
    getRelatedToolsFromRelations(tool.id),
    getFeaturesByToolId(tool.id),
  ]);

  return (
    <ToolDetailContent
      tool={tool}
      relatedTools={related}
      locale="ja"
      toolNews={toolNews}
      noteArticles={noteArticles}
      relatedToolsFromRelations={relatedFromRelations}
      toolFeatures={toolFeatures as any}
    />
  );
}
