// src/components/HeroSection.tsx
'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';

const HERO_PHOTOS = [
  '/hero/hero1.jpg',
  '/hero/hero2.jpg',
  '/hero/hero3.jpg',
  '/hero/hero4.jpg',
  '/hero/hero5.jpg',
];

interface HeroSectionProps {
  locale: Locale;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % HERO_PHOTOS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{
      position:     'relative',
      overflow:     'hidden',
      background:   'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      height:       '560px',
    }}>

      {/* ドット背景 */}
      <div style={{
        position:        'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #C0C8D4 1.3px, transparent 1.3px)',
        backgroundSize:  '32px 32px',
        opacity:         0.6,
      }} />

      <style>{`
        @media (max-width: 960px) { .hero-circle-area { display: none !important; } }
      `}</style>

      {/* ── 大きな●（上下100pxずつ隠れる） ── */}
      <div className="hero-circle-area" style={{
        position:  'absolute',
        right:     '-140px',
        top:       '50%',
        transform: 'translateY(-50%)',
        zIndex:    1,
        width:     '760px',
        height:    '760px',
      }}>
        <div style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          padding: '3px',
          background: 'linear-gradient(135deg, #FFB6C8 0%, #8BB8FF 35%, #A8F0D4 65%, #FFE066 100%)',
        }}>
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            background: '#EBF5FF',
          }}>
            {HERO_PHOTOS.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={photo} alt="" style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: i === activeIdx ? 1 : 0,
                transition: 'opacity 1.4s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── タイトル（左上） ── */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: '64px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ maxWidth: '520px' }}>

            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
              style={{ marginBottom:'14px' }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:'10px',
                fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.3em',
                textTransform:'uppercase', color:'var(--color-accent)',
                fontFamily:'var(--font-orbitron), system-ui',
              }}>
                <span style={{ width:24, height:2, background:'var(--color-accent)', display:'inline-block', borderRadius:1 }} />
                AI CHRONICLE
                <span style={{ width:24, height:2, background:'var(--color-accent)', display:'inline-block', borderRadius:1 }} />
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.06 }}
              style={{
                fontFamily:'var(--font-fira), system-ui', fontWeight:900,
                fontSize:'clamp(3.5rem, 8vw, 8rem)', lineHeight:0.88,
                letterSpacing:'-0.04em', textTransform:'uppercase', margin:0,
                background:'linear-gradient(135deg, #0A2040 0%, #004A8F 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>
              AI TOOLS
            </motion.h1>

            <motion.h2 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.12 }}
              style={{
                fontFamily:'var(--font-fira), system-ui', fontWeight:900,
                fontSize:'clamp(3rem, 7vw, 7rem)', lineHeight:0.9,
                letterSpacing:'-0.03em', margin:'6px 0 0',
                background:'linear-gradient(135deg, #0070CC 0%, #00AAFF 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>
              {locale === 'ja' ? '最新情報' : 'LATEST INFO'}
            </motion.h2>

          </div>
        </div>
      </div>

      {/* ── コピーテキスト（画面中央・少し下・左揃えブロック） ── */}
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, delay:0.25 }}
        style={{
          position:      'absolute',
          top:           '64%',          /* 少し下 */
          left:          '42%',
          transform:     'translate(-50%, -50%)',
          zIndex:        3,
          display:       'inline-block', /* コンテンツ幅に縮む */
          textAlign:     'left',         /* ブロック内は左揃え */
          pointerEvents: 'none',
          maxWidth:      '80%',
        }}>

        {/* 1行目：大きく・グラデーション */}
        <p style={{
          fontFamily:         'var(--font-noto-serif), serif',
          fontSize:           'clamp(1.6rem, 3vw, 2.2rem)',
          fontWeight:         700,
          margin:             '0 0 10px',
          lineHeight:         1.3,
          background:         'linear-gradient(135deg, #0A2040 0%, #0070CC 100%)',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent',
          backgroundClip:     'text',
        }}>
          {locale === 'ja' ? 'AIの世界は、毎日動いている' : 'The AI world moves every day'}
        </p>

        {/* 2〜4行目：小さく・アクセントブルー */}
        {(locale === 'ja' ? [
          '海外発の最新ツールを日本語でいち早く',
          '新機能 / 新サービス / 料金改定',
          '知るべきニュースを、見逃さない',
        ] : [
          'The latest tools from overseas, in Japanese',
          'New features / New services / Price changes',
          'Stay ahead. Miss nothing',
        ]).map((line, i) => (
          <p key={i} style={{
            fontFamily: 'var(--font-noto-serif), serif',
            fontSize:   'clamp(0.85rem, 1.4vw, 1rem)',
            fontWeight: 400,
            color:      '#1A5A9C',
            margin:     '0 0 2px',
            lineHeight: 1.8,
          }}>
            {line}
          </p>
        ))}

      </motion.div>

    </section>
  );
}
