export const dynamic = 'force-dynamic';

import ToolsListContent from '@/components/ToolsListContent';
import { queryD1 } from '@/lib/db';

export const metadata = {
  title: 'すべてのAIツール一覧 | AI Chronicle',
  description: '登録済みのAIツールをすべて一覧表示。カテゴリ・機能で絞り込み可能。',
};

export default async function AllToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [tools, categories] = await Promise.all([
    queryD1(`SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug FROM tools t LEFT JOIN categories c ON t.category_id = c.id WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1 ORDER BY t.created_at DESC LIMIT 200`),
    queryD1(`SELECT id, slug, name_ja, name_en FROM categories ORDER BY sort_order ASC`),
  ]);

  return (
    <ToolsListContent
      tools={tools as any}
      locale="ja"
      title="AIツール一覧"
      categories={categories as any}
      initialCat={sp.cat ?? ''}
      initialQ={sp.q ?? ''}
    />
  );
}
