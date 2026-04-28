// src/components/ToolDetailContent.tsx
import Link from 'next/link';
import type { Locale, ToolWithPlans, Tool, News } from '@/types';
import { t, localizedPath, formatDate } from '@/lib/i18n';
import PriceTable from './PriceTable';
import ToolCard from './ToolCard';
import AdSlot from './AdSlot';

interface ToolDetailContentProps {
  tool: ToolWithPlans;
  relatedTools: Tool[];
  locale: Locale;
  toolNews?: News[];
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

export default function ToolDetailContent({ tool, relatedTools, locale, toolNews = [] }: ToolDetailContentProps) {
  const tt = t[locale];
  const name = locale === 'ja' ? tool.name_ja : tool.name_en;
  const tagline = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const description = locale === 'ja' ? tool.description_ja : tool.description_en;

  const officialUrl = tool.official_url && !isProductHuntUrl(tool.official_url) ? tool.official_url : null;
  const ctaUrlClean = tool.has_affiliate === 1 && tool.affiliate_url ? tool.affiliate_url : officialUrl;

  const initials = name.slice(0, 2).toUpperCase();

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

        {/* ヘッダーセクション - TOPページのニュースセクションと同じ背景 */}
        <section style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #112240 60%, #0A1A35 100%)', borderBottom: '1px solid rgba(0,140,237,0.15)', padding: '2rem 1.5rem 2rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* パンくず */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.5rem' }}>
              <Link href={localizedPath(locale, '/')} style={{ color: '#4A5568', textDecoration: 'none' }}>{tt.navHome}</Link>
              <span>/</span>
              <Link href={localizedPath(locale, '/tools')} style={{ color: '#4A5568', textDecoration: 'none' }}>{locale === 'ja' ? 'すべてのAI' : 'All AI Tools'}</Link>
              {tool.category && (
                <>
                  <span>/</span>
                  <Link href={localizedPath(locale, `/category/${tool.category.slug}`)} style={{ color: '#4A5568', textDecoration: 'none' }}>
                    {locale === 'ja' ? tool.category.name_ja : tool.category.name_en}
                  </Link>
                </>
              )}
              <span>/</span>
              <span style={{ color: '#F0EBE1' }}>{name}</span>
            </nav>

            {/* ツール情報 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1.5rem' }}>
              {/* ロゴ */}
              <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {tool.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tool.logo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'Fira Sans, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#F0EBE1', textTransform: 'uppercase' }}>{initials}</span>
                )}
              </div>

              {/* タイトル・バッジ */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                  {tool.status !== 'active' && (
                    <span style={{ background: '#374151', color: '#9CA3AF', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '2px' }}>
                      {statusLabel()}
                    </span>
                  )}
                  {tool.has_free_plan === 1 && (
                    <span style={{ background: '#1A56DB', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '2px' }}>
                      {locale === 'ja' ? '無料プラン' : 'FREE'}
                    </span>
                  )}
                  {tool.category && (
                    <Link href={localizedPath(locale, `/tools?cat=${tool.category.slug}`)}
                      className="link-underline"
                      style={{ background: '#0F3D8C', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '2px', border: '1px solid #1A56DB', textDecoration: 'none' }}>
                      {locale === 'ja' ? tool.category.name_ja : tool.category.name_en}
                    </Link>
                  )}
                </div>
                <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {name}
                </h1>
                {tagline && (
                  <p style={{ fontFamily: locale === 'ja' ? 'Noto Sans JP, sans-serif' : 'Inter, sans-serif', fontSize: '1rem', color: '#7A8A99', margin: 0 }}>
                    {tagline}
                  </p>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* 本文 */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4" style={{ paddingTop: '2rem' }}>

          {/* 概要 + リンク + ニュース（統合パネル） */}
          {(description || officialUrl || tool.twitter_handle || tool.github_url || tool.product_hunt_url || toolNews.length > 0) && (
            <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
              {/* 概要 */}
              {description && (
                <div className="mb-5">
                  <h2 className="font-display text-2xl tracking-tight mb-4">{locale === 'ja' ? '概要' : 'Overview'}</h2>
                  <div className="prose prose-sm max-w-none text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                    {description}
                  </div>
                </div>
              )}

              {/* リンク */}
              {(officialUrl || tool.twitter_handle || tool.github_url || tool.product_hunt_url) && (
                <div className="mb-5">
                  <h2 className="section-label mb-3">{locale === 'ja' ? 'リンク' : 'Links'}</h2>
                  <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', listStyle: 'none', margin: 0, padding: 0, fontSize: '0.88rem' }}>
                    {officialUrl && (
                      <li><a href={officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="link-underline">{locale === 'ja' ? '公式サイト' : 'Website'}</a></li>
                    )}
                    {tool.twitter_handle && (
                      <li><a href={`https://x.com/${tool.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="link-underline">X @{tool.twitter_handle}</a></li>
                    )}
                    {tool.github_url && (
                      <li><a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="link-underline">GitHub</a></li>
                    )}
                    {tool.product_hunt_url && (
                      <li><a href={tool.product_hunt_url} target="_blank" rel="noopener noreferrer" className="link-underline">Product Hunt</a></li>
                    )}
                  </ul>
                </div>
              )}

              {/* このツールのニュース（最新3件） */}
              {toolNews.length > 0 && (
                <div>
                  <h2 className="section-label mb-3">{locale === 'ja' ? 'このツールのニュース' : 'News'}</h2>
                  <div style={{ overflow: 'hidden', borderRadius: '4px', border: '1px solid rgba(0,140,237,0.08)' }}>
                    {toolNews.slice(0, 3).map((item, i) => {
                      const typeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
                      const badge = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;
                      const badgeLabel = locale === 'ja' ? badge.ja : badge.en;
                      const title = locale === 'ja' ? item.title_ja : (item.title_en || item.title_ja);
                      return (
                        <Link
                          key={item.id}
                          href={localizedPath(locale, `/news/${item.slug}`)}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg)]"
                          style={{ borderBottom: i < Math.min(toolNews.length, 3) - 1 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none' }}
                        >
                          <time style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: '#4A5568', whiteSpace: 'nowrap' }}>
                            {item.published_at?.substring(0, 10)}
                          </time>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap', border: `1px solid ${badge.border}` }}>
                            {badgeLabel}
                          </span>
                          <span className="flex-1 text-sm truncate group-hover:text-[var(--color-accent)]" style={{ color: 'var(--color-text)' }}>
                            {title}
                          </span>
                          <span style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>→</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 料金プラン - PRICING_DISABLED
          <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl tracking-tight">
                {locale === 'ja' ? '料金プラン' : 'Pricing'}
              </h2>
            </div>
            <PriceTable plans={tool.plans} locale={locale} lastCheckedAt={tool.last_price_checked_at} />
          </section>
          PRICING_DISABLED */}

          <AdSlot slot="in-content" />

          {/* メディア */}
          {(tool.demo_url || tool.video_url) && (
            <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
              <h2 className="font-display text-2xl tracking-tight mb-4">
                {locale === 'ja' ? 'メディア' : 'Media'}
              </h2>
              <div className="flex flex-wrap gap-3">
                {tool.demo_url && (
                  <a href={tool.demo_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    {locale === 'ja' ? 'デモを見る' : 'View demo'} →
                  </a>
                )}
                {tool.video_url && (
                  <a href={tool.video_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    {locale === 'ja' ? '動画を見る' : 'Watch video'} →
                  </a>
                )}
              </div>
            </section>
          )}



          {tool.user_count_label && (
            <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
              <h2 className="section-label mb-2">{locale === 'ja' ? 'ユーザー数' : 'Users'}</h2>
              <p className="font-display text-xl">{tool.user_count_label}</p>
            </section>
          )}

          <AdSlot slot="footer" />
        </div>

        {/* 関連ツール */}
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

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(tool, locale)) }}
      />
    </>
  );
}

function buildJsonLd(tool: ToolWithPlans, locale: Locale) {
  const name = locale === 'ja' ? tool.name_ja : tool.name_en;
  const description = locale === 'ja' ? tool.description_ja : tool.description_en;
  const firstPaidPlan = tool.plans.find((p) => p.is_free !== 1 && p.price_usd != null);
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description: description || undefined,
    url: tool.official_url || undefined,
    applicationCategory: 'AIApplication',
    ...(firstPaidPlan?.price_usd != null && {
      offers: { '@type': 'Offer', price: firstPaidPlan.price_usd, priceCurrency: 'USD' },
    }),
  };
}
