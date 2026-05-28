export const dynamic = 'force-dynamic';

import ToolsListContent from '@/components/ToolsListContent';
import { getPublishedTools, getAllCategories } from '@/lib/db';

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
    getPublishedTools(200, 0),
    getAllCategories(),
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
