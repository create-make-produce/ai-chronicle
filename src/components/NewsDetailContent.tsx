'use client';
// src/components/NewsDetailContent.tsx
import Link from 'next/link';
import type { Locale, News, Tool } from '@/types';
import { t, type TDict, localizedPath } from '@/lib/i18n';
import AdSlot from './AdSlot';

// NewsRow.tsx と同じバッジ定義（色・スタイルを統一）
const NEWS_TYPE_LABELS = {
  price_change: { ja: '価格改定',  en: 'Price Change', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)'  },
  new_tool:     { ja: '新機能',    en: 'New Feature',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  new_feature:  { ja: '新機能',    en: 'New Feature',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  other:        { ja: 'その他',    en: 'Other',        color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.3)' },
} as const;

// 時刻まで含むフォーマット（JST / UTC）
function formatDateTime(isoStr: string, locale: Locale): string {
  try {
    const raw = isoStr.includes('Z') ? isoStr : isoStr.replace(' ', 'T') + 'Z';
    const d = new Date(raw);
    const pad = (n: number) => String(n).padStart(2, '0');
    if (locale === 'ja') {
      const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日  ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())} JST`;
    } else {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}  ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
    }
  } catch {
    return isoStr?.slice(0, 10) ?? '';
  }
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
    <main className="flex-1" style={{ background: 'linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)' }}>

      {/* ━━━ ヒーローヘッダー ━━━ */}
      <div style={{
        position: 'relative', overflow: 'hidden', background: '#040912',
        borderBottom: '1px solid rgba(0,140,237,0.15)',
        paddingTop: '16px', paddingBottom: '24px',
      }}>
        {/* 背景：青い斜め帯 + ドット + 縦線 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '55%', height: '140%', background: 'linear-gradient(135deg, rgba(0,80,180,0.18) 0%, rgba(0,140,237,0.08) 100%)', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', top: '-20%', right: '15%', width: '2px', height: '140%', background: 'rgba(0,140,237,0.2)', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,140,237,0.12) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>

          {/* パンくず */}
          <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#4A5568", marginBottom: "1.25rem" }}>
            <Link href={localizedPath(locale, '/')}
              style={{ transition: 'color 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
              {tt.navHome}
            </Link>
            <span>/</span>
            <Link href={localizedPath(locale, '/news')}
              style={{ transition: 'color 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
              {tt.navNews}
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--color-text)' }} className="truncate">{title}</span>
          </nav>
          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#008CED', marginBottom: '0.5rem' }}>
            AI News
          </p>

          {/* バッジ ＋ 日時（TOPページ #AABBCC に統一） */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <span style={{
              fontFamily: 'Fira Sans, sans-serif',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: badge.color,
              background: badge.bg,
              padding: '3px 10px',
              borderRadius: '3px',
              border: `1px solid ${badge.border}`,
              letterSpacing: '0.05em',
            }}>
              {badgeLabel}
            </span>
            <time style={{
              fontFamily: 'Fira Sans, monospace',
              fontSize: '0.82rem',
              color: '#AABBCC',
              letterSpacing: '0.02em',
            }}>
              {dateTime}
            </time>
          </div>

          {/* タイトル */}
          <h1 style={{
            fontFamily: locale === 'ja' ? 'Noto Sans JP, sans-serif' : 'Fira Sans, sans-serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 900,
            lineHeight: 1.35,
            color: '#F0EBE1',
            margin: 0,
          }}>
            {title}
          </h1>

        </div>
      </div>

      {/* ━━━ 記事本文エリア ━━━ */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* 本文 */}
        {body && (
          <div style={{
            fontSize: '0.95rem',
            lineHeight: 1.95,
            color: 'var(--color-text)',
            whiteSpace: 'pre-wrap',
            marginBottom: '2.5rem',
          }}>
            {body}
          </div>
        )}

        {/* 関連ツール */}
        {relatedTool && (
          <div style={{
            marginBottom: '2.5rem',
            padding: '1.25rem',
            background: 'var(--color-bg-sub)',
            border: '1px solid var(--color-border)',
            borderLeft: `3px solid ${badge.color}`,
            borderRadius: '4px',
          }}>
            <span style={{
              display: 'block',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.85rem',
            }}>
              {locale === 'ja' ? '関連ツール' : 'Related Tool'}
            </span>
            <Link href={localizedPath(locale, `/tool/${relatedTool.slug}`)} className="group flex items-center gap-3" style={{ textDecoration: 'none' }}>
              <div style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: 4,
                background: '#fff', border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {relatedTool.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={relatedTool.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span className="font-display text-sm">
                    {(locale === 'ja' ? relatedTool.name_ja : relatedTool.name_en).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="link-underline" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', margin: 0 }}>
                  {locale === 'ja' ? relatedTool.name_ja : relatedTool.name_en}
                </p>
                {(locale === 'ja' ? relatedTool.tagline_ja : relatedTool.tagline_en) && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-sub)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {locale === 'ja' ? relatedTool.tagline_ja : relatedTool.tagline_en}
                  </p>
                )}
              </div>
              <span className="group-hover:text-[var(--color-accent)]"
                style={{ flexShrink: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', transition: 'color 0.12s' }}>→</span>
            </Link>
          </div>
        )}

        <AdSlot slot="in-content" className="my-10" />

        {/* 関連ニュース */}
        {relatedNews.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem',
            }}>
              {tt.secRelatedNews}
            </h2>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
              {relatedNews.map((item, idx) => {
                const itemTypeKey = (item.news_type ?? 'other') as keyof typeof NEWS_TYPE_LABELS;
                const itemBadge   = NEWS_TYPE_LABELS[itemTypeKey] ?? NEWS_TYPE_LABELS.other;
                return (
                  <Link
                    key={item.id}
                    href={localizedPath(locale, `/news/${item.slug}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '0.75rem 1rem', textDecoration: 'none',
                      borderBottom: idx < relatedNews.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,140,237,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <time style={{ flexShrink: 0, fontFamily: 'Fira Sans, monospace', fontSize: '0.75rem', color: '#AABBCC' }}>
                      {formatDateShort(item.published_at)}
                    </time>
                    <span style={{
                      flexShrink: 0, fontSize: '0.65rem', fontWeight: 700,
                      color: itemBadge.color, background: itemBadge.bg,
                      padding: '2px 7px', borderRadius: '3px', border: `1px solid ${itemBadge.border}`,
                    }}>
                      {locale === 'ja' ? itemBadge.ja : itemBadge.en}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {locale === 'ja' ? item.title_ja : item.title_en || item.title_ja}
                    </span>
                    <span style={{ flexShrink: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 戻るリンク */}
        <div>
          <Link href={localizedPath(locale, '/news')}
            className="link-underline text-sm font-bold"
            style={{ color: 'var(--color-accent)' }}>
            ← {tt.navNews}
          </Link>
        </div>
      </article>
    </main>
  );
}
