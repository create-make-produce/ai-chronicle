export const runtime = 'edge';

import Link from 'next/link';
import { Metadata } from 'next';
import PageSelect from '@/components/PageSelect';
import ToolCard from '@/components/ToolCard';

export const metadata: Metadata = {
  title: 'AI Update Monthly | AI Chronicle',
  description: 'Monthly roundup of updated AI tools.',
};

const PER_PAGE = 30;

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

async function getAllTools() {
  return queryD1(
    `SELECT t.*,
            c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug
     FROM tools t LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_published = 1
     ORDER BY t.updated_at DESC`,
    []
  );
}

export default async function MonthlyPageEn({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;
  const allTools = await getAllTools();
  const totalPages = Math.max(1, Math.ceil(allTools.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(sp.p ?? '1', 10)), totalPages);
  const tools = allTools.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <main style={{ minHeight: '100vh', background: '#111318' }}>
      <section style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #112240 60%, #0A1A35 100%)', borderBottom: '1px solid rgba(0,140,237,0.15)', padding: '2rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.25rem' }}>
            <Link href="/en" style={{ color: '#4A5568', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#F0EBE1' }}>AI Update Monthly</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#008CED', marginBottom: '0.5rem' }}>
                Monthly Update
              </p>
              <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                AI Update Monthly
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#7A8A99', margin: 0 }}>
                Latest updated AI tools roundup
              </p>
            </div>

            <div style={{ flexShrink: 0, paddingBottom: '0.25rem' }}>
              <PageSelect
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/en/monthly"
                lang="en"
              />
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {allTools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#4A5568', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
            No updates yet.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem 1.25rem', paddingTop: '0.5rem' }}>
              {tools.map((tool: Record<string, unknown>, i: number) => (
                <ToolCard
                  key={tool.id as string}
                  tool={tool as any}
                  locale="en"
                  index={i}
                  categoryName={tool.category_name_en as string | undefined}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                <PageSelect
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath="/en/monthly"
                  lang="en"
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
