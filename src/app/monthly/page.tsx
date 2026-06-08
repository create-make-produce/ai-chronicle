export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import PageSelect from '@/components/PageSelect';
import ToolCard from '@/components/ToolCard';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';
import { queryD1 } from '@/lib/db';

export const metadata: Metadata = {
  title: '月刊AIアップデート',
  description: '最新アップデートされたAIツールをまとめてチェック。',
  alternates: {
    canonical: '/monthly',
  },
};

const PER_PAGE = 12;
const theme    = PAGE_THEMES.monthly;

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;

  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const countRows = await queryD1(
    `SELECT COUNT(*) as count FROM tools WHERE is_published = 1 AND status = 'active' AND admin_checked = 1 AND date(updated_at) >= ?`,
    [oneMonthAgo]
  );

  const thisMonthCount = (countRows[0] as any)?.count ?? 0;
  const totalPages  = Math.max(1, Math.ceil(thisMonthCount / PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(sp.p ?? '1', 10)), totalPages);
  const offset = (currentPage - 1) * PER_PAGE;

  const tools = await queryD1(
    `SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug FROM tools t LEFT JOIN categories c ON t.category_id = c.id WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1 AND date(t.updated_at) >= ? ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`,
    [oneMonthAgo, PER_PAGE, offset]
  );

  return (
    <main style={{ minHeight: '100vh' }}>
      <PageHero
        breadcrumbs={[{ label: 'ホーム', href: '/' }, { label: '月刊AIアップデート' }]}
        watermark="MONTHLY"
        theme={theme}
      >
        <PageHeroTitle
          en="Monthly Update"
          ja="AIアップデート"
          theme={theme}
          subtitle={`直近1ヶ月の更新AIツール（${thisMonthCount}件）`}
        />
      </PageHero>

      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          {tools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
              アップデート情報はまだありません。
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem 1.25rem' }}>
                {(tools as any[]).map((tool: Record<string, unknown>, i: number) => (
                  <ToolCard key={tool.id as string} tool={tool as any} locale="ja" index={i}
                    categoryName={tool.category_name_ja as string | undefined}
                    categorySlug={tool.category_slug as string | undefined} />
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
