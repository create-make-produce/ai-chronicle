export const runtime = 'edge';

import { Metadata } from 'next';
import PageSelect from '@/components/PageSelect';
import ToolCard from '@/components/ToolCard';
import PageHero from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

export const metadata: Metadata = {
  title: '月刊AIアップデート | AI Chronicle',
  description: '最新アップデートされたAIツールをまとめてチェック。',
};

const PER_PAGE = 12;
const theme    = PAGE_THEMES.monthly;

async function queryD1(sql: string, params: (string | number | null)[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId      = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token     = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

async function getAllTools() {
  return queryD1(
    `SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug
     FROM tools t LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_published = 1 ORDER BY t.updated_at DESC`
  );
}

async function getThisMonthCount() {
  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rows = await queryD1(`SELECT COUNT(*) as count FROM tools WHERE is_published = 1 AND strftime('%Y-%m', updated_at) = ?`, [ym]);
  return (rows[0]?.count as number) ?? 0;
}

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;
  const [allTools, thisMonthCount] = await Promise.all([getAllTools(), getThisMonthCount()]);

  const totalPages  = Math.max(1, Math.ceil(allTools.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(sp.p ?? '1', 10)), totalPages);
  const tools       = allTools.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const now         = new Date();
  const monthLabel  = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <main style={{ minHeight: '100vh' }}>
      <PageHero
        breadcrumbs={[{ label: 'ホーム', href: '/' }, { label: '月刊AIアップデート' }]}
        label="MONTHLY UPDATE"
        watermark="MONTHLY"
        theme={theme}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-fira), system-ui', fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: '10px' }}>
              月刊AIアップデート
            </h1>
            <p style={{ fontFamily: 'var(--font-noto), sans-serif', fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
              今月更新のAIツール（{thisMonthCount}件更新）
            </p>
          </div>
          <span style={{ fontFamily: 'var(--font-fira), system-ui', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', color: theme.accent, border: `1px solid rgba(${theme.rgb},0.35)`, borderRadius: '4px', padding: '4px 12px', background: theme.accentBg, whiteSpace: 'nowrap' }}>
            {monthLabel}
          </span>
        </div>
      </PageHero>

      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          {allTools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
              アップデート情報はまだありません。
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem 1.25rem' }}>
                {tools.map((tool: Record<string, unknown>, i: number) => (
                  <ToolCard key={tool.id as string} tool={tool as any} locale="ja" index={i} categoryName={tool.category_name_ja as string | undefined} categorySlug={tool.category_slug as string | undefined} />
                ))}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                  <PageSelect currentPage={currentPage} totalPages={totalPages} basePath="/monthly" lang="ja" theme={theme} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
