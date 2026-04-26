// src/components/HeroSection.tsx
'use client';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';

interface HeroSectionProps {
  locale: Locale;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  return (
    <section style={{
      position:      'relative',
      overflow:      'hidden',
      background:    '#040912',
      borderBottom:  '1px solid var(--color-border)',
      paddingTop:    '16px',
      paddingBottom: '16px',
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
        <div style={{ textAlign:'center' }}>

          {/* ラベル：Orbitron・左上ロゴと同じフォント */}
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

          {/* AI TOOLS */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4, delay:0.08 }} style={{ marginBottom:'0px' }}>
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

          {/* 最新情報 */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4, delay:0.14 }} style={{ marginBottom:'0' }}>
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
      </div>
    </section>
  );
}
