// src/components/ToolDetailContent.tsx
import Link from 'next/link';
import type { Locale, ToolWithPlans, Tool, News, ToolLaunch, NoteArticle } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import ToolCard from './ToolCard';
import AdSlot from './AdSlot';
import ToolMediaTabs from './ToolMediaTabs';

interface ToolDetailContentProps {
  tool: ToolWithPlans;
  relatedTools: Tool[];
  locale: Locale;
  toolNews?: News[];
  toolLaunches?: ToolLaunch[];
  noteArticles?: NoteArticle[];
}

const NEWS_TYPE_LABELS = {
  price_change: { ja: '価格改定', en: 'Price Change', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)', border: 'rgba(252,211,77,0.3)' },
  new_tool:     { ja: '新リリース', en: 'New Release', color: '#008CED', bg: 'rgba(0,140,237,0.12)', border: 'rgba(0,140,237,0.3)' },
  new_feature:  { ja: '新機能', en: 'New Feature', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  other:        { ja: 'その他', en: 'Other', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
} as const;

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

function LinkBadge({ href, icon, topLabel, bottomLabel }: {
  href: string; icon: React.ReactNode; topLabel: string; bottomLabel: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', padding: '6px 14px', textDecoration: 'none', lineHeight: 1.3, minWidth: '130px' }}>
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.6rem', opacity: 0.7, letterSpacing: '0.03em' }}>{topLabel}</span>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Inter, sans-serif' }}>{bottomLabel}</span>
      </span>
    </a>
  );
}

