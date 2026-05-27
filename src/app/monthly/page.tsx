export const runtime = 'edge';

import { Metadata } from 'next';
import PageSelect from '@/components/PageSelect';
import ToolCard from '@/components/ToolCard';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';
import { batchQueryD1 } from '@/lib/db';

export const metadata: Metadata = {
  title:       '月刊AIアップデート | AI Chronicle',
  description: '最新アップデートされたAIツールをまとめてチェック。',
};

const PER_PAGE = 12;
const theme    = PAGE_THEMES.monthly;

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;

  // 2クエリ → 1HTTPリクエスト
  const [allTools] = await batchQueryD1([
    { sql: `SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug FROM tools t LEFT JOIN categories c ON t.category_id = c.id WHERE t.is_published = 1 AND t.status = 'active' AND t.admin_checked = 1 ORDER BY t.updated_at DESC` },
  ]);

  // 今月件数をJSで計算（SQLの追加クエリ不要）
  const now          = new Date();
  const ym           = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = (allTools as any[]).filter(t => (t.updated_at as string)?.startsWith(ym)).length;

  const totalPages  = Math.max(1, Math.ceil(allTools.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(sp.p ?? '1', 10)), totalPages);
  const tools       = allTools.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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
          {allTools.length === 0 ? (
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
