'use client';
// src/components/ToolMediaTabs.tsx
import { useState } from 'react';
import type { NoteArticle } from '@/types';

const NOTES_PER_PAGE = 12;

interface ToolMediaTabsProps {
  noteArticles: NoteArticle[];
  toolName: string;
}

export default function ToolMediaTabs({ noteArticles, toolName }: ToolMediaTabsProps) {
  const [notePage, setNotePage] = useState(0);

  const noteTotalPages = Math.ceil(noteArticles.length / NOTES_PER_PAGE);
  const pagedNotes = noteArticles.slice(notePage * NOTES_PER_PAGE, (notePage + 1) * NOTES_PER_PAGE);

  return (
    <section style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)', borderLeft: '3px solid #008CED', borderRadius: '4px', overflow: 'hidden' }}>
      {/* ヘッダー */}
      <div style={{ borderBottom: '1px solid rgba(0,140,237,0.1)', padding: '0.875rem 1.5rem' }}>
        <span style={{ fontSize: '0.82rem', fontFamily: 'Fira Sans, sans-serif', fontWeight: 700, color: '#F0EBE1', letterSpacing: '0.04em' }}>
          Note紹介
        </span>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {pagedNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ color: '#6B7280', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
              {toolName} に関するNote記事はまだありません
            </p>
            <a href="https://note.com/hashtag/AI" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: '#008CED' }} className="link-underline">
              NoteでAI記事を探す →
            </a>
            <p style={{ color: '#4A5568', fontSize: '0.75rem', marginTop: '1rem' }}>
              掲載希望の方は
              <a href="/contact" style={{ color: '#008CED', marginLeft: '4px' }} className="link-underline">
                お問い合わせ
              </a>
              からご連絡ください
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {pagedNotes.map(article => (
                <a key={article.id} href={article.note_url} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: '#111318', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,140,237,0.08)', transition: 'border-color 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,140,237,0.3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,140,237,0.08)'}>
                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#0A0D12', overflow: 'hidden', flexShrink: 0 }}>
                      {article.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={article.thumbnail_url} alt={article.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#4A5568', fontSize: '1.5rem' }}>📝</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.82rem', fontFamily: 'Noto Sans JP, sans-serif', color: '#F0EBE1', lineHeight: 1.5, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                        {article.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                        {article.author_icon_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={article.author_icon_url} alt={article.author_name ?? ''}
                            style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '0.72rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {article.author_name}
                        </span>
                        {article.likes_count > 0 && (
                          <span style={{ fontSize: '0.72rem', color: '#6B7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            ♡ {article.likes_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {noteTotalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', paddingTop: '1.25rem' }}>
                <button onClick={() => setNotePage(p => Math.max(0, p - 1))} disabled={notePage === 0}
                  style={{ padding: '4px 14px', fontSize: '0.78rem', background: notePage === 0 ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)', color: notePage === 0 ? '#4A5568' : '#008CED', border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px', cursor: notePage === 0 ? 'default' : 'pointer', fontFamily: 'Fira Sans, sans-serif' }}>
                  ← 前へ
                </button>
                <span style={{ fontSize: '0.78rem', color: '#6B7280', fontFamily: 'Fira Sans, monospace' }}>{notePage + 1} / {noteTotalPages}</span>
                <button onClick={() => setNotePage(p => Math.min(noteTotalPages - 1, p + 1))} disabled={notePage === noteTotalPages - 1}
                  style={{ padding: '4px 14px', fontSize: '0.78rem', background: notePage === noteTotalPages - 1 ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)', color: notePage === noteTotalPages - 1 ? '#4A5568' : '#008CED', border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px', cursor: notePage === noteTotalPages - 1 ? 'default' : 'pointer', fontFamily: 'Fira Sans, sans-serif' }}>
                  次へ →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
