export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import PageSelect from '@/components/PageSelect';
import ToolCard from '@/components/ToolCard';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';
import { getPublishedTools } from '@/lib/db';

export const metadata: Metadata = {
  title: '月刊AIアップデート | AI Chronicle',
  description: '最新アップデートされたAIツールをまとめてチェック。',
};

const PER_PAGE = 12;
const theme    = PAGE_THEMES.monthly;

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;

  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allTools = await getPublishedTools(1000, 0);

  const thisMonthCount = allTools.filter((t: any) => {
    const d = t.updated_at ?? t.created_at;
    return d && d.slice(0, 7) === ym;
  }).length;

  const sortedTools = [...allTools].sort((a: any, b: any) =>
    (b.updated_at ?? b.created_at ?? '').localeCompare(a.updated_at ?? a.created_at ?? '')
  );

  const totalPages  = Math.max(1, Math.ceil(sortedTools.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(sp.p ?? '1', 10)), totalPages);
  const tools       = sortedTools.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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
          subtitle={`今月更新のAIツール（${thisMonthCount}件更新）`}
        />
      </PageHero>

      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          {sortedTools.length === 0 ? (
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