export default function ToolDetailContent({ tool, relatedTools, locale, toolNews = [], toolLaunches = [], noteArticles = [] }: ToolDetailContentProps) {
  const tt = t[locale];
  const name = locale === 'ja' ? tool.name_ja : tool.name_en;
  const tagline = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const description = locale === 'ja' ? tool.description_ja : tool.description_en;

  const officialUrl = tool.official_url && !isProductHuntUrl(tool.official_url) ? tool.official_url : null;
  const officialDomain = (() => {
    try { return officialUrl ? new URL(officialUrl).hostname.replace('www.', '') : ''; }
    catch { return ''; }
  })();

  const initials = name.slice(0, 2).toUpperCase();
  const hasLinks = officialUrl || tool.twitter_handle || tool.github_url || tool.ios_url || tool.android_url;

  const statusLabel = () => {
    switch (tool.status) {
      case 'beta':       return tt.badgeBeta;
      case 'inactive':
      case 'deprecated': return tt.badgeInactive;
      default:           return tt.badgeActive;
    }
  };

  return (
    <>
      <main className="flex-1">

        {/* ヘッダー */}
        <section style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #112240 60%, #0A1A35 100%)', borderBottom: '1px solid rgba(0,140,237,0.15)', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.5rem' }}>
              <Link href={localizedPath(locale, '/')} style={{ color: '#4A5568', textDecoration: 'none' }}>{tt.navHome}</Link>
              <span>/</span>
              <Link href={localizedPath(locale, '/tools')} style={{ color: '#4A5568', textDecoration: 'none' }}>すべてのAI</Link>
              {tool.category && (
                <>
                  <span>/</span>
                  <Link href={localizedPath(locale, `/category/${tool.category.slug}`)} style={{ color: '#4A5568', textDecoration: 'none' }}>
                    {tool.category.name_ja}
                  </Link>
                </>
              )}
              <span>/</span>
              <span style={{ color: '#F0EBE1' }}>{name}</span>
            </nav>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {tool.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tool.logo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'Fira Sans, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#F0EBE1', textTransform: 'uppercase' }}>{initials}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                  {tool.status !== 'active' && (
                    <span style={{ background: '#374151', color: '#9CA3AF', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '2px' }}>{statusLabel()}</span>
                  )}
                  {tool.category && (
                    <Link href={localizedPath(locale, `/tools?cat=${tool.category.slug}`)} className="link-underline"
                      style={{ background: '#0F3D8C', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '2px', border: '1px solid #1A56DB', textDecoration: 'none' }}>
                      {tool.category.name_ja}
                    </Link>
                  )}
                </div>
                <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {name}
                </h1>
                {tagline && (() => {
                  const parts = tagline.split('。').map(s => s.trim()).filter(Boolean);
                  return parts.length > 1 ? (
                    <div>
                      <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1rem', color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>{parts[0]}</p>
                      <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.88rem', color: '#6B7280', margin: '2px 0 0 0', lineHeight: 1.6 }}>{parts[1]}</p>
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1rem', color: '#7A8A99', margin: 0 }}>{tagline.replace(/。/g, '')}</p>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* 本文 */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4" style={{ paddingTop: '2rem' }}>

          {/* 概要 + リンク + ニュース */}
          {(description || hasLinks || toolNews.length > 0) && (
            <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>

              {description && (
                <div className="mb-5">
                  <h2 className="font-display text-2xl tracking-tight mb-4">概要</h2>
                  <div className="prose prose-sm max-w-none text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{description.replace(/。\n/g, '\n').replace(/。/g, '')}</div>
                </div>
              )}

              {hasLinks && (
                <div className="mb-5">
                  <h2 className="section-label mb-3">リンク</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                    {officialUrl && (
                      <LinkBadge href={officialUrl} icon={<GlobeIcon />} topLabel="公式サイト" bottomLabel={officialDomain || 'Visit'} />
                    )}
                    {tool.ios_url && (
                      <LinkBadge href={tool.ios_url} icon={<AppleIcon />} topLabel="ダウンロード" bottomLabel="App Store" />
                    )}
                    {tool.android_url && (
                      <LinkBadge href={tool.android_url} icon={<GooglePlayIcon />} topLabel="ダウンロード" bottomLabel="Google Play" />
                    )}
                    {(tool.twitter_handle || tool.github_url) && (
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', alignItems: 'center' }}>
                        {tool.twitter_handle && <a href={`https://x.com/${tool.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="link-underline">X @{tool.twitter_handle}</a>}
                        {tool.github_url && <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="link-underline">GitHub</a>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {toolNews.length > 0 && (
                <div>
                  <h2 className="section-label mb-3">このツールのニュース</h2>
                  <div style={{ overflow: 'hidden', borderRadius: '4px', border: '1px solid rgba(0,140,237,0.08)' }}>
                    {toolNews.slice(0, 3).map((item, i) => {
                      const typeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
                      const badge = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;
                      return (
                        <Link key={item.id} href={localizedPath(locale, `/news/${item.slug}`)}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg)]"
                          style={{ borderBottom: i < Math.min(toolNews.length, 3) - 1 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none' }}>
                          <time style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: '#4A5568', whiteSpace: 'nowrap' }}>{item.published_at?.substring(0, 10)}</time>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap', border: `1px solid ${badge.border}` }}>{badge.ja}</span>
                          <span className="flex-1 text-sm truncate group-hover:text-[var(--color-accent)]" style={{ color: 'var(--color-text)' }}>{item.title_ja}</span>
                          <span style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>→</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Note紹介 + リリース履歴タブ */}
          <ToolMediaTabs
            noteArticles={noteArticles}
            locale={locale}
            launches={toolLaunches}
          toolName={name}
          />

          <AdSlot slot="in-content" />

          {(tool.demo_url || tool.video_url) && (
            <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
              <h2 className="font-display text-2xl tracking-tight mb-4">メディア</h2>
              <div className="flex flex-wrap gap-3">
                {tool.demo_url && <a href={tool.demo_url} target="_blank" rel="noopener noreferrer" className="btn-outline">デモを見る →</a>}
                {tool.video_url && <a href={tool.video_url} target="_blank" rel="noopener noreferrer" className="btn-outline">動画を見る →</a>}
              </div>
            </section>
          )}

          {tool.user_count_label && (
            <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
              <h2 className="section-label mb-2">ユーザー数</h2>
              <p className="font-display text-xl">{tool.user_count_label}</p>
            </section>
          )}

          <AdSlot slot="footer" />
        </div>

        {relatedTools.length > 0 && (
          <section className="bg-[var(--color-bg-sub)] border-t border-[var(--color-border)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="font-display text-2xl tracking-tight mb-6">{tt.secRelatedTools}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTools.slice(0, 6).map((related, i) => (
                  <ToolCard key={related.id} tool={related} locale={locale} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <script type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name,
          description: description || undefined,
          url: tool.official_url || undefined,
          applicationCategory: 'AIApplication',
        }) }}
      />
    </>
  );
}
