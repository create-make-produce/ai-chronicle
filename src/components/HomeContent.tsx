// src/components/HomeContent.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale, Tool, News } from '@/types';
import type { CategoryWithCount } from '@/lib/db';
import { t, type TDict, localizedPath, formatDateShort } from '@/lib/i18n';
import HeroSection from './HeroSection';
import CategoryGrid from './CategoryGrid';
import ToolCard from './ToolCard';
import AdSlot from './AdSlot';
import { formatPriceChange } from '@/lib/price';

interface HomeContentProps {
  locale: Locale;
  stats: { toolCount: number; newToday: number; recentlyUpdated: number };
  latestNews: News[];
  newTools: Tool[];
  categories: CategoryWithCount[];
  priceChanges: Array<{
    tool_slug: string; tool_name_ja: string; tool_name_en: string;
    plan_name: string; price_usd: number | null; previous_price_usd: number | null;
    price_trend: string | null; price_changed_at: string | null;
  }>;
}

export default function HomeContent(p: HomeContentProps) {
  const { locale, stats, latestNews, newTools, categories, priceChanges } = p;
  const tt = t[locale];

  return (
    <main className="flex-1">
      <HeroSection locale={locale} />
      <AdSlot slot="header" />

      {/* カテゴリ */}
      {categories.length > 0 && (
        <Sec bg="linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)" paddingBottom={64}>
          <SectionHead label={locale==='ja'?'AIカテゴリ':'AI Categories'} />
          <CategoryGrid categories={categories} locale={locale} />
        </Sec>
      )}

      {/* 最新ニュース */}
      {latestNews.length > 0 && (
        <Sec bg="linear-gradient(135deg, #0D1F3C 0%, #112240 60%, #0A1A35 100%)">
          <SectionHeadWithTime label={locale==='ja'?'最新ニュース':'Latest News'} isoTime={latestNews[0]?.published_at} locale={locale} />
          <div style={{ border:'1px solid var(--color-border)' }}>
            {latestNews.map((n) => (
              <Link key={n.id} href={localizedPath(locale, `/news/${n.slug}`)}
                className="group flex items-center gap-4 px-4 py-3 transition-colors"
                style={{ borderBottom:'1px solid var(--color-border)' }}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--color-bg-sub)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <time className="shrink-0 w-20 text-xs font-mono" style={{ color:'#AABBCC' }}>
                  {formatDateShort(n.published_at)}
                </time>
                <span className="shrink-0 badge badge-accent">{newsLabel(n.news_type, tt)}</span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color:'var(--color-text)' }}>
                  {locale==='ja' ? n.title_ja : n.title_en||n.title_ja}
                </span>
                <span className="shrink-0 text-xs font-bold transition-colors"
                  style={{ color:'var(--color-text-muted)' }}>→</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href={localizedPath(locale,'/news')}
              className="text-xs font-bold tracking-widest uppercase link-underline"
              style={{ color:'var(--color-accent)' }}>
              {tt.secViewAllNews} →
            </Link>
          </div>
        </Sec>
      )}

      {/* 最新アップデート */}
      {newTools.length > 0 && (
        <Sec bg="linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)">
          <SectionHead label={locale==='ja'?'最新アップデート':'LATEST UPDATES'} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {newTools.slice(0,6).map((tool,i) => (
              <ToolCard key={tool.id} tool={tool} locale={locale} index={i}
                categoryName={
                  tool.category_id
                    ? (categories.find(cat => cat.id === tool.category_id)
                        ? (locale === 'ja'
                            ? categories.find(cat => cat.id === tool.category_id)!.name_ja
                            : categories.find(cat => cat.id === tool.category_id)!.name_en)
                        : undefined)
                    : undefined
                }
                categorySlug={categories.find(cat => cat.id === tool.category_id)?.slug}
              />
            ))}
          </div>
          <div className="mt-5 text-right">
            <Link href={localizedPath(locale,'/monthly')}
              className="text-xs font-bold tracking-widest uppercase link-underline"
              style={{ color:'var(--color-accent)' }}>
              {tt.secSeeAll} →
            </Link>
          </div>
        </Sec>
      )}
    </main>
  );
}

/* ヘルパー */
function Sec({ children, dark, bg, paddingBottom }: { children: React.ReactNode; dark?: boolean; bg?: string; paddingBottom?: number }) {
  const background = bg ?? (dark ? 'var(--color-bg-sub)' : 'var(--color-bg)');
  return (
    <section style={{ background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: '8px', paddingBottom: paddingBottom ?? 16 }}>
        {children}
      </div>
    </section>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }}
      viewport={{ once:true }} transition={{ duration:0.3 }} className="mb-6">
      <h2 className="font-display text-2xl sm:text-3xl" style={{ color:'var(--color-text)' }}>
        {label}
      </h2>
      <div className="mt-2 h-px w-10" style={{ background:'var(--color-accent)' }} />
    </motion.div>
  );
}

function SectionHeadWithTime({ label, isoTime, locale }: { label: string; isoTime?: string | null; locale: Locale }) {
  const timestamp = (() => {
    if (!isoTime) return null;
    try {
      const d = new Date(isoTime.replace(' ', 'T') + 'Z');
      const pad = (n: number) => String(n).padStart(2, '0');
      if (locale === 'ja') {
        const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        return `${jst.getUTCFullYear()}/${pad(jst.getUTCMonth()+1)}/${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())} JST`;
      } else {
        return `${d.getUTCFullYear()}/${pad(d.getUTCMonth()+1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
      }
    } catch { return null; }
  })();
  return (
    <motion.div initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }}
      viewport={{ once:true }} transition={{ duration:0.3 }} className="mb-6">
      <div className="flex items-baseline gap-4">
        <h2 className="font-display text-2xl sm:text-3xl" style={{ color:'var(--color-text)' }}>
          {label}
        </h2>
        {timestamp && (
          <span className="text-xs font-mono" style={{ color:'#AABBCC' }}>
            {timestamp}
          </span>
        )}
      </div>
      <div className="mt-2 h-px w-10" style={{ background:'var(--color-accent)' }} />
    </motion.div>
  );
}

function newsLabel(type: string, tt: TDict): string {
  switch(type) {
    case 'price_change': return tt.newsTypePriceChange;
    case 'new_tool':     return tt.newsTypeNewTool;
    case 'new_feature':  return tt.newsTypeNewFeature;
    default:             return tt.newsTypeOther;
  }
}
