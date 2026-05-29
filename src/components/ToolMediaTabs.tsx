'use client';
// src/components/ToolMediaTabs.tsx
import { useState, useRef, useEffect } from 'react';
import type { Locale, ToolLaunch, NoteArticle } from '@/types';

const NOTES_PER_PAGE = 12;

interface RelatedTool {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  tagline_ja: string | null;
  logo_url: string | null;
}

interface Feature {
  id: string;
  slug: string;
  title: string;
  published_at: string;
  updated_at: string;
}

interface ToolMediaTabsProps {
  noteArticles: NoteArticle[];
  launches: ToolLaunch[];
  locale: Locale;
  toolName: string;
  toolLogoUrl?: string | null;
  relatedTools?: RelatedTool[];
  currentToolId?: string;
  features?: Feature[];
}

export default function ToolMediaTabs({ noteArticles, locale, toolName, relatedTools = [], currentToolId, features = [] }: ToolMediaTabsProps) {
  const [activeTab, setActiveTab] = useState<'note' | 'features' | 'related'>('note');
  const [notePage, setNotePage] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const noteTotalPages = Math.ceil(noteArticles.length / NOTES_PER_PAGE);
  useEffect(() => {
    if (sliderRef.current) sliderRef.current.scrollLeft = 0;
  }, [notePage]);
  const pagedNotes = noteArticles.slice(notePage * NOTES_PER_PAGE, (notePage + 1) * NOTES_PER_PAGE);
  const filteredRelated = relatedTools.filter(t => t.id !== currentToolId);

  const tabs = [
    { id: 'note' as const, label: 'Note紹介' },
    ...(features.length > 0 ? [{ id: 'features' as const, label: '特集' }] : []),
    ...(filteredRelated.length > 0 ? [{ id: 'related' as const, label: '関連AIツール' }] : []),
  ] as { id: 'note' | 'features' | 'related'; label: string }[];

  return (
    <section style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderLeft: '3px solid #008CED', borderRadius: '4px', overflow: 'hidden' }}>
      {/* タブヘッダー */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-panel-border)', padding: '0 1.5rem', gap: '0.25rem' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNotePage(0); }}
            style={{
              padding: '0.875rem 1.25rem', fontSize: '0.82rem', fontFamily: 'Fira Sans, sans-serif',
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-tab-inactive)',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #008CED' : '2px solid transparent',
              cursor: 'pointer', marginBottom: '-1px', letterSpacing: '0.04em',
              transition: 'color 0.15s', userSelect: 'none' as const,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem' }}>

        {/* Note紹介タブ */}
        {activeTab === 'note' && (
          <div>
            {pagedNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <style>{`.note-empty-br { display: none; } @media (max-width: 767px) { .note-empty-br { display: inline; } }`}</style>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.8, marginBottom: '0.75rem' }}>
                  {toolName} に関する<br className="note-empty-br" />Note記事はまだありません
                </p>
                {/* ブルーオーシャン提案 */}
                <div style={{ margin: '1rem auto', maxWidth: '480px', padding: '12px 16px', background: 'rgba(0,140,237,0.06)', border: '1px solid rgba(0,140,237,0.25)', borderRadius: '6px', textAlign: 'left' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#008CED', margin: '0 0 6px', letterSpacing: '0.05em' }}>
                    🎯 ブルーオーシャンチャンス
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-sub)', lineHeight: 1.7, margin: 0 }}>
                    このツールに関する日本語のNote記事はまだほとんどありません。いち早く紹介記事を書くことで、検索での先行者利益を狙えるかもしれません。
                  </p>
                </div>
                <a href={`https://note.com/search?q=${encodeURIComponent(toolName + ' AI')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: '#008CED', display: 'inline-block', marginBottom: '1rem' }}
                  className="link-underline">
                  NoteでAI記事を探す
                </a>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: 0 }}>
                  掲載希望の方は
                  <a href="/contact" style={{ color: '#008CED', margin: '0 4px' }} className="link-underline">お問い合わせ</a>
                  からご連絡ください
                </p>
              </div>
            ) : (
              <>
                <style>{`
                  .note-slider { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
                  @media (max-width: 767px) {
                    .note-slider { display: flex; overflow-x: auto; gap: 0.75rem; padding-bottom: 8px; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; }
                    .note-slider::-webkit-scrollbar { height: 4px; }
                    .note-slider::-webkit-scrollbar-thumb { background: #008CED; border-radius: 4px; }
                    .note-slider-item { flex: 0 0 72vw; max-width: 260px; scroll-snap-align: start; }
                  }
                `}</style>
                {/* 記事が少ない場合のブルーオーシャン提案 */}
                {noteArticles.length <= 3 && (
                  <div style={{ marginBottom: '1rem', padding: '10px 14px', background: 'rgba(0,140,237,0.06)', border: '1px solid rgba(0,140,237,0.25)', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎯</span>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#008CED', margin: '0 0 3px', letterSpacing: '0.05em' }}>
                        ブルーオーシャンチャンス
                      </p>
                      <p style={{ fontSize: '0.73rem', color: 'var(--color-text-sub)', lineHeight: 1.7, margin: 0 }}>
                        このツールに関する日本語のNote記事はまだほとんどありません。いち早く紹介記事を書くことで、検索での先行者利益を狙えるかもしれません。
                      </p>
                    </div>
                  </div>
                )}
                <div className="note-slider" ref={sliderRef}>
                  {pagedNotes.map(article => (
                    <a key={article.id} href={article.note_url} target="_blank" rel="noopener noreferrer"
                      className="note-slider-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: 'var(--color-note-card-bg)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-note-card-border)', transition: 'border-color 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,140,237,0.3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-note-card-border)'}
                      >
                        <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--color-bg)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          {article.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={article.thumbnail_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem' }}>📝</span>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.82rem', fontFamily: 'Noto Sans JP, sans-serif', color: 'var(--color-text)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                            {article.title}
                          </p>
                          {article.published_at && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                                {article.published_at.slice(0, 10).replace(/-/g, '/')}
                              </span>
                              {(article as any).is_pinned ? (
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#008CED', background: 'rgba(0,140,237,0.12)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(0,140,237,0.3)' }}>
                                  📌 固定
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {noteTotalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', paddingTop: '1.25rem' }}>
                    <button onClick={() => setNotePage(p => Math.max(0, p - 1))} disabled={notePage === 0}
                      style={{ padding: '4px 14px', fontSize: '0.78rem', background: notePage === 0 ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)', color: notePage === 0 ? 'var(--color-text-muted)' : '#008CED', border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px', cursor: notePage === 0 ? 'default' : 'pointer', fontFamily: 'Fira Sans, sans-serif' }}>
                      ← 前へ
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'Fira Sans, monospace' }}>{notePage + 1} / {noteTotalPages}</span>
                    <button onClick={() => setNotePage(p => Math.min(noteTotalPages - 1, p + 1))} disabled={notePage === noteTotalPages - 1}
                      style={{ padding: '4px 14px', fontSize: '0.78rem', background: notePage === noteTotalPages - 1 ? 'rgba(0,140,237,0.04)' : 'rgba(0,140,237,0.1)', color: notePage === noteTotalPages - 1 ? 'var(--color-text-muted)' : '#008CED', border: '1px solid rgba(0,140,237,0.2)', borderRadius: '3px', cursor: notePage === noteTotalPages - 1 ? 'default' : 'pointer', fontFamily: 'Fira Sans, sans-serif' }}>
                      次へ →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 特集タブ */}
        {activeTab === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map(f => (
              <a key={f.id} href={`/feature/${f.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: 'var(--color-note-card-bg)', border: '1px solid var(--color-note-card-border)', borderRadius: '6px', padding: '14px 16px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,140,237,0.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-note-card-border)'}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)', marginBottom: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                  {f.published_at?.slice(0, 10).replace(/-/g, '/')}
                  {f.updated_at && f.updated_at !== f.published_at && (
                    <span style={{ marginLeft: '8px' }}>更新: {f.updated_at.slice(0, 10).replace(/-/g, '/')}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 関連AIツールタブ */}
        {activeTab === 'related' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {filteredRelated.map(tool => (
              <a key={tool.id} href={`/tool/${tool.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-note-card-bg)', border: '1px solid var(--color-note-card-border)', borderRadius: '6px', padding: '10px 12px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,140,237,0.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-note-card-border)'}>
                {tool.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tool.logo_url} alt={tool.name_ja} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,140,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#008CED' }}>{tool.name_ja.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Fira Sans, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name_ja}</div>
                  {tool.tagline_ja && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.tagline_ja}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
