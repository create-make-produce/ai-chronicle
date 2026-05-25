// src/components/HomeContent.tsx
'use client';
import Link from 'next/link';
import { useRef, useState, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
          {/* 1件目：大きなカード */}
          <NewsCardTop item={latestNews[0] as any} href={localizedPath(locale, `/news/${latestNews[0].slug}`)} lang={locale} />
          {/* 2件目以降：左アクセントライン付きリスト */}
          {latestNews.length > 1 && (
            <div style={{ border:'1px solid var(--color-border)', borderRadius:'4px', overflow:'hidden', marginTop:'12px' }}>
              {latestNews.slice(1).map((n, i) => (
                <NewsRow
                  key={n.id}
                  item={n as any}
                  href={localizedPath(locale, `/news/${n.slug}`)}
                  lang={locale}
                  isLast={i === latestNews.length - 2}
                />
              ))}
            </div>
          )}
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
          <CategorySectionHead
            label={locale==='ja'?'AIカテゴリ':'AI Categories'}
            locale={locale}
          />
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

// ── 最新ニュース1件目：大きなカード ──
function NewsCardTop({ item, href, lang }: {
  item: {
    id: string; slug: string; title_ja: string; title_en?: string;
    news_type: string; published_at: string;
    tool_name_ja?: string; tool_name_en?: string; tool_logo_url?: string;
  };
  href: string;
  lang: 'ja' | 'en';
}) {
  const [hovered, setHovered] = useState(false);

  const NEWS_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
    new_tool:     { color:'var(--color-news-new-tool)',     bg:'var(--color-news-new-tool-bg)',     border:'var(--color-news-new-tool-border)',     label: lang==='en'?'New Tool':'新ツール' },
    new_feature:  { color:'var(--color-news-new-feature)',  bg:'var(--color-news-new-feature-bg)',  border:'var(--color-news-new-feature-border)',  label: lang==='en'?'New Feature':'新機能' },
    price_change: { color:'var(--color-news-price-change)', bg:'var(--color-news-price-change-bg)', border:'var(--color-news-price-change-border)', label: lang==='en'?'Price Change':'料金改定' },
    other:        { color:'var(--color-news-other)',        bg:'var(--color-news-other-bg)',        border:'var(--color-news-other-border)',        label: lang==='en'?'Other':'その他' },
  };

  const typeKey = item.news_type ?? 'other';
  const badge = NEWS_COLORS[typeKey] ?? NEWS_COLORS.other;
  const title = lang === 'en' ? (item.title_en || item.title_ja) : item.title_ja;
  const toolName = lang === 'en' ? item.tool_name_en : item.tool_name_ja;
  const logoUrl = item.tool_logo_url ?? null;

  const date = (() => {
    try {
      const raw = item.published_at?.includes('Z') ? item.published_at : item.published_at?.replace(' ','T')+'Z';
      const d = new Date(raw);
      const jst = new Date(d.getTime() + 9*60*60*1000);
      const pad = (n: number) => String(n).padStart(2,'0');
      return `${jst.getUTCFullYear()}/${pad(jst.getUTCMonth()+1)}/${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
    } catch { return item.published_at?.substring(0,10) ?? ''; }
  })();

  return (
    <Link href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'block',
        textDecoration: 'none',
        borderTop:      '1px solid var(--color-border)',
        borderRight:    '1px solid var(--color-border)',
        borderBottom:   '1px solid var(--color-border)',
        borderLeft:     `4px solid ${badge.color}`,
        borderRadius:   '4px',
        padding:        '16px 20px',
        background:     hovered ? 'var(--color-row-hover)' : 'transparent',
        transition:     'all 0.15s',
      }}>
      {/* バッジ＋日時 */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
        <span style={{
          fontSize:'0.7rem', fontWeight:700,
          color: badge.color, background: badge.bg,
          border: `1px solid ${badge.border}`,
          padding:'2px 8px', borderRadius:'3px',
        }}>{badge.label}</span>
        <span style={{ fontSize:'0.75rem', color:'var(--color-text-timestamp)', fontFamily:'Fira Sans, monospace' }}>
          {date}
        </span>
      </div>
      {/* ツール情報（タイトルより上） */}
      {toolName && (
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={toolName}
              style={{ width:'18px', height:'18px', borderRadius:'3px', objectFit:'contain' }} />
          )}
          <span style={{ fontSize:'0.82rem', color:'var(--color-text-sub)', fontWeight:600 }}>{toolName}</span>
        </div>
      )}
      {/* タイトル */}
      <p style={{
        fontFamily: lang==='en' ? 'Inter, sans-serif' : 'Noto Sans JP, sans-serif',
        fontSize:   '1.05rem',
        fontWeight: 700,
        color:      'var(--color-text)',
        margin:     0,
        lineHeight: 1.5,
      }}>{title}</p>
    </Link>
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

function CategorySectionHead({ label, locale }: { label: string; locale: Locale }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(locale === 'ja' ? `/tools?q=${encodeURIComponent(q)}` : `/en/tools?q=${encodeURIComponent(q)}`);
  };
  return (
    <motion.div initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }}
      viewport={{ once:true }} transition={{ duration:0.3 }}
      className="cat-header-layout">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl" style={{ color:'var(--color-text)' }}>
          {label}
        </h2>
        <div className="mt-2 h-px w-10" style={{ background:'var(--color-accent)' }} />
      </div>
      <div className="cat-header-search">
        <form onSubmit={handleSearch} style={{ display:'flex' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={locale === 'ja' ? 'ツール名・機能・用途で検索...' : 'Search by name, feature...'}
            style={{
              flex:'1', fontFamily:'var(--font-noto), sans-serif', fontSize:'0.875rem',
              padding:'10px 14px', background:'var(--color-bg)',
              border:'1px solid var(--color-border-mid)', borderRight:'none',
              borderRadius:'3px 0 0 3px', color:'var(--color-text)', outline:'none',
              transition:'border-color 180ms ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-mid)'}
          />
          <button type="submit" style={{
            padding:'10px 18px', background:'transparent',
            border:'1px solid var(--color-accent)', borderRadius:'0 3px 3px 0',
            color:'var(--color-accent)', fontFamily:'var(--font-fira), system-ui',
            fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.1em',
            textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap',
            transition:'all 180ms ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)'; }}
          >
            {locale === 'ja' ? '検索' : 'Search'}
          </button>
        </form>
      </div>
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
