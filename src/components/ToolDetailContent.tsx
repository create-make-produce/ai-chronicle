// src/components/ToolDetailContent.tsx
import Link from 'next/link';
import type { Locale, ToolWithPlans, Tool, News, ToolLaunch, NoteArticle } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import AdSlot from './AdSlot';
import ToolMediaTabs from './ToolMediaTabs';
import ToolNewsSection from './ToolNewsSection';
import ToolFeaturesSection from './ToolFeaturesSection';
import PageHero from './PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

interface ToolDetailContentProps {
  tool: ToolWithPlans;
  relatedTools: Tool[];
  locale: Locale;
  toolNews?: News[];
  toolLaunches?: ToolLaunch[];
  noteArticles?: NoteArticle[];
  relatedToolsFromRelations?: Array<{ id: string; slug: string; name_ja: string; name_en: string; tagline_ja: string | null; logo_url: string | null }>;
  toolFeatures?: Array<{ id: string; slug: string; title: string; thumbnail_url: string | null; published_at: string; updated_at: string }>;
}

function isProductHuntUrl(url: string): boolean {
  return url.includes('producthunt.com');
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
    </svg>
  );
}

function LinkBadge({ href, icon, topLabel, bottomLabel }: { href: string; icon: React.ReactNode; topLabel: string; bottomLabel: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', padding: '6px 14px', textDecoration: 'none', lineHeight: 1.3, minWidth: '130px' }}>
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        {/* topLabel は固定テキスト → Noto Sans JP サブセット */}
        <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.6rem', opacity: 0.7, letterSpacing: '0.03em' }}>{topLabel}</span>
        {/* bottomLabel は動的（ドメイン名等） → システムフォント */}
        <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif', fontWeight: 700, fontSize: '0.82rem' }}>{bottomLabel}</span>
      </span>
    </a>
  );
}

