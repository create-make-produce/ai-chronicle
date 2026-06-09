export const revalidate = 5400;

import type { Metadata } from 'next';
import ToolsListContent from '@/components/ToolsListContent';
import { queryD1 } from '@/lib/db';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; p?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const cat = sp.cat ?? '';
  const q = sp.q ?? '';
  const p = parseInt(sp.p ?? '1', 10) || 1;

  let canonical = '/tools';
  const params: string[] = [];
  if (cat) params.push(`cat=${cat}`);
  if (q) params.push(`q=${encodeURIComponent(q)}`);
  if (p > 1) params.push(`p=${p}`);
  if (params.length > 0) canonical = `/tools?${params.join('&')}`;

  return {
    title: 'すべてのAIツール一覧',
    description: '登録済みのAIツールをすべて一覧表示。カテゴリ・機能で絞り込み可能。',
    alternates: { canonical },
  };
}

const PER_PAGE = 12;

export default async function AllToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; p?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat ?? '';
  const q   = sp.q ?? '';
  const page = Math.max(1, parseInt(sp.p ?? '1', 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  // WHERE句を動的に構築
  const conditions: string[] = [
    `t.is_published = 1`,
    `t.status = 'active'`,
    `t.admin_checked = 1`,
  ];
  const params: unknown[] = [];

  if (cat) {
    conditions.push(`c.slug = ?`);
    params.push(cat);
  }
  if (q) {
    conditions.push(`(t.name_ja LIKE ? OR t.name_en LIKE ? OR t.tagline_ja LIKE ? OR t.search_keywords LIKE ? OR t.description_ja LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  const where = conditions.join(' AND ');
  const baseSQL = `FROM tools t LEFT JOIN categories c ON t.category_id = c.id WHERE ${where}`;

  const [tools, countRows, categories] = await Promise.all([
    queryD1(
      `SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug
       ${baseSQL} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, PER_PAGE, offset]
    ),
    queryD1(`SELECT COUNT(*) as count ${baseSQL}`, params),
    queryD1(`SELECT id, slug, name_ja, name_en FROM categories ORDER BY sort_order ASC`),
  ]);

  const total = (countRows[0] as any)?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <ToolsListContent
      tools={tools as any}
      locale="ja"
      title="AIツール一覧"
      categories={categories as any}
      initialCat={cat}
      initialQ={q}
      currentPage={page}
      totalPages={totalPages}
      total={total}
    />
  );
}
