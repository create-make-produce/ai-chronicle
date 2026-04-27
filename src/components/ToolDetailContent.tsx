// src/components/ToolDetailContent.tsx
import Link from 'next/link';
import type { Locale, ToolWithPlans, Tool, News } from '@/types';
import { t, localizedPath, formatDate } from '@/lib/i18n';
import PriceTable from './PriceTable';
import SpecTable from './SpecTable';
import ToolCard from './ToolCard';
import AdSlot from './AdSlot';

interface ToolDetailContentProps {
  tool: ToolWithPlans;
  relatedTools: Tool[];
  locale: Locale;
  toolNews?: News[];
}

const NEWS_TYPE_LABELS = {
  price_change: { ja: '価格改定', en: 'Price Change', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
  new_tool:     { ja: '新リリース', en: 'New Release', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  new_feature:  { ja: '新機能', en: 'New Feature', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  other:        { ja: 'その他', en: 'Other', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
} as const;

function isProductHuntUrl(url: string): boolean {
  return url.includes('producthunt.com');
}

export default function ToolDetailContent({ tool, relatedTools, locale, toolNews = [] }: ToolDetailContentProps) {
  const tt = t[locale];
  const name = locale === 'ja' ? tool.name_ja : tool.name_en;
  const tagline = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const description = locale === 'ja' ? tool.description_ja : tool.description_en;
  const ctaUrl = tool.has_affiliate === 1 && tool.affiliate_url ? tool.affiliate_url : tool.official_url;
  const initials = name.slice(0, 2).toUpperCase();

  // 公式URLがProduct HuntのURLの場合は表示しない
  const officialUrl = tool.official_url && !isProductHuntUrl(tool.official_url) ? tool.official_url : null;
  const ctaUrlClean = tool.has_affiliate === 1 && tool.affiliate_url
    ? tool.affiliate_url
    : officialUrl;

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
        {/* パンくず */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <nav className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Link href={localizedPath(locale, '/')} className="hover:text-[var(--color-text)]">{tt.navHome}</Link>
            <span>/</span>
            <Link href={localizedPath(locale, '/tools')} className="hover:text-[var(--color-text)]">{tt.navTools}</Link>
            {tool.category && (
              <>
                <span>/</span>
                <Link href={localizedPath(locale, `/category/${tool.category.slug}`)} className="hover:text-[var(--color-text)]">
                  {locale === 'ja' ? tool.category.name_ja : tool.category.name_en}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[var(--color-text)]">{name}</span>
          </nav>
        </div>

        {/* ヘッダー */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* ロゴ */}
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-[var(--color-bg-sub)] flex items-center justify-center overflow-hidden border border-[var(--color-border)]">
              {tool.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tool.logo_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl tracking-tight">{initials}</span>
              )}
            </div>

            {/* タイトル */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge badge-outline uppercase tracking-wider">{statusLabel()}</span>
                {tool.has_free_plan === 1 && <span className="badge badge-free">{tt.badgeFreePlan}</span>}
                {tool.category && (
                  <Link href={localizedPath(locale, `/category/${tool.category.slug}`)} className="badge badge-outline link-underline">
                    {locale === 'ja' ? tool.category.name_ja : tool.category.name_en}
                  </Link>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-5xl tracking-tight mb-2">{name}</h1>
              {tagline && <p className="text-base sm:text-lg text-[var(--color-text-sub)]">{tagline}</p>}
            </div>

            {/* CTA（右上） */}
            {ctaUrlClean && (
              <div className="shrink-0 flex flex-col items-end gap-1">
                <a href={ctaUrlClean} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary">
                  {tt.ctaVisitSite} →
                </a>
                {tool.has_affiliate === 1 && (
                  <span className="text-[10px] text-[var(--color-text-muted)]">{tt.ctaAffiliateNote}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 本文（フルwidth・1カラム） */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">

          {/* 概要 */}
          {description && (
            <section>
              <h2 className="section-label mb-3">{locale === 'ja' ? '概要' : 'Overview'}</h2>
              <div className="prose prose-sm max-w-none text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            </section>
          )}

          {/* このツールのニュース */}
          {toolNews.length > 0 && (
            <section>
              <h2 className="section-label mb-3">{locale === 'ja' ? 'このツールのニュース' : 'News'}</h2>
              <div style={{ background: 'var(--color-bg-sub)', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                {toolNews.map((item, i) => {
                  const typeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
                  const badge = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;
                  const badgeLabel = locale === 'ja' ? badge.ja : badge.en;
                  const title = locale === 'ja' ? item.title_ja : (item.title_en || item.title_ja);
                  return (
                    <Link
                      key={item.id}
                      href={localizedPath(locale, `/news/${item.slug}`)}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg)]"
                      style={{ borderBottom: i < toolNews.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <time style={{ fontFamily: 'Fira Sans, monospace', fontSize: '0.78rem', color: '#4A5568', whiteSpace: 'nowrap' }}>
                        {item.published_at?.substring(0, 10)}
                      </time>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap', border: `1px solid ${badge.color}30` }}>
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
            </section>
          )}

          {/* 料金プラン */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl tracking-tight">
                {locale === 'ja' ? '料金プラン' : 'Pricing'}
              </h2>
              {tool.last_price_checked_at && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  {tt.priceLastChecked}: {formatDate(tool.last_price_checked_at, locale)}
                </span>
              )}
            </div>
            <PriceTable plans={tool.plans} locale={locale} lastCheckedAt={tool.last_price_checked_at} />
          </section>

          <AdSlot slot="in-content" />

          {/* スペック */}
          <section>
            <h2 className="font-display text-2xl tracking-tight mb-4">
              {locale === 'ja' ? 'スペック' : 'Specifications'}
            </h2>
            <SpecTable tool={tool} locale={locale} />
          </section>

          {/* メディア */}
          {(tool.demo_url || tool.video_url) && (
            <section>
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

          {/* 公式リンク（一番下） */}
          {(officialUrl || tool.twitter_handle || tool.github_url || tool.product_hunt_url) && (
            <section>
              <h2 className="font-display text-2xl tracking-tight mb-4">
                {locale === 'ja' ? 'リンク' : 'Links'}
              </h2>
              <div className="border border-[var(--color-border)] rounded-sm p-4">
                <ul className="flex flex-wrap gap-4 text-sm">
                  {officialUrl && (
                    <li>
                      <a href={officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="link-underline">
                        {locale === 'ja' ? '公式サイト' : 'Website'} ↗
                      </a>
                    </li>
                  )}
                  {tool.twitter_handle && (
                    <li>
                      <a href={`https://x.com/${tool.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="link-underline">
                        X @{tool.twitter_handle}
                      </a>
                    </li>
                  )}
                  {tool.github_url && (
                    <li>
                      <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="link-underline">
                        GitHub ↗
                      </a>
                    </li>
                  )}
                  {tool.product_hunt_url && (
                    <li>
                      <a href={tool.product_hunt_url} target="_blank" rel="noopener noreferrer" className="link-underline">
                        Product Hunt ↗
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </section>
          )}

          {tool.user_count_label && (
            <section>
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

      {/* JSON-LD */}
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
