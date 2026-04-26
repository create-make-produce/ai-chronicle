// src/app/en/tools/page.tsx

import ToolsListContent from '@/components/ToolsListContent';
import { getPublishedTools } from '@/lib/db';

export const revalidate = 3600;

export const metadata = {
  title: 'All AI Tools',
  description: 'Browse all registered AI tools. Filter by category, price, and features.',
};

export default async function AllToolsPageEn() {
  const tools = await getPublishedTools(200, 0);
  return (
    <ToolsListContent
      tools={tools}
      locale="en"
      title="All AI Tools"
      description="Browse every AI tool registered in our database."
    />
  );
}
