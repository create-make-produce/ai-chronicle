export const dynamic = 'force-dynamic';
import { getFeatureBySlug } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PageHero, { PageHeroTitle } from '@/components/PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

const theme = PAGE_THEMES.features;

export default async function FeatureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  if (!feature) notFound();

  // 本文のYouTube URLを埋め込みに変換
  return (
    <main className="flex-1" style={{ minHeight: '100vh' }}>
      <PageHero
        breadcrumbs={[
          { label: 'ホーム', href: '/' },
          { label: '特集', href: '/features' },
          { label: feature.title },
        ]}
        theme={theme}
      >
        <div style={{ marginBottom: '8px' }}>
          {(feature as any).tool_name_en && (
            <Link href={`/tool/${(feature as any).tool_slug}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', marginBottom: '12px' }}>
              {(feature as any).tool_logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(feature as any).tool_logo_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'contain' }} />
              )}
              <span style={{ fontSize: '0.78rem', color: '#008CED', fontWeight: 600 }}>{(feature as any).tool_name_en}</span>
            </Link>
          )}
        </div>
        <PageHeroTitle
          en="Feature"
          ja={feature.title}
          theme={theme}
        />
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '16px' }}>
          <span>公開：{feature.published_at.slice(0, 10).replace(/-/g, '/')}</span>
          {feature.updated_at !== feature.published_at && (
            <span>更新：{feature.updated_at.slice(0, 10).replace(/-/g, '/')}</span>
          )}
        </div>
      </PageHero>

      <div style={{ background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

          {/* 本文 */}
          <style>{`
            .feature-body h2 { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; padding: 4px 10px; border-left: 4px solid #0056B3; color: var(--color-text); }
            .feature-body h3 { font-size: 1rem; font-weight: 700; margin: 1rem 0 0.4rem; padding: 4px 10px; border-left: 3px solid #60A5FA; color: var(--color-text); }
            .feature-body a { color: #008CED; text-decoration: underline; }
            .feature-body a::before { content: '🔗 '; font-size: 0.85em; }
            .feature-body p  { margin: 0 0 0.8em; }
          `}</style>
          <article
            className="feature-body"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: feature.body ?? '<p>本文がありません</p>' }}
          />

          {/* ツールリンク */}
          {(feature as any).tool_slug && (
            <div style={{ marginTop: '3rem', padding: '16px 20px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderLeft: '3px solid #008CED', borderRadius: '6px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>この記事のAIツール</p>
              <Link href={`/tool/${(feature as any).tool_slug}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#008CED', fontWeight: 700, fontSize: '0.88rem' }}>
                {(feature as any).tool_logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(feature as any).tool_logo_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />
                )}
                {(feature as any).tool_name_en} のツール詳細を見る →
              </Link>
            </div>
          )}

          {/* 一覧に戻る */}
          <div style={{ marginTop: '2rem' }}>
            <Link href="/features" style={{ fontSize: '0.82rem', color: '#008CED', textDecoration: 'none' }}>
              ← 特集一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
