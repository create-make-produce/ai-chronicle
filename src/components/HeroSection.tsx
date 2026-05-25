// src/components/HeroSection.tsx
'use client';
import { motion } from 'framer-motion';
import type { Locale } from '@/types';

// ── 六角形の定数 ──
const S    = 58;                             // circumradius
const H    = S * Math.sqrt(3) / 2;           // half-width ≈ 50.2
const PERI = 6 * S;                          // 周長 = 348

// pointy-top 六角形のSVGパス文字列
function hexPath(cx: number, cy: number): string {
  const h = H;
  return [
    `M${cx.toFixed(1)},${(cy - S).toFixed(1)}`,
    `L${(cx + h).toFixed(1)},${(cy - S / 2).toFixed(1)}`,
    `L${(cx + h).toFixed(1)},${(cy + S / 2).toFixed(1)}`,
    `L${cx.toFixed(1)},${(cy + S).toFixed(1)}`,
    `L${(cx - h).toFixed(1)},${(cy + S / 2).toFixed(1)}`,
    `L${(cx - h).toFixed(1)},${(cy - S / 2).toFixed(1)}`,
    'Z',
  ].join('');
}

// ── ハチの巣グリッド定義 ──
// viewBox="0 0 520 420"
// 行間隔 = S*1.5 = 87, 列間隔 = H*2 = 100.4
const ROW_STEP = S * 1.5;   // 87
const COL_STEP = H * 2;     // 100.4

type HexDef = { cx: number; cy: number; color: string; delay: number };

const HEXES: HexDef[] = [
  // Row 0 (y=72)
  { cx: 198, cy: 72,  color: '#A8F0D4', delay: 0.0  },
  { cx: 198 + COL_STEP, cy: 72, color: '#8BB8FF', delay: 0.3  },
  { cx: 198 + COL_STEP * 2, cy: 72, color: '#FFB6C8', delay: 0.6  },
  // Row 1 (y=72+87=159, offset by H)
  { cx: 198 + H, cy: 72 + ROW_STEP, color: '#FFE066', delay: 0.15 },
  { cx: 198 + H + COL_STEP, cy: 72 + ROW_STEP, color: '#C8A8FF', delay: 0.45 },
  { cx: 198 + H + COL_STEP * 2, cy: 72 + ROW_STEP, color: '#A8F0D4', delay: 0.75 },
  // Row 2 (y=72+174=246)
  { cx: 198, cy: 72 + ROW_STEP * 2, color: '#FFB6C8', delay: 0.0  },
  { cx: 198 + COL_STEP, cy: 72 + ROW_STEP * 2, color: '#FFE066', delay: 0.3  },
  { cx: 198 + COL_STEP * 2, cy: 72 + ROW_STEP * 2, color: '#8BB8FF', delay: 0.6  },
  // Row 3 (y=72+261=333, offset)
  { cx: 198 + H, cy: 72 + ROW_STEP * 3, color: '#C8A8FF', delay: 0.15 },
  { cx: 198 + H + COL_STEP, cy: 72 + ROW_STEP * 3, color: '#FFB6C8', delay: 0.45 },
];

