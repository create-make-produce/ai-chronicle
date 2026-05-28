'use client';
// src/components/NewsDetailContent.tsx
import Link from 'next/link';
import type { Locale, News, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import AdSlot from './AdSlot';
import PageHero from './PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

const NEWS_TYPE_LABELS = {
  price_change: { ja: '料金改定', en: 'Price Change', color: 'var(--color-news-price-change)', bg: 'var(--color-news-price-change-bg)', border: 'var(--color-news-price-change-border)' },
  new_tool:     { ja: '新ツール', en: 'New Tool',     color: 'var(--color-news-new-tool)',     bg: 'var(--color-news-new-tool-bg)',     border: 'var(--color-news-new-tool-border)'     },
  new_feature:  { ja: '新機能',   en: 'New Feature',  color: 'var(--color-news-new-feature)',  bg: 'var(--color-news-new-feature-bg)',  border: 'var(--color-news-new-feature-border)'  },
  other:        { ja: 'その他',   en: 'Other',        color: 'var(--color-news-other)',        bg: 'var(--color-news-other-bg)',        border: 'var(--color-news-other-border)'        },
} as const;

function formatDateTime(isoStr: string, locale: Locale): string {
  try {
    const raw = isoStr.includes('Z') ? isoStr : isoStr.replace(' ', 'T') + 'Z';
    const d   = new Date(raw);
    const pad = (n: number) => String(n).padStart(2, '0');
    if (locale === 'ja') {
      const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日  ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())} JST`;
    }
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}  ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  } catch { return isoStr?.slice(0, 10) ?? ''; }
}

function formatDateShort(isoStr: string): string {
  return isoStr?.slice(0, 10) ?? '';
}

interface NewsDetailContentProps {
  news: News;
  relatedTool: Tool | null;
  relatedNews: News[];
  locale: Locale;
}

export default function NewsDetailContent({ news, relatedTool, relatedNews, locale }: NewsDetailContentProps) {
  const tt = t[locale];
  const title = locale === 'ja' ? news.title_ja : news.title_en || news.title_ja;
  const body  = locale === 'ja' ? news.body_ja  : news.body_en  || news.body_ja;

  const typeKey    = (news.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
  const badge      = NEWS_TYPE_LABELS[typeKey] ?? NEWS_TYPE_LABELS.other;
  const badgeLabel = locale === 'ja' ? badge.ja : badge.en;
  const dateTime   = formatDateTime(news.published_at, locale);

  return (
    <main className="flex-1" style={{ background: 'var(--color-page-gradient)' }}>

      <PageHero
        theme={PAGE_THEMES.news}
        breadcrumbs={[
          { label: tt.navHome, href: localizedPath(locale, '/') },
          { label: tt.navNews, href: localizedPath(locale, '/news') },
          { label: title },
        ]}
        label="AI NEWS"
        watermark="NEWS"
      >
        {/* バッジ＋日時 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          {/* バッジ（固定テキスト → Fira Sans サブセット） */}
          <span style={{
            fontFamily:    'var(--font-fira), system-ui',
            fontSize:      '0.72rem',
            fontWeight:    700,
            color:         badge.color,
            background:    badge.bg,
            padding:       '3px 10px',
            borderRadius:  '3px',
            border:        `1px solid ${badge.border}`,
            letterSpacing: '0.05em',
          }}>
            {badgeLabel}
          </span>
          {/* 日時（固定文字セット → Fira Sans サブセット） */}
          <time style={{ fontFamily: 'var(--font-fira), system-ui', fontSize: '0.82rem', color: 'var(--color-text-timestamp)', letterSpacing: '0.02em' }}>
            {dateTime}
          </time>
        </div>

        {/* タイトル（動的コンテンツ → システムフォント） */}
        <h1 style={{
          fontFamily: 'var(--font-system)',
          fontSize:   'clamp(1.5rem, 3vw, 2.25rem)',
          fontWeight: 900,
          lineHeight: 1.35,
          color:      'var(--color-text)',
          margin:     0,
        }}>
          {title}
        </h1>
      </PageHero>

      {/* ━━━ 記事本文エリア ━━━ */}
      <article className="max-w-3xl mx-auto section-px py-10">
        {/* 本文（動的コンテンツ → システムフォント・body継承） */}
        {body && (
          <div style={{ fontSize: '0.95rem', lineHeight: 1.95, color: 'var(--color-text)', whiteSpace: 'pre-wrap', marginBottom: '2.5rem' }}>
            {body}
          </div>
        )}

        {/* 関連ツール */}
        {relatedTool && (
          <div style={{ marginBottom: '2.5rem', padding: '1.25rem', background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderLeft: `3px solid ${badge.color}`, borderRadius: '4px' }}>
            <Link href={localizedPath(locale, `/tool/${relatedTool.slug}`)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 4, background: '#fff', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {relatedTool.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={relatedTool.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    /* イニシャルは動的 → システムフォント */
                    <span style={{ fontFamily: 'var(--font-system)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'uppercase' }}>
                      {(locale === 'ja' ? relatedTool.name_ja : relatedTool.name_en).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* ツール名（動的 → システムフォント） */}
                  <p style={{ fontFamily: 'var(--font-system)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', margin: 0 }}>
                    {locale === 'ja' ? relatedTool.name_ja : relatedTool.name_en}
                  </p>
                  {(locale === 'ja' ? relatedTool.tagline_ja : relatedTool.tagline_en) && (
                    <p style={{ fontFamily: 'var(--font-system)', fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '3px 0 0' }}>
                      {locale === 'ja' ? relatedTool.tagline_ja : relatedTool.tagline_en}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {/* 固定テキスト → Fira Sans サブセット */}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-noto), sans-serif', letterSpacing: '0.05em' }}>
                  ツール情報確認
                </span>
              </div>
            </Link>
          </div>
        )}

        <AdSlot slot="in-content" className="my-10" />

        {/* 関連ニュース */}
        {relatedNews.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {tt.secRelatedNews}
            </h2>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', background: 'var(--color-bg)' }}>
              {relatedNews.map((item, idx) => {
                const itemTypeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
                const itemBadge   = NEWS_TYPE_LABELS[itemTypeKey] ?? NEWS_TYPE_LABELS.other;
                return (
                  <Link
                    key={item.id}
                    href={localizedPath(locale, `/news/${item.slug}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 1rem', textDecoration: 'none', borderBottom: idx < relatedNews.length - 1 ? '1px solid var(--color-border)' : 'none', borderLeft: `3px solid ${itemBadge.color}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* 日付（固定文字セット → Fira Sans サブセット） */}
                    <time style={{ flexShrink: 0, fontFamily: 'var(--font-fira), system-ui', fontSize: '0.75rem', color: 'var(--color-text-timestamp)' }}>
                      {formatDateShort(item.published_at)}
                    </time>
                    <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: itemBadge.color, background: itemBadge.bg, padding: '2px 7px', borderRadius: '3px', border: `1px solid ${itemBadge.border}` }}>
                      {locale === 'ja' ? itemBadge.ja : itemBadge.en}
                    </span>
                    {/* タイトル（動的 → システムフォント） */}
                    <span style={{ flex: 1, fontFamily: 'var(--font-system)', fontSize: '0.85rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {locale === 'ja' ? item.title_ja : item.title_en || item.title_ja}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div>
          <Link href={localizedPath(locale, '/news')} className="link-underline text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
            ニュース一覧に戻る
          </Link>
        </div>
      </article>
    </main>
  );
}
