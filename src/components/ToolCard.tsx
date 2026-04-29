// src/components/ToolCard.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';

interface ToolCardProps {
  tool: Tool;
  locale: Locale;
  index?: number;
  categoryName?: string;
  categorySlug?: string;
}

// 右下の折り目（ドッグイヤー）
function FoldedCorner({ size = 22 }: { size?: number }) {
  return (
    <>
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 0, height: 0, borderStyle: 'solid',
        borderWidth: `${size}px ${size}px 0 0`,
        borderColor: `transparent var(--color-accent) transparent transparent`,
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 0, height: 0, borderStyle: 'solid',
        borderWidth: `0 0 ${size}px ${size}px`,
        borderColor: `transparent transparent rgba(0,0,0,0.4) transparent`,
        zIndex: 3,
      }} />
    </>
  );
}

// 「。」で分割して各文を別行で表示するコンポーネント（行数制限付き）
function JaText({ text, style, lineStyle, maxLines }: {
  text: string;
  style?: React.CSSProperties;
  lineStyle?: React.CSSProperties;
  maxLines?: number;
}) {
  const lines = text.split('。').map(s => s.trim()).filter(Boolean);
  const displayLines = maxLines ? lines.slice(0, maxLines) : lines;
  const truncated = maxLines && lines.length > maxLines;

  if (displayLines.length <= 1 && !truncated) {
    return <span style={style}>{text}</span>;
  }
  return (
    <span style={style}>
      {displayLines.map((line, i) => (
        <span key={i} style={{ display: 'block', ...lineStyle }}>
          {line}{i === displayLines.length - 1 && truncated ? '…' : ''}
        </span>
      ))}
    </span>
  );
}

export default function ToolCard({ tool, locale, index = 0, categoryName }: ToolCardProps) {
  const tt = t[locale];
  const name    = locale === 'ja' ? tool.name_ja    : tool.name_en;
  const tagline = locale === 'ja' ? tool.tagline_ja : tool.tagline_en;
  const desc    = locale === 'ja' ? tool.description_ja : tool.description_en;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.32), ease: 'easeOut' }}
      style={{ marginTop: '14px', marginLeft: '8px', position: 'relative' }}
    >
      {/* 左上：傾いたバッジ */}
      <div style={{
        position: 'absolute', top: '-14px', left: '-8px',
        width: '32px', height: '32px',
        background: '#ffffff', border: '2px solid var(--color-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: 'rotate(-6deg)', zIndex: 10,
        boxShadow: '2px 3px 8px rgba(0,0,0,0.4)',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {tool.logo_url ? (
          <img src={tool.logo_url} alt={name} width={24} height={24} style={{ objectFit: 'contain', padding: '2px' }} />
        ) : (
          <span style={{ fontFamily: 'var(--font-fira), system-ui', fontSize: '0.75rem', color: 'var(--color-accent)', letterSpacing: '0.03em' }}>
            {initials}
          </span>
        )}
      </div>

      {/* カード本体 */}
      <div style={{ filter: 'drop-shadow(5px 5px 0px #008CED)' }}>
        <Link
          href={localizedPath(locale, `/tool/${tool.slug}`)}
          className="group relative block transition-transform duration-150 hover:-translate-y-1"
          style={{
            background: '#EEF4FF',
            border: '1px solid #1A3860',
            borderRadius: '2px',
            overflow: 'hidden',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)',
            height: '220px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FoldedCorner />

          <div style={{ padding: '1rem', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* バッジ行 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '10px', flexShrink: 0 }}>
              {categoryName && (
                <span style={{
                  background: '#0F3D8C', color: '#FFFFFF',
                  fontSize: '0.6875rem', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  padding: '2px 8px', borderRadius: '2px',
                  border: '1px solid #1A56DB',
                }}>{categoryName}</span>
              )}
            </div>

            {/* ツール名 */}
            <h3
              className="leading-none mb-2 transition-colors group-hover:text-[var(--color-accent)]"
              style={{
                fontFamily: locale === 'ja' ? 'var(--font-shippori), serif' : 'var(--font-merriweather), serif',
                fontSize: locale === 'ja' ? 'clamp(1rem, 2.5vw, 1.2rem)' : 'clamp(1.1rem, 2.5vw, 1.4rem)',
                fontWeight: 700,
                color: '#0A1628',
                letterSpacing: locale === 'ja' ? '0.05em' : '0.03em',
                textTransform: locale === 'ja' ? 'none' as const : 'uppercase' as const,
                lineHeight: 1.15,
                flexShrink: 0,
              }}
            >
              {name}
            </h3>

            {/* テキストエリア：flex-shrink可能・overflow hidden で詳しく見るを常に表示 */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {tagline && (
                locale === 'ja' ? (
                  <JaText
                    text={tagline}
                    maxLines={2}
                    style={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.5, color: '#1A2E4A', display: 'block', marginBottom: '0.25rem' }}
                    lineStyle={{ marginBottom: '0.1rem' }}
                  />
                ) : (
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.5, color: '#1A2E4A', marginBottom: '4px',
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {tagline}
                  </p>
                )
              )}
              {desc && (
                locale === 'ja' ? (
                  <JaText
                    text={desc}
                    maxLines={2}
                    style={{ fontSize: '0.72rem', lineHeight: 1.5, color: '#4A6B8A', display: 'block' }}
                    lineStyle={{ marginBottom: '0.1rem' }}
                  />
                ) : (
                  <p style={{ fontSize: '0.72rem', lineHeight: 1.5, color: '#4A6B8A',
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {desc}
                  </p>
                )
              )}
            </div>

            {/* 詳しく見る - 常にカード下部に表示 */}
            <div
              className="flex items-center gap-2 pt-3 text-xs font-bold tracking-widest uppercase"
              style={{ borderTop: '1px solid #C0D4E8', color: '#6B8FAF', flexShrink: 0, marginTop: '8px' }}
            >
              <span className="group-hover:text-[var(--color-accent)] transition-colors">
                {locale === 'ja' ? '詳しく見る' : 'Learn more'}
              </span>
              <span className="group-hover:translate-x-1 transition-transform inline-block" style={{ color: 'var(--color-accent)' }}>
                ▶
              </span>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
