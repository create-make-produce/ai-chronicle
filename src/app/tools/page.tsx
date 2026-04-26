// src/app/tools/page.tsx

import ToolsListContent from '@/components/ToolsListContent';
import { getPublishedTools } from '@/lib/db';

export const revalidate = 3600;

export const metadata = {
  title: 'すべてのAIツール一覧',
  description: '登録済みのAIツールをすべて一覧表示。カテゴリ・価格・機能で絞り込み可能。',
};

export default async function AllToolsPage() {
  const tools = await getPublishedTools(200, 0);
  return (
    <ToolsListContent
      tools={tools}
      locale="ja"
      title="すべてのAIツール"
      description="登録されているすべてのAIツールを一覧表示しています。"
    />
  );
}
