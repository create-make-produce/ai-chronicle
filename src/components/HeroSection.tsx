// src/components/HeroSection.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';

interface HeroSectionProps {
  locale: Locale;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(locale === 'ja' ? `/tools?q=${encodeURIComponent(q)}` : `/en/tools?q=${encodeURIComponent(q)}`);
  };

  return (
    <section style={{
      position:      'relative',
      overflow:      'hidden',
      background:    '#040912',
      borderBottom:  '1px solid var(--color-border)',
      paddingTop:    '16px',
      paddingBottom: '24px',
    }}>

      {/* 背景：青い斜め帯 */}
      <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{
          position:   'absolute', top:'-20%', left:'-5%',
          width:      '55%', height:'140%',
          background: 'linear-gradient(135deg, rgba(0,80,180,0.18) 0%, rgba(0,140,237,0.08) 100%)',
          transform:  'skewX(-8deg)',
        }} />
        <div style={{
          position:   'absolute', top:'-20%', right:'15%',
          width:      '2px', height:'140%',
          background: 'rgba(0,140,237,0.2)',
          transform:  'skewX(-8deg)',
        }} />
        <div style={{
          position:        'absolute', inset:0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,140,237,0.12) 1px, transparent 0)',
          backgroundSize:  '28px 28px',
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position:'relative', zIndex:1 }}>
        {/* タイトルと検索を横並び */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>

          {/* 左：タイトル */}
          <div>
            <motion.div
              initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3 }} style={{ marginBottom:'6px' }}>
              <span style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           '10px',
                fontSize:      '0.6rem',
                fontWeight:    700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color:         '#6B8FAF',
                fontFamily:    'var(--font-orbitron), system-ui',
              }}>
                <span style={{ width:20, height:1, background:'#008CED', display:'inline-block' }} />
                AI CHRONICLE
                <span style={{ width:20, height:1, background:'#008CED', display:'inline-block' }} />
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.4, delay:0.08 }}>
              <h1 style={{
                fontFamily:    'var(--font-fira), system-ui',
                fontWeight:    900,
                fontSize:      'clamp(2rem, 5.5vw, 4.5rem)',
                lineHeight:    0.9,
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
                color:         '#FFFFFF',
                margin:        0,
              }}>
                AI TOOLS
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.4, delay:0.14 }}>
              <h2 style={{
                fontFamily:    'var(--font-fira), system-ui',
                fontWeight:    900,
                fontSize:      'clamp(1.8rem, 5vw, 4rem)',
                lineHeight:    0.9,
                letterSpacing: '-0.02em',
                color:         '#008CED',
                margin:        0,
              }}>
                {locale === 'ja' ? '最新情報' : 'LATEST INFO'}
              </h2>
            </motion.div>
          </div>

          {/* 右下：検索ボックス */}
          <motion.div
            initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            transition={{ duration:0.4, delay:0.2 }}
            style={{ flexShrink: 0, width: '100%', maxWidth: '420px' }}
          >
            <p style={{
              fontFamily: 'var(--font-fira), system-ui',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#4A6B8A',
              marginBottom: '8px',
            }}>
              {locale === 'ja' ? 'AIツールを検索' : 'Search AI Tools'}
            </p>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={locale === 'ja' ? 'ツール名・機能・用途で検索...' : 'Search by name, feature, or use case...'}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-noto), sans-serif',
                  fontSize: '0.85rem',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(0,140,237,0.3)',
                  borderRight: 'none',
                  borderRadius: '2px 0 0 2px',
                  color: '#F0EBE1',
                  outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,140,237,0.8)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,140,237,0.3)'}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  background: '#008CED',
                  border: '1px solid #008CED',
                  borderRadius: '0 2px 2px 0',
                  color: '#000',
                  fontFamily: 'var(--font-fira), system-ui',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.12s',
                }}
              >
                {locale === 'ja' ? '検索' : 'Search'}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
