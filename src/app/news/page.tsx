export const runtime = 'edge';

import Link from 'next/link';
import { Metadata } from 'next';
import NewsRow from '@/components/NewsRow';

export const metadata: Metadata = {
  title: 'AIツール最新ニュース | AI Chronicle',
  description: '新機能・アップデート・価格改定に関する最新情報。',
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
      next: { revalidate: 1800 },
    }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

async function getLatestNews() {
  return queryD1(
    `SELECT n.*, t.name_ja as tool_name_ja, t.name_en as tool_name_en, t.slug as tool_slug, t.logo_url as tool_logo_url
     FROM news n LEFT JOIN tools t ON n.tool_id = t.id
     WHERE n.is_published = 1
       AND (n.tool_id IS NULL OR t.is_published = 1)
     ORDER BY n.published_at DESC
     LIMIT 50`,
    []
  );
}

export default async function NewsPage() {
  const newsItems = await getLatestNews();

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)' }}>
      <section style={{ position: 'relative', overflow: 'hidden', background: '#040912', borderBottom: '1px solid rgba(0,140,237,0.15)', paddingTop: '16px', paddingBottom: '24px' }}>
        {/* 背景：青い斜め帯 + ドット + 縦線 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '55%', height: '140%', background: 'linear-gradient(135deg, rgba(0,80,180,0.18) 0%, rgba(0,140,237,0.08) 100%)', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', top: '-20%', right: '15%', width: '2px', height: '140%', background: 'rgba(0,140,237,0.2)', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,140,237,0.12) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.25rem' }}>
            <Link href="/" style={{ color: '#4A5568', textDecoration: 'none' }}>ホーム</Link>
            <span>/</span>
            <span style={{ color: '#F0EBE1' }}>ニュース</span>
          </nav>
          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#008CED', marginBottom: '0.5rem' }}>
            AI News
          </p>
          <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            最新ニュース
          </h1>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem', color: '#7A8A99', margin: 0 }}>
            新機能・アップデート・価格改定に関する最新情報
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {newsItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#4A5568', fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem' }}>
            ニュースはまだありません。
          </div>
        ) : (
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            {newsItems.map((item: Record<string, unknown>, i: number) => (
              <NewsRow
                key={item.id as string}
                item={item as any}
                href={`/news/${item.slug as string}`}
                lang="ja"
                isLast={i === newsItems.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