export default function ToolDetailContent({
  tool, relatedTools, locale, toolNews = [], toolLaunches = [], noteArticles = [], relatedToolsFromRelations = [], toolFeatures = [],
}: ToolDetailContentProps) {
  const tt          = t[locale];
  const name        = locale === 'ja' ? tool.name_ja : tool.name_en;
  const tagline     = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const description = locale === 'ja' ? tool.description_ja : tool.description_en;

  const officialUrl    = tool.official_url && !isProductHuntUrl(tool.official_url) ? tool.official_url : null;
  const officialDomain = (() => {
    try { return officialUrl ? new URL(officialUrl).hostname.replace('www.', '') : ''; }
    catch { return ''; }
  })();

  const initials = name.slice(0, 2).toUpperCase();
  const hasLinks = officialUrl || tool.twitter_handle || tool.github_url || tool.ios_url || tool.android_url;

  return (
    <>
      <main className="flex-1" style={{ background: 'var(--color-page-gradient)' }}>

        <PageHero
          theme={PAGE_THEMES.tools}
          breadcrumbs={[
            { label: tt.navHome, href: localizedPath(locale, '/') },
            { label: 'すべてのAI', href: localizedPath(locale, '/tools') },
            ...(tool.category ? [{ label: tool.category.name_ja, href: localizedPath(locale, `/category/${tool.category.slug}`) }] : []),
            { label: name },
          ]}
          label="AI TOOL"
          watermark={tool.name_en}
        >
          {/* ロゴ＋ツール名 */}
          <div className="tool-hero-layout">
            <div style={{
              flexShrink: 0, width: '64px', height: '64px', borderRadius: '8px',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {tool.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tool.logo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                /* イニシャルは動的 → システムフォント */
                <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)', textTransform: 'uppercase' }}>{initials}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* ツール名（動的 → システムフォント） */}
              <h1 style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1,
                letterSpacing: '0.01em', marginBottom: '0.5rem', textTransform: 'none',
              }}>
                {name}
              </h1>
              {/* タグライン（動的 → システムフォント） */}
              {tagline && (() => {
                const parts = tagline.split('。').map((s: string) => s.trim()).filter(Boolean);
                return parts.length > 1 ? (
                  <div>
                    <p style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif', fontSize: '1rem', color: 'var(--color-text-sub)', margin: 0, lineHeight: 1.6 }}>{parts[0]}</p>
                    <p style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif', fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0', lineHeight: 1.6 }}>{parts[1]}</p>
                  </div>
                ) : (
                  <p style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif', fontSize: '1rem', color: 'var(--color-text-muted)', margin: 0 }}>{tagline.replace(/。/g, '')}</p>
                );
              })()}
            </div>
          </div>
        </PageHero>

        {/* ── 本文 ── */}
        <div className="max-w-5xl mx-auto section-px pb-16 space-y-4" style={{ paddingTop: '2rem' }}>

          {(description || hasLinks) && (
            <section style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: '4px', padding: '1.5rem' }}>
              {description && (
                <div className="mb-5">
                  {/* 「概要」は固定テキスト → .font-display クラス（Fira Sans サブセット） */}
                  <h2 className="font-display text-2xl tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>概要</h2>
                  {/* 説明文（動的 → システムフォント・body継承） */}
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                    {description.replace(/<br\s*\/?>/gi, '\n')}
                  </div>
                </div>
              )}
              {hasLinks && (
                <div>
                  {/* 「リンク」は固定テキスト → .section-label クラス */}
                  <h2 className="section-label mb-3">リンク</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                    {officialUrl && <LinkBadge href={officialUrl} icon={<GlobeIcon />} topLabel="Webサイト" bottomLabel={officialDomain || 'Visit'} />}
                    {tool.ios_url && <LinkBadge href={tool.ios_url} icon={<AppleIcon />} topLabel="ダウンロード" bottomLabel="App Store" />}
                    {tool.android_url && <LinkBadge href={tool.android_url} icon={<GooglePlayIcon />} topLabel="ダウンロード" bottomLabel="Google Play" />}
                    {(tool.twitter_handle || tool.github_url) && (
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', alignItems: 'center' }}>
                        {tool.twitter_handle && <a href={`https://x.com/${tool.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="link-underline" style={{ color: 'var(--color-accent)' }}>X @{tool.twitter_handle}</a>}
                        {tool.github_url && <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="link-underline" style={{ color: 'var(--color-accent)' }}>GitHub</a>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          <ToolFeaturesSection features={toolFeatures} />

          <ToolMediaTabs
            noteArticles={noteArticles}
            locale={locale}
            launches={toolLaunches}
            toolName={name}
            toolLogoUrl={tool.logo_url ?? null}
            relatedTools={relatedToolsFromRelations}
            currentToolId={tool.id}
          />

          {toolNews.length > 0 && (
            <section style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: '4px', padding: '1.5rem' }}>
              <ToolNewsSection news={toolNews} locale={locale} />
            </section>
          )}

          <AdSlot slot="in-content" />

          {(tool.demo_url || tool.video_url) && (
            <section style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: '4px', padding: '1.5rem' }}>
              <h2 className="font-display text-2xl tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>メディア</h2>
              <div className="flex flex-wrap gap-3">
                {tool.demo_url && <a href={tool.demo_url} target="_blank" rel="noopener noreferrer" className="btn-outline">デモを見る →</a>}
                {tool.video_url && <a href={tool.video_url} target="_blank" rel="noopener noreferrer" className="btn-outline">動画を見る →</a>}
              </div>
            </section>
          )}

          {tool.user_count_label && (
            <section style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: '4px', padding: '1.5rem' }}>
              <h2 className="section-label mb-2">ユーザー数</h2>
              <p className="font-display text-xl" style={{ color: 'var(--color-text)' }}>{tool.user_count_label}</p>
            </section>
          )}

          <AdSlot slot="footer" />
        </div>
      </main>

      <script type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'SoftwareApplication',
          name, description: description || undefined,
          url: tool.official_url || undefined,
          applicationCategory: 'AIApplication',
        }) }}
      />
    </>
  );
}
