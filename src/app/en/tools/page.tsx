export const runtime = 'edge';

import ToolsListContent from '@/components/ToolsListContent';

export const metadata = {
  title: 'All AI Tools | AI Chronicle',
  description: 'Browse all registered AI tools. Filter by category, price, and features.',
};

async function queryD1(sql: string, params: (string | number | null)[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
      next: { revalidate: 3600 },
    }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

async function getTools() {
  return queryD1(
    `SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug
     FROM tools t LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_published = 1
     ORDER BY t.created_at DESC
     LIMIT 200`
  );
}

async function getCategories() {
  return queryD1(
    `SELECT id, slug, name_ja, name_en FROM categories ORDER BY display_order ASC`
  );
}

export default async function AllToolsPageEn() {
  const [tools, categories] = await Promise.all([getTools(), getCategories()]);
  return (
    <ToolsListContent
      tools={tools as any}
      locale="en"
      title="All AI Tools"
      categories={categories as any}
    />
  );
}
