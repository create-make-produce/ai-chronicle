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

          {/* サムネ（1280×720px推奨） */}
          {(feature as any).thumbnail_url && (
            <div style={{ marginBottom: '1.5rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(feature as any).thumbnail_url}
                alt={feature.title}
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* 記事カード */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderTop: '3px solid #7C3AED',
            borderRadius: '0 0 8px 8px',
            padding: '2rem 2.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 12px rgba(124,58,237,0.06)',
          }}>

          {/* 本文 */}
          <style>{`
            .feature-body h2 { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; padding: 4px 10px; border-left: 4px solid #7C3AED; color: var(--color-text); }
            .feature-body h3 { font-size: 1rem; font-weight: 700; margin: 1rem 0 0.4rem; padding: 4px 10px; border-left: 3px solid #DDD6FE; color: var(--color-text); }
            .feature-body a { color: #008CED; text-decoration: underline; }
            .feature-body a::before { content: '🔗 '; font-size: 0.85em; }
            .feature-body [data-yt-row] { margin: 0.5rem 0; font-size: 0; }
            .feature-body p  { margin: 0 0 0.8em; }
            .feature-body img { cursor: zoom-in; border-radius: 4px; }
            #feature-lightbox { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; align-items:center; justify-content:center; cursor:zoom-out; }
            #feature-lightbox.open { display:flex; }
            #feature-lightbox img { max-width:90vw; max-height:90vh; border-radius:8px; object-fit:contain; }
            #feature-lightbox-close { position:fixed; top:16px; right:20px; color:#fff; font-size:2rem; cursor:pointer; line-height:1; }
          `}</style>
          <div id="feature-lightbox">
            <span id="feature-lightbox-close">×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img id="feature-lightbox-img" src="data:," alt="" />
          </div>
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              function initLightbox() {
                document.addEventListener('click', function(e) {
                  var t = e.target;
                  if (t.tagName === 'IMG' && t.closest('.feature-body')) {
                    var lb = document.getElementById('feature-lightbox');
                    var lbImg = document.getElementById('feature-lightbox-img');
                    if (lb && lbImg) { lbImg.src = t.src; lb.classList.add('open'); e.stopPropagation(); }
                  } else if (t.id === 'feature-lightbox' || t.id === 'feature-lightbox-close') {
                    var el = document.getElementById('feature-lightbox');
                    if (el) el.classList.remove('open');
                  }
                });
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initLightbox);
              } else {
                initLightbox();
              }
            })();
          `}} />
          <article
            className="feature-body"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: feature.body ?? '<p>本文がありません</p>' }}
          />

          </div>{/* /記事カード */}

          {/* ツールリンク */}
          {(feature as any).tool_slug && (
            <div style={{ marginTop: '1.5rem', padding: '16px 20px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderLeft: '3px solid #008CED', borderRadius: '6px' }}>
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
            <Link href="/features" style={{ fontSize: '0.82rem', color: '#7C3AED', textDecoration: 'none' }}>
              ← 特集一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
