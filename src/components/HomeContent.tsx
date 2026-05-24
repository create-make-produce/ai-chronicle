// src/components/HomeContent.tsx
'use client';
import Link from 'next/link';
import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Locale, Tool, News } from '@/types';
import type { CategoryWithCount, CategoryNoteArticles } from '@/lib/db';
import { t, type TDict, localizedPath } from '@/lib/i18n';
import HeroSection from './HeroSection';
import CategoryGrid from './CategoryGrid';
import ToolCard from './ToolCard';
import AdSlot from './AdSlot';
import NewsRow from './NewsRow';

interface HomeContentProps {
  locale: Locale;
  stats: { toolCount: number; newToday: number; recentlyUpdated: number };
  latestNews: News[];
  newTools: Tool[];
  categories: CategoryWithCount[];
  categoryNotes?: CategoryNoteArticles[];
  priceChanges: Array<{
    tool_slug: string; tool_name_ja: string; tool_name_en: string;
    plan_name: string; price_usd: number | null; previous_price_usd: number | null;
    price_trend: string | null; price_changed_at: string | null;
  }>;
}

export default function HomeContent(p: HomeContentProps) {
  const { locale, latestNews, newTools, categories, categoryNotes = [] } = p;
  const tt = t[locale];

  return (
    <main className="flex-1">
      <HeroSection locale={locale} />
      <AdSlot slot="header" />

      {/* 最新ニュース */}
      {latestNews.length > 0 && (
        <Sec bg="var(--color-page-gradient)" paddingBottom={24}>
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
        <Sec bg="var(--color-cat-gradient)">
          <SectionHead label={locale==='ja'?'AIカテゴリ':'AI Categories'} />
          <CategoryGrid categories={categories} locale={locale} />
        </Sec>
      )}

      {/* 最新アップデート */}
      {newTools.length > 0 && (
        <Sec bg="var(--color-page-gradient)">
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

      {/* 注目のNote記事（カテゴリ別） */}
      {categoryNotes.length > 0 && (
        <Sec bg="var(--color-cat-gradient)">
          <SectionHead label="注目のNote記事" />
          <style>{`
            .note-slider::-webkit-scrollbar { height: 8px; cursor: pointer; }
            .note-slider::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .note-slider::-webkit-scrollbar-thumb { background: #008CED; border-radius: 4px; }
            .note-slider::-webkit-scrollbar-thumb:hover { background: #33AAFF; }
            @media (max-width: 767px) { .note-card { width: 60vw !important; } }
          `}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {categoryNotes.filter(cat => cat.articles.length >= 6).map(cat => (
              <div key={cat.category_id}>
                {/* カテゴリバッジ */}
                <div style={{ marginBottom: '12px' }}>
                  <CategoryBadge
                    slug={cat.category_slug}
                    nameJa={cat.category_name_ja}
                    nameEn={cat.category_name_en}
                  />
                </div>
                {/* スライダー */}
                <div className="note-slider" style={{
                  display: 'flex', gap: '12px', overflowX: 'auto', overflowY: 'hidden',
                  paddingBottom: '10px', WebkitOverflowScrolling: 'touch' as any,
                }}>
                  {cat.articles.map(article => (
                    <a key={article.id} className="note-card"
                      href={article.note_url} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }}>
                      {/* サムネ */}
                      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '6px',
                        overflow: 'hidden', marginBottom: '8px',
                        background: 'var(--color-border)' }}>
                        <img src={article.thumbnail_url} alt={article.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          loading="lazy" />
                      </div>
                      {/* タイトル */}
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text)', lineHeight: 1.5,
                        margin: 0, overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {article.title}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Sec>
      )}
    </main>
  );
}

function Sec({ children, bg, paddingBottom }: { children: React.ReactNode; bg?: string; paddingBottom?: number }) {
  return (
    <section style={{ background: bg ?? 'var(--color-page-gradient)' }}>
      <div className="max-w-7xl mx-auto section-px"
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
          <span className="text-xs font-mono" style={{ color:'var(--color-text-timestamp)' }}>
            {timestamp}
          </span>
        )}
      </div>
      <div className="mt-2 h-px w-10" style={{ background:'var(--color-accent)' }} />
    </motion.div>
  );
}

function ToolSlider({ tools, locale, categories, tt }: {
  tools: Tool[];
  locale: Locale;
  categories: CategoryWithCount[];
  tt: TDict;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const cardW = 300 + 16;

  const onScroll = useCallback(() => {
    if (!sliderRef.current) return;
    const el = sliderRef.current;
    const idx = Math.round(el.scrollLeft / cardW);
    setActiveIdx(Math.min(idx, tools.length - 1));
  }, [tools.length, cardW]);

  return (
    <div>
      <style>{`
        #tool-slider::-webkit-scrollbar { height: 8px; cursor: pointer; }
        #tool-slider::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
        #tool-slider::-webkit-scrollbar-thumb { background: #008CED; border-radius: 4px; }
        #tool-slider::-webkit-scrollbar-thumb:hover { background: #33AAFF; }
        @media (max-width: 767px) {
          .tool-slider-card { width: calc(72vw) !important; }
        }
      `}</style>
      <div>
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
      </div>
    </div>
  );
}

const CAT_ICON_FILE: Record<string, string> = {
  'text-generation':  'cat-text.png',
  'image-generation': 'cat-image.png',
  'coding':           'cat-coding.png',
  'audio':            'cat-audio.png',
  'productivity':     'cat-productivity.png',
  'research':         'cat-research.png',
  'marketing':        'cat-marketing.png',
  'other':            'cat-other.png',
};

function CategoryBadge({ slug, nameJa, nameEn }: { slug: string; nameJa: string; nameEn: string }) {
  const DARK  = '#0A1628';
  const BLUE1 = '#005BBB';
  const BLUE2 = '#008CED';
  const iconFile = CAT_ICON_FILE[slug];
  const L = { position: 'absolute' as const, background: BLUE2 };
  const R = { position: 'absolute' as const, background: '#FFFFFF' };

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: DARK, border: '1px solid #1A3860', borderRadius: '3px',
      height: '38px', width: '140px',
    }}>
      {/* 青グラデ三角 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${BLUE1}, ${BLUE2})`,
        clipPath: 'polygon(55% 0%, 100% 0%, 100% 100%, 42% 100%)',
      }} />
      {/* //// */}
      <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: '0.45rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em' }}>
        ////
      </div>
      {/* アイコン（左端） */}
      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {iconFile ? (
          <img src={`/icons/${iconFile}`} alt={nameEn} style={{ width: '22px', height: '22px', objectFit: 'fill' }} />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
          </svg>
        )}
      </div>
      {/* 日本語テキスト（アイコン右） */}
      <div style={{ position: 'absolute', left: 40, top: 0, bottom: 0, right: '42%', display: 'flex', alignItems: 'center' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', lineHeight: 1, margin: 0, textShadow: '1px 1px 4px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
          {nameJa}
        </p>
      </div>
      {/* HUDコーナー */}
      <div style={{ ...L, top:0, left:0, width:8, height:2 }} />
      <div style={{ ...L, top:0, left:0, width:2, height:8 }} />
      <div style={{ ...R, top:0, right:0, width:8, height:2 }} />
      <div style={{ ...R, top:0, right:0, width:2, height:8 }} />
      <div style={{ ...L, bottom:0, left:0, width:8, height:2 }} />
      <div style={{ ...L, bottom:0, left:0, width:2, height:8 }} />
      <div style={{ ...R, bottom:0, right:0, width:8, height:2 }} />
      <div style={{ ...R, bottom:0, right:0, width:2, height:8 }} />
    </div>
  );
}
