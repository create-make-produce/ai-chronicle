export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import NewsRow from '@/components/NewsRow';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

export const metadata: Metadata = {
  title: 'AIツール最新ニュース | AI Chronicle',
  description: '新機能・アップデート・価格改定に関する最新情報。',
};

async function queryD1(sql: string, params: (string | number | null)[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId      = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token     = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) }
  );
  const data = await res.json() as any;
  return data.result?.[0]?.results ?? [];
}

async function getLatestNews() {
  return queryD1(
    `SELECT n.*, t.name_ja as tool_name_ja, t.name_en as tool_name_en,
            t.slug as tool_slug, t.logo_url as tool_logo_url
     FROM news n LEFT JOIN tools t ON n.tool_id = t.id
     WHERE n.is_published = 1 AND (n.tool_id IS NULL OR t.is_published = 1)
     ORDER BY n.published_at DESC LIMIT 50`
  );
}

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

export default async function NewsPage() {
  const newsItems = await getLatestNews();
  const grouped   = groupByMonth(newsItems as NewsItem[]);

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
          subtitle="新機能・アップデート・価格改定に関する最新情報"
        />
      </PageHero>

      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
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
        </div>
      </div>
    </main>
  );
}
