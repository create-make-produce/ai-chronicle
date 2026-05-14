// src/components/CategoryGrid.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';
import type { CategoryWithCount } from '@/lib/db';

const ICON_FILE: Record<string, string> = {
  'text-generation':  'cat-text.png',
  'image-generation': 'cat-image.png',
  'video-generation': 'cat-video.png',
  'coding':           'cat-coding.png',
  'audio':            'cat-audio.png',
  'data-analysis':    'cat-data.png',
  'productivity':     'cat-productivity.png',
  'other':            'cat-other.png',
};

function FallbackIcon({ slug }: { slug: string }) {
  const s = { stroke: '#fff', strokeWidth: '1.5', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (slug) {
    case 'text-generation':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="14" height="2" rx="1"/><rect x="3" y="15" width="10" height="2" rx="1"/></svg>;
    case 'image-generation':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case 'video-generation':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
    case 'coding':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case 'audio':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'data-analysis':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
    case 'productivity':
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    default:
      return <svg width="42" height="42" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#fff"/></svg>;
  }
}

function HudCorners({ left = '#008CED', right = '#001433' }: { left?: string; right?: string }) {
  const L = { position: 'absolute' as const, background: left };
  const R = { position: 'absolute' as const, background: right };
  return <>
    <div style={{ ...L, top:0, left:0, width:12, height:2 }} />
    <div style={{ ...L, top:0, left:0, width:2, height:12 }} />
    <div style={{ ...R, top:0, right:0, width:12, height:2 }} />
    <div style={{ ...R, top:0, right:0, width:2, height:12 }} />
    <div style={{ ...L, bottom:0, left:0, width:12, height:2 }} />
    <div style={{ ...L, bottom:0, left:0, width:2, height:12 }} />
    <div style={{ ...R, bottom:0, right:0, width:12, height:2 }} />
    <div style={{ ...R, bottom:0, right:0, width:2, height:12 }} />
  </>;
}

interface CategoryGridProps {
  categories: CategoryWithCount[];
  locale: Locale;
}

export default function CategoryGrid({ categories, locale }: CategoryGridProps) {
  const DARK  = '#0A1628';
  const BLUE1 = '#005BBB';
  const BLUE2 = '#008CED';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((cat, i) => {
        const name_ja  = cat.name_ja;
        const name_en  = cat.name_en;
        const dispName = locale === 'ja' ? name_ja : name_en;
        const iconFile = ICON_FILE[cat.slug];
        // カテゴリグリッドから /tools?cat=slug に遷移（カテゴリページ不要）
        const href = locale === 'ja' ? `/tools?cat=${cat.slug}` : `/en/tools?cat=${cat.slug}`;

        return (
          <motion.div key={cat.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: i * 0.02 }}
          >
            <Link
              href={href}
              className="group relative block overflow-hidden transition-transform duration-150 hover:-translate-y-0.5"
              style={{ background: DARK, border: '1px solid #1A3860', borderRadius: '3px', height: '72px' }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${BLUE1}, ${BLUE2})`,
                clipPath: 'polygon(55% 0%, 100% 0%, 100% 100%, 42% 100%)',
              }} />
              <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: '0.55rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em' }}>
                ////
              </div>
              <div className="cat-icon" style={{ position: 'absolute', right: '6%', top: '60%', transform: 'translateY(-50%)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.25))' }}>
                {iconFile ? (
                  <img src={`/icons/${iconFile}`} alt={name_en} width={38} height={38} style={{ objectFit: 'contain' }} />
                ) : (
                  <FallbackIcon slug={cat.slug} />
                )}
              </div>
              <div className="cat-text-area" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '72%', padding: '0 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '4px', gap: 2 }}>
                <p style={{ fontFamily: 'var(--font-noto), sans-serif', fontSize: dispName.length > 7 ? '1rem' : '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1, textShadow: '1px 1px 4px rgba(0,0,0,0.6)' }}>
                  {dispName}
                </p>
                {locale === 'ja' && (
                  <p style={{ fontFamily: 'var(--font-fira), system-ui', fontSize: '0.58rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                    {name_en}
                  </p>
                )}
              </div>
              <HudCorners left={BLUE2} right="#FFFFFF" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px ${BLUE2}`, borderRadius: '3px' }} />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
