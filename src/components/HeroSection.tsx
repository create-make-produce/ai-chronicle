// src/components/HeroSection.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';

const HERO_PHOTOS = [
  '/hero/hero1.webp',
  '/hero/hero2.webp',
  '/hero/hero3.webp',
  '/hero/hero4.webp',
  '/hero/hero5.webp',
];

interface FeatureItem {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
}

interface HeroSectionProps {
  locale: Locale;
  recentFeatures?: FeatureItem[];
}

export default function HeroSection({ locale, recentFeatures = [] }: HeroSectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const firstImgRef = useRef<HTMLImageElement>(null);
  const [featureItem, setFeatureItem] = useState<FeatureItem | null>(null);
  const [featureIdx, setFeatureIdx] = useState(0);
  const [featureOrder, setFeatureOrder] = useState<FeatureItem[]>([]);

  useEffect(() => {
    if (recentFeatures.length === 0) return;
    // ランダム順にシャッフル
    const shuffled = [...recentFeatures].sort(() => Math.random() - 0.5);
    setFeatureOrder(shuffled);
    setFeatureItem(shuffled[0]);
    setFeatureIdx(0);
  }, []);

  useEffect(() => {
    if (featureOrder.length <= 1) return;
    const t = setInterval(() => {
      setFeatureIdx(i => {
        const next = (i + 1) % featureOrder.length;
        setFeatureItem(featureOrder[next]);
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [featureOrder]);

  useEffect(() => {
    if (firstImgRef.current?.complete) {
      setFirstLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!firstLoaded) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % HERO_PHOTOS.length), 3500);
    return () => clearInterval(t);
  }, [firstLoaded]);

  const BORDER_GRADIENT = [
    'conic-gradient(from 0deg,',
    '#29B6F6, #1565C0, #6A1B9A, #E91E63,',
    '#F44336, #FF9800, #FDD835, #26A69A, #29B6F6)',
  ].join(' ');

  return (
    <section className="hero-section" style={{
      position:     'relative',
      overflow:     'hidden',
      background:   'var(--color-bg)',
      borderBottom: '1px solid var(--color-border-mid)',
      height:       '560px',
    }}>

      {/* ヒーロー下部：アクセントライン */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '2px',
        background: 'linear-gradient(to right, #008CED 0%, rgba(0,140,237,0.2) 60%, transparent 100%)',
        zIndex:     10,
      }} />

      <div className="hero-dots" style={{
        position:        'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #C0C8D4 1.3px, transparent 1.3px)',
        backgroundSize:  '32px 32px',
      }} />

      {/* モバイル背景画像（スマホのみ表示） */}
      <div className="hero-bg-mobile" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {HERO_PHOTOS.map((photo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={photo} alt="" style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === activeIdx ? 0.22 : 0,
            transition: 'opacity 1.4s ease',
            filter: 'grayscale(100%)',
          }} />
        ))}
      </div>

      <style>{`
        @media (max-width: 960px) { .hero-circle-area { display: none !important; } }
        @keyframes border-spin    { from { transform: rotate(0deg); }   to { transform: rotate(360deg); }  }
        @keyframes border-counter { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        .circle-outer { animation: border-spin    5s linear infinite; }
        .circle-inner { animation: border-counter 5s linear infinite; }
        .hero-copy-sp { display: none; }
        .hero-bg-mobile { display: none; }
        .hero-dots { opacity: 0.6; }
        @media (max-width: 767px) {
          .hero-copy-pc { display: none; }
          .hero-copy-sp { display: inline; }
          .hero-bg-mobile { display: block; }
          .hero-dots { display: none; }
          .hero-section    { height: auto !important; padding-bottom: 28px; }
          .hero-title-wrap { padding-top: 28px !important; }
          .hero-h1         { font-size: clamp(2.6rem, 14vw, 3.5rem) !important; }
          .hero-h2         { font-size: clamp(2.2rem, 12vw, 3rem) !important; }
          .hero-catchcopy  {
            position: relative !important;
            top: auto !important; left: auto !important;
            transform: none !important;
            margin: 12px 0 0 0 !important;
            padding: 0 16px;
            max-width: 100% !important;
          }
          .hero-feature-card { display: none !important; }
        }
        .hero-feature-card {
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .hero-feature-card:hover {
          box-shadow: 0 6px 24px rgba(124,58,237,0.18) !important;
          transform: translateY(-1px);
        }
        @keyframes feature-dot-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        .feature-live-dot {
          animation: feature-dot-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="hero-circle-area" style={{
        position: 'absolute', right: '-140px', top: '50%',
        transform: 'translateY(-50%)', zIndex: 1,
        width: '760px', height: '760px',
        opacity: firstLoaded ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        <div className="circle-outer" style={{
          width: '100%', height: '100%',
          borderRadius: '50%', padding: '2px',
          background: BORDER_GRADIENT,
        }}>
          <div className="circle-inner" style={{
            width: '100%', height: '100%',
            borderRadius: '50%', overflow: 'hidden',
            position: 'relative', background: '#EBF5FF',
          }}>
            {HERO_PHOTOS.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} ref={i === 0 ? firstImgRef : undefined} src={photo} alt=""
                onLoad={i === 0 ? () => setFirstLoaded(true) : undefined}
                style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: i === activeIdx ? 1 : 0, transition: 'opacity 1.4s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* 特集カード（直近1ヶ月・ランダム1件） */}
      {featureItem && (
        <a href={`/feature/${featureItem.slug}`} className="hero-feature-card" style={{
          position:        'absolute',
          bottom:          featureOrder.length > 1 ? '36px' : '28px',
          left:            '28px',
          zIndex:          4,
          width:           featureItem.thumbnail_url ? '310px' : '268px',
          background:      'rgba(255,255,255,0.92)',
          border:          '0.5px solid rgba(124,58,237,0.3)',
          borderRadius:    '10px',
          padding:         '10px 12px',
          display:         'flex',
          gap:             '10px',
          alignItems:      'flex-start',
          backdropFilter:  'blur(6px)',
          boxShadow:       '0 2px 12px rgba(124,58,237,0.08)',
          textDecoration:  'none',
          cursor:          'pointer',
        }}>
          {/* 左：サムネ or バッジ+縦ライン */}
          {featureItem.thumbnail_url ? (
            <div style={{ position:'relative', flexShrink:0 }}>
              <img src={featureItem.thumbnail_url} alt="" style={{
                width:'120px', height:'68px', borderRadius:'6px',
                objectFit:'cover', display:'block',
                border:'0.5px solid rgba(124,58,237,0.2)',
              }} />
              <span style={{
                position:'absolute', top:'-6px', left:'-4px',
                fontSize:'8px', fontWeight:700, letterSpacing:'0.06em',
                color:'#7C3AED',
                background:'rgba(255,255,255,0.95)',
                border:'0.5px solid rgba(124,58,237,0.35)',
                borderRadius:'4px',
                padding:'1px 4px',
                fontFamily:'Orbitron, system-ui',
              }}>特集</span>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', paddingTop:'2px' }}>
              <span style={{
                fontSize:'9px', fontWeight:700, letterSpacing:'0.06em',
                color:'#7C3AED',
                background:'rgba(124,58,237,0.08)',
                border:'0.5px solid rgba(124,58,237,0.25)',
                borderRadius:'4px',
                padding:'2px 5px',
                whiteSpace:'nowrap',
                fontFamily:'Orbitron, system-ui',
              }}>特集</span>
              <div style={{
                width:'1px', flex:1, minHeight:'20px',
                background:'linear-gradient(to bottom, rgba(124,58,237,0.25), transparent)',
              }} />
            </div>
          )}
          {/* 右：タイトル＋日付 */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontSize:'10px', color:'#3A5A78', marginBottom:'4px',
              display:'flex', alignItems:'center', gap:'5px',
            }}>
              <span className="feature-live-dot" style={{
                width:'5px', height:'5px', borderRadius:'50%',
                background:'#7C3AED', flexShrink:0,
                display:'inline-block',
              }} />
              {featureItem.published_at
                ? new Date(featureItem.published_at).toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit' }).replace(/\//g, '/')
                : ''}
            </div>
            <div style={{
              fontSize:'12px', fontWeight:500, lineHeight:1.45,
              color:'#0A2040',
              display:'-webkit-box',
              WebkitLineClamp:2,
              WebkitBoxOrient:'vertical',
              overflow:'hidden',
            }}>{featureItem.title}</div>
          </div>
          {/* 右端余白 */}
        </a>
      )}

      {/* ドットナビ（2件以上の場合のみ） */}
      {featureOrder.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '28px',
          zIndex: 4,
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
        }}>
          {featureOrder.map((_, i) => (
            <button key={i} onClick={() => {
              setFeatureIdx(i);
              setFeatureItem(featureOrder[i]);
            }} style={{
              width: i === featureIdx ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === featureIdx ? '#7C3AED' : 'rgba(124,58,237,0.25)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>
      )}

      <div className="hero-title-wrap" style={{ position: 'relative', zIndex: 2, paddingTop: '64px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ maxWidth: '520px' }}>
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
              style={{ marginBottom:'14px' }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:'10px',
                fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.3em',
                textTransform:'uppercase', color:'var(--color-accent)',
                fontFamily:'Orbitron, system-ui',
              }}>
                <span style={{ width:24, height:2, background:'var(--color-accent)', display:'inline-block', borderRadius:1 }} />
                AI CHRONICLE
                <span style={{ width:24, height:2, background:'var(--color-accent)', display:'inline-block', borderRadius:1 }} />
              </span>
            </motion.div>
            <motion.h1 className="hero-h1" initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.06 }}
              style={{
                fontFamily:'Fira Sans, system-ui', fontWeight:900,
                fontSize:'clamp(3.5rem, 8vw, 8rem)', lineHeight:1.0,
                letterSpacing:'-0.04em', textTransform:'uppercase', margin:0,
                background:'linear-gradient(135deg, #0A2040 0%, #004A8F 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>AI TOOLS</motion.h1>
            <motion.h2 className="hero-h2" initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.12 }}
              style={{
                fontFamily:'Fira Sans, system-ui', fontWeight:900,
                fontSize:'clamp(3rem, 7vw, 7rem)', lineHeight:1.0,
                letterSpacing:'-0.03em', margin:'6px 0 0',
                background:'linear-gradient(135deg, #0070CC 0%, #00AAFF 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>{locale === 'ja' ? '最新情報' : 'LATEST INFO'}</motion.h2>
          </div>
        </div>
      </div>

      <motion.div
        className="hero-catchcopy"
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, delay:0.25 }}
        style={{
          position: 'absolute',
          top:      '58%',
          left:     '30%',
          transform:'translate(-50%, -50%)',
          zIndex:   3,
          display:  'inline-block',
          textAlign:'left',
          pointerEvents:'none',
          maxWidth: '80%',
        }}>
        <p style={{
          fontFamily:'Noto Serif JP, serif',
          fontSize:  'clamp(2rem, 3.5vw, 2.8rem)',
          fontWeight:700, margin:'0 0 10px', lineHeight:1.3,
          background:'linear-gradient(135deg, #0A2040 0%, #0070CC 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          filter:'drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 6px rgba(255,255,255,0.95))',
        }}>
          {locale === 'ja'
            ? <><span className="hero-copy-pc">AIの世界は、毎日動いている</span><span className="hero-copy-sp">AIの世界は<br />　毎日動いている</span></>
            : 'The AI world moves every day'}
        </p>
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
            fontFamily:'Noto Serif JP, serif',
            fontSize:  'clamp(1rem, 1.6vw, 1.2rem)',
            fontWeight:700, color:'#1A5A9C',
            margin:'0 0 2px', lineHeight:1.8,
            filter:'drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 6px rgba(255,255,255,0.95))',
          }}>{line}</p>
        ))}
      </motion.div>

    </section>
  );
}
