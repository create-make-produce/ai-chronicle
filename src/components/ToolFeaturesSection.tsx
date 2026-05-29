'use client';
// src/components/ToolFeaturesSection.tsx
import { useState } from 'react';

interface Feature {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  updated_at: string;
}

const PER_PAGE = 8;

export default function ToolFeaturesSection({ features }: { features: Feature[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(features.length / PER_PAGE);
  const paged = features.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (features.length === 0) return null;

  return (
    <section style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderLeft: '3px solid #008CED', borderRadius: '4px', padding: '1.5rem' }}>
      <h2 style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-text)', margin: '0 0 1rem' }}>特集</h2>
      <style>{`
        .feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media (max-width: 767px) { .feature-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <div className="feature-grid">
        {paged.map(f => (
          <a key={f.id} href={`/feature/${f.slug}`}
            style={{ textDecoration: 'none', color: 'inherit', background: 'var(--color-note-card-bg)', border: '1px solid var(--color-note-card-border)', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--color-bg-sub)', overflow: 'hidden', flexShrink: 0 }}>
              {f.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.thumbnail_url} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>📝</span>
                </div>
              )}
            </div>
            <div style={{ padding: '0.75rem' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.5, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {f.title}
              </p>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{f.published_at?.slice(0, 10).replace(/-/g, '/')}</span>
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', paddingTop: '1.25rem' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '4px 14px', fontSize: '0.78rem', background: page === 0 ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)', color: page === 0 ? 'var(--color-text-muted)' : '#008CED', border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px', cursor: page === 0 ? 'default' : 'pointer', fontFamily: 'Fira Sans, sans-serif' }}>
            ← 前へ
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'Fira Sans, monospace' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ padding: '4px 14px', fontSize: '0.78rem', background: page === totalPages - 1 ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)', color: page === totalPages - 1 ? 'var(--color-text-muted)' : '#008CED', border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px', cursor: page === totalPages - 1 ? 'default' : 'pointer', fontFamily: 'Fira Sans, sans-serif' }}>
            次へ →
          </button>
        </div>
      )}
    </section>
  );
}
