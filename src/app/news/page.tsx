export const revalidate = 5400;

import { Metadata } from 'next';
import NewsRow from '@/components/NewsRow';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';
import { getNewsCount, getNewsPaged } from '@/lib/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AIツール最新ニュース',
  description: 'AIツールの新機能・アップデート・最新ニュースをお届け',
  alternates: {
    canonical: '/news',
  },
};

const PER_PAGE = 50;

type NewsItem = Record<string, unknown>;

function groupByMonth(items: NewsItem[]): Array<{ monthKey: string; monthLabel: string; items: NewsItem[] }> {
  const map = new Map<string, { label: string; items: NewsItem[] }>();
  for (const n of items) {
    const dateStr = n.published_at as string;
    if (!dateStr) continue;
    const d = new Date(dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) continue;
    const jst   = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const key   = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月`;
    if (!map.has(key)) map.set(key, { label, items: [] });
    map.get(key)!.items.push(n);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, { label, items }]) => ({ monthKey: key, monthLabel: label, items }));
}

const theme = PAGE_THEMES.news;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page    = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const offset  = (page - 1) * PER_PAGE;

  const [total, newsItems] = await Promise.all([
    getNewsCount(),
    getNewsPaged(PER_PAGE, offset),
  ]);
  const totalPages = Math.ceil(total / PER_PAGE);
  const grouped    = groupByMonth(newsItems as NewsItem[]);

  return (
    <main style={{ minHeight: '100vh' }}>
      <PageHero
        breadcrumbs={[{ label: 'ホーム', href: '/' }, { label: 'ニュース' }]}
        watermark="NEWS"
        theme={theme}
      >
        <PageHeroTitle
          en="AI News"
          ja="最新ニュース"
          theme={theme}
          subtitle="AIツールの新機能・アップデート・最新ニュースをお届け"
        />
      </PageHero>

      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

          {/* 件数・ページ表示 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              全{total}件 / {page}ページ目（{totalPages}ページ中）
            </span>
          </div>

          {newsItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
              ニュースはまだありません。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {grouped.map(({ monthKey, monthLabel, items }) => (
                <section key={monthKey}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ width: '22px', height: '2px', background: theme.accent, display: 'inline-block', flexShrink: 0 }} />
                    <h2 style={{ fontFamily: 'var(--font-fira), system-ui', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0 }}>
                      {monthLabel}
                    </h2>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-border-mid)' }}>{items.length}件</span>
                  </div>
                  <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    {items.map((item, idx) => (
                      <NewsRow key={item.id as string} item={item as any} href={`/news/${item.slug as string}`} lang="ja" isLast={idx === items.length - 1} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '3rem', flexWrap: 'wrap' }}>
              {/* 前へ */}
              {page > 1 && (
                <Link href={`/news?page=${page - 1}`} style={{
                  padding: '8px 16px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)', textDecoration: 'none',
                }}>← 前へ</Link>
              )}

              {/* ページ番号 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) => p === '...' ? (
                  <span key={`ellipsis-${idx}`} style={{ padding: '8px 4px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>…</span>
                ) : (
                  <Link key={p} href={`/news?page=${p}`} style={{
                    padding: '8px 14px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600,
                    textDecoration: 'none',
                    background: p === page ? 'var(--color-accent)' : 'var(--color-bg)',
                    border: `1px solid ${p === page ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: p === page ? '#fff' : 'var(--color-text)',
                  }}>{p}</Link>
                ))
              }

              {/* 次へ */}
              {page < totalPages && (
                <Link href={`/news?page=${page + 1}`} style={{
                  padding: '8px 16px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)', textDecoration: 'none',
                }}>次へ →</Link>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