interface HeroSectionProps {
  locale: Locale;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const DUR = 2.8; // 1周の秒数

  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      paddingTop: '56px', paddingBottom: '64px',
    }}>

      {/* ドットグリッド */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)',
        backgroundSize: '28px 28px', opacity: 0.5,
      }} />

      <style>{`
        @keyframes hex-float {
          0%   { transform: translateY(0px)   rotate(0deg); }
          30%  { transform: translateY(-14px) rotate(0.4deg); }
          65%  { transform: translateY(-6px)  rotate(-0.3deg); }
          85%  { transform: translateY(-18px) rotate(0.3deg); }
          100% { transform: translateY(0px)   rotate(0deg); }
        }
        .hex-float { animation: hex-float 7s ease-in-out infinite; }
        @media (max-width: 900px) { .hero-hex-side { display: none !important; } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem' }}>

        {/* ── 左：テキスト ── */}
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>

          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
            style={{ marginBottom:'16px' }}>
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
              fontSize:'clamp(3rem, 7vw, 7.5rem)', lineHeight:0.88,
              letterSpacing:'-0.04em', textTransform:'uppercase', margin:0,
              background:'linear-gradient(135deg, #0A2040 0%, #004A8F 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>
            AI TOOLS
          </motion.h1>

          <motion.h2 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.12 }}
            style={{
              fontFamily:'var(--font-fira), system-ui', fontWeight:900,
              fontSize:'clamp(2.6rem, 6vw, 6.5rem)', lineHeight:0.9,
              letterSpacing:'-0.03em', margin:'6px 0 0',
              background:'linear-gradient(135deg, #0070CC 0%, #00AAFF 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>
            {locale === 'ja' ? '最新情報' : 'LATEST INFO'}
          </motion.h2>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.2 }}
            style={{ marginTop:'24px', maxWidth:'480px' }}>
            <p style={{
              fontFamily:'var(--font-noto), sans-serif',
              fontSize:'clamp(1rem, 1.6vw, 1.1rem)',
              color:'var(--color-text)', lineHeight:1.5, fontWeight:700, margin:0,
            }}>
              {locale === 'ja' ? 'AIの世界は、毎日動いている。' : 'The AI world moves every day.'}
            </p>
            <p style={{
              fontFamily:'var(--font-noto), sans-serif',
              fontSize:'clamp(0.85rem, 1.3vw, 0.95rem)',
              color:'var(--color-text-sub)', lineHeight:1.9, fontWeight:400, margin:'10px 0 0',
            }}>
              {locale === 'ja' ? (
                <>海外発の最新ツールを日本語でいち早く。<br />新機能、新サービス、料金改定——<br />知るべきニュースを、見逃さない。</>
              ) : (
                <>The latest tools from overseas, in Japanese.<br />New features, services, price changes——<br />Stay ahead. Miss nothing.</>
              )}
            </p>
          </motion.div>
        </div>

        {/* ── 右：ハチの巣アニメーション ── */}
        <motion.div
          className="hero-hex-side"
          initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }}
          transition={{ duration:0.6, delay:0.3 }}
          style={{ flex:'0 0 520px', width:'520px' }}>

          <div className="hex-float">
            <svg viewBox="0 0 520 420" width="520" height="420"
              xmlns="http://www.w3.org/2000/svg">

              {HEXES.map((hex, i) => {
                const d   = hexPath(hex.cx, hex.cy);
                const pid = `hp-${i}`;
                const did = `hd-${i}`;
                const begin = `${hex.delay}s`;
                const dur   = `${DUR}s`;
                // dash: 1辺分が走る・残りはgap
                const dash = S.toFixed(1);
                const gap  = (PERI - S).toFixed(1);

                return (
                  <g key={i}>
                    {/* 薄い塗り（セル感） */}
                    <path d={d} fill={hex.color} fillOpacity="0.07" />

                    {/* 走るダッシュ（縁をなぞる） */}
                    <path
                      id={pid}
                      d={d}
                      fill="none"
                      stroke={hex.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset="0"
                      opacity="0.9"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to={`-${PERI}`}
                        dur={dur}
                        begin={begin}
                        repeatCount="indefinite"
                        calcMode="linear"
                      />
                    </path>

                    {/* 薄い枠線（常時表示・低opacity） */}
                    <path d={d} fill="none" stroke={hex.color} strokeWidth="1" opacity="0.18" />

                    {/* ペン先の〇 */}
                    <circle r="4.5" fill={hex.color} id={did} opacity="0.95">
                      <animateMotion
                        dur={dur}
                        begin={begin}
                        repeatCount="indefinite"
                        calcMode="linear"
                      >
                        <mpath href={`#${pid}`} />
                      </animateMotion>
                    </circle>

                    {/* ペン先の光グロー */}
                    <circle r="8" fill={hex.color} opacity="0.25">
                      <animateMotion
                        dur={dur}
                        begin={begin}
                        repeatCount="indefinite"
                        calcMode="linear"
                      >
                        <mpath href={`#${pid}`} />
                      </animateMotion>
                    </circle>

                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
