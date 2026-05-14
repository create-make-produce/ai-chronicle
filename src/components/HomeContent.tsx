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
import NewsRow from './NewsRow';
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

      {/* 最新ニュース */}
      {latestNews.length > 0 && (
        <Sec bg="linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)" paddingBottom={24}>
          <SectionHeadWithTime label={locale==='ja'?'最新ニュース':'Latest News'} isoTime={latestNews[0]?.published_at} locale={locale} />
          <div style={{ border:'1px solid var(--color-border)', borderRadius:'4px', overflow:'hidden' }}>
            {latestNews.map((n, i) => (
              <NewsRow
                key={n.id}
                item={n as any}
                href={localizedPath(locale, `/news/${n.slug}`)}
                lang={locale}
                isLast={i === latestNews.length - 1}
              />
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href={localizedPath(locale,'/news')}
              className="text-xs font-bold tracking-widest uppercase link-underline"
              style={{ color:'var(--color-accent)' }}>
              {tt.secViewAllNews}
            </Link>
          </div>
        </Sec>
      )}

      {/* カテゴリ */}
      {categories.length > 0 && (
        <Sec bg="linear-gradient(135deg, #0D1F3C 0%, #112240 60%, #0A1A35 100%)">
          <SectionHead label={locale==='ja'?'AIカテゴリ':'AI Categories'} />
          <CategoryGrid categories={categories} locale={locale} />
        </Sec>
      )}

      {/* 最新アップデート */}
      {newTools.length > 0 && (
        <Sec bg="linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)">
          <SectionHead label={locale==='ja'?'月刊AIアップデート':'Monthly AI Updates'} />
          <ToolSlider tools={newTools.slice(0,12)} locale={locale} categories={categories} tt={tt} />
          <div className="mt-3 text-right">
            <Link href={localizedPath(locale,'/monthly')}
              className="text-xs font-bold tracking-widest uppercase link-underline"
              style={{ color:'var(--color-accent)' }}>
              {tt.secSeeAll}
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
        style={{ paddingTop: '24px', paddingBottom: paddingBottom ?? 24 }}>
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

const NEWS_TYPE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  price_change: { color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)' },
  new_tool:     { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  new_feature:  { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  other:        { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
};

function NewsBadge({ type, tt }: { type: string; tt: TDict }) {
  const s = NEWS_TYPE_STYLE[type] ?? NEWS_TYPE_STYLE.other;
  const label = newsLabel(type, tt);
  return (
    <span className="shrink-0" style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
      borderRadius: '3px', whiteSpace: 'nowrap' as const,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>{label}</span>
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

import { useRef, useState, useCallback } from 'react';

function ToolSlider({ tools, locale, categories, tt }: {
  tools: Tool[];
  locale: Locale;
  categories: CategoryWithCount[];
  tt: TDict;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const cardW = 300 + 16; // width + gap

  const [scrollRatio, setScrollRatio] = useState(0);

  const onScroll = useCallback(() => {
    if (!sliderRef.current) return;
    const el = sliderRef.current;
    const ratio = el.scrollLeft / (el.scrollWidth - el.clientWidth);
    setScrollRatio(isNaN(ratio) ? 0 : ratio);
    const idx = Math.round(el.scrollLeft / cardW);
    setActiveIdx(Math.min(idx, tools.length - 1));
  }, [tools.length, cardW]);

  const scrollTo = (idx: number) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollTo({ left: idx * cardW, behavior: 'smooth' });
    setActiveIdx(idx);
  };

  return (
    <div>
      <style>{`
        #tool-slider::-webkit-scrollbar { height: 8px; cursor: pointer; }
        #tool-slider::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
        #tool-slider::-webkit-scrollbar-thumb { background: #008CED; border-radius: 4px; max-width: 60px; }
        #tool-slider::-webkit-scrollbar-thumb:hover { background: #33AAFF; }
        @media (max-width: 767px) {
          .tool-slider-card { width: calc(82vw) !important; }
        }
      `}</style>
      <div style={{ position: 'relative' }}>
        <div id="tool-slider" ref={sliderRef} onScroll={onScroll} style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '16px',
          marginBottom: '8px',
          WebkitOverflowScrolling: 'touch' as any,
        }}>
          {tools.map((tool, i) => (
            <div key={tool.id} className="tool-slider-card" style={{ flexShrink: 0, width: '320px' }}>
            <ToolCard tool={tool} locale={locale} index={i}
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
            </div>
          ))}
        </div>
        {/* スマホのみ右端グラデーション */}
        <div className="tool-slider-fade" style={{
          position: 'absolute', top: 0, right: 0, bottom: '24px',
          width: '60px', pointerEvents: 'none',
          background: 'linear-gradient(to right, transparent, rgba(4,9,18,0.6))',
        }} />
      </div>
    </div>
  );
}
