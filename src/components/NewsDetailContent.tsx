// src/components/NewsDetailContent.tsx
import Link from 'next/link';
import type { Locale, News, Tool } from '@/types';
import { t, localizedPath, formatDate } from '@/lib/i18n';
import AdSlot from './AdSlot';

interface NewsDetailContentProps {
  news: News;
  relatedTool: Tool | null;
  relatedNews: News[];
  locale: Locale;
}

export default function NewsDetailContent({ news, relatedTool, relatedNews, locale }: NewsDetailContentProps) {
  const tt = t[locale];
  const title = locale === 'ja' ? news.title_ja : news.title_en || news.title_ja;
  const body = locale === 'ja' ? news.body_ja : news.body_en || news.body_ja;

  return (
    <main className="flex-1">
      {/* パンくず */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Link href={localizedPath(locale, '/')} className="hover:text-[var(--color-text)]">
            {tt.navHome}
          </Link>
          <span>/</span>
          <Link href={localizedPath(locale, '/news')} className="hover:text-[var(--color-text)]">
            {tt.navNews}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text)] truncate">{title}</span>
        </nav>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="badge badge-outline uppercase tracking-wider">
            {newsTypeLabel(news.news_type, tt)}
          </span>
          <time className="text-xs font-mono text-[var(--color-text-muted)]">
            {formatDate(news.published_at, locale)}
          </time>
        </div>

        {/* タイトル */}
        <h1 className="hero-title text-3xl sm:text-4xl mb-6">{title}</h1>

        {/* 本文 */}
        {body && (
          <div className="text-base leading-relaxed text-[var(--color-text)] whitespace-pre-wrap mb-10">
            {body}
          </div>
        )}

        {/* 関連ツール */}
        {relatedTool && (
          <div className="mb-10 p-5 border border-[var(--color-border)] rounded-sm bg-[var(--color-bg-sub)]">
            <span className="section-label block mb-2">
              {locale === 'ja' ? '関連ツール' : 'Related tool'}
            </span>
            <Link href={localizedPath(locale, `/tool/${relatedTool.slug}`)} className="group flex items-center gap-3">
              <div className="shrink-0 w-12 h-12 rounded-sm bg-white border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                {relatedTool.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={relatedTool.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-sm">
                    {(locale === 'ja' ? relatedTool.name_ja : relatedTool.name_en).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base link-underline">
                  {locale === 'ja' ? relatedTool.name_ja : relatedTool.name_en}
                </p>
                {(locale === 'ja' ? relatedTool.tagline_ja : relatedTool.tagline_en) && (
                  <p className="text-sm text-[var(--color-text-sub)] truncate">
                    {locale === 'ja' ? relatedTool.tagline_ja : relatedTool.tagline_en}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]">→</span>
            </Link>
          </div>
        )}

        <AdSlot slot="in-content" className="my-10" />

        {/* 関連ニュース */}
        {relatedNews.length > 0 && (
          <section>
            <h2 className="section-label mb-4">{tt.secRelatedNews}</h2>
            <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {relatedNews.map((item) => (
                <Link key={item.id} href={localizedPath(locale, `/news/${item.slug}`)} className="group flex items-center gap-3 py-3">
                  <time className="shrink-0 text-xs font-mono text-[var(--color-text-muted)]">
                    {formatDate(item.published_at, locale)}
                  </time>
                  <span className="flex-1 text-sm font-medium truncate group-hover:text-[var(--color-accent)]">
                    {locale === 'ja' ? item.title_ja : item.title_en || item.title_ja}
                  </span>
                  <span className="shrink-0 text-[var(--color-text-muted)]">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 戻る */}
        <div className="mt-10">
          <Link href={localizedPath(locale, '/news')} className="link-underline text-sm font-bold">
            ← {tt.navNews}
          </Link>
        </div>
      </article>
    </main>
  );
}

function newsTypeLabel(type: string, tt: typeof t['ja']): string {
  switch (type) {
    case 'price_change': return tt.newsTypePriceChange;
    case 'new_tool':     return tt.newsTypeNewTool;
    case 'new_feature':  return tt.newsTypeNewFeature;
    default:             return tt.newsTypeOther;
  }
}
