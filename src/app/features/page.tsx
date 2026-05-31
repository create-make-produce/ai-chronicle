export const dynamic = 'force-dynamic';
import { getAllFeaturesLight } from '@/lib/db';
import Link from 'next/link';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

export const metadata = {
  title: '特集 | AI Chronicle',
  description: 'AI Chronicleの特集記事一覧。実際に使ったAIツールのレビューや活用事例をお届けします。',
};

const theme = PAGE_THEMES.features;

export default async function FeaturesPage() {
  const features = await getAllFeaturesLight();

  return (
    <main className="flex-1" style={{ minHeight: '100vh' }}>
      <PageHero
        breadcrumbs={[{ label: 'ホーム', href: '/' }, { label: '特集' }]}
        watermark="FEATURES"
        theme={theme}
      >
        <PageHeroTitle
          en="Features"
          ja="特集"
          theme={theme}
          subtitle="AIツールの活用事例・レビュー・使い方を深掘りします"
        />
      </PageHero>

      <div style={{ background: 'var(--color-bg)', minHeight: '60vh' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          {features.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', padding: '4rem', textAlign: 'center' }}>
              特集記事はまだありません
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {features.map(f => (
                <Link key={f.id} href={`/feature/${f.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--color-bg-sub)', overflow: 'hidden', flexShrink: 0 }}>
                    {(f as any).thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(f as any).thumbnail_url} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-accent-bg)' }}>
                        <span style={{ fontSize: '2.5rem' }}>📝</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {(f as any).tool_name_en && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        {(f as any).tool_logo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(f as any).tool_logo_url} alt="" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'contain' }} />
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 600 }}>{(f as any).tool_name_en}</span>
                      </div>
                    )}
                    <h2 style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', margin: '0 0 auto', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                      {f.title}
                    </h2>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
                      {f.published_at?.slice(0, 10).replace(/-/g, '/')}
                      {f.updated_at && f.updated_at !== f.published_at && (
                        <span style={{ marginLeft: '8px' }}>更新: {f.updated_at.slice(0, 10).replace(/-/g, '/')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
