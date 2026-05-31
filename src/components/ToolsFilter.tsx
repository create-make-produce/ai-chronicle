// src/components/ToolsFilter.tsx
'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PageTheme } from '@/lib/page-themes';
import { PAGE_THEMES } from '@/lib/page-themes';
import type { Locale, Tool } from '@/types';
import { t } from '@/lib/i18n';
import ToolCard from './ToolCard';

interface Category {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
}

interface ToolsFilterProps {
  tools: Tool[];
  locale: Locale;
  categorySlug?: string;
  categoryName?: string;
  categories?: Category[];
  initialCat?: string;
  initialQ?: string;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  theme?: PageTheme;
}

export default function ToolsFilter({
  tools, locale, categorySlug, categoryName, categories = [],
  initialCat = '', initialQ = '',
  currentPage = 1, totalPages = 1, total = 0,
  theme = PAGE_THEMES.tools,
}: ToolsFilterProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialQ);
  const [selectedCat, setSelectedCat] = useState(initialCat || categorySlug || '');
  const tt = t[locale];

  const buildUrl = (cat: string, q: string, page: number) => {
    const params = new URLSearchParams();
    if (cat) params.set('cat', cat);
    if (q)   params.set('q', q);
    if (page > 1) params.set('p', String(page));
    const qs = params.toString();
    return `/tools${qs ? '?' + qs : ''}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(selectedCat, inputValue.trim(), 1));
  };

  const handleCatChange = (cat: string) => {
    setSelectedCat(cat);
    router.push(buildUrl(cat, inputValue.trim(), 1));
  };

  const handleClear = () => {
    setInputValue('');
    router.push(buildUrl(selectedCat, '', 1));
  };

  const activeCatName = categories.find(c => c.slug === selectedCat)?.[locale === 'ja' ? 'name_ja' : 'name_en'] ?? null;

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) { pages.push(1, 2, 3, 4, 5, '...', totalPages); }
    else if (currentPage >= totalPages - 3) { pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages); }
    else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
    return pages;
  };

  const selectStyle: React.CSSProperties = {
    fontFamily: 'Noto Sans JP, sans-serif',
    fontSize: '0.85rem',
    padding: '10px 12px',
    background: 'var(--color-select-bg)',
    border: `1px solid rgba(${theme.rgb},0.3)`,
    color: 'var(--color-text)',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div>
      {/* スマホ：カテゴリドロップダウン上表示 */}
      {categories.length > 0 && (
        <div className="tools-cat-mobile" style={{ marginBottom: '0.75rem' }}>
          <select value={selectedCat} onChange={e => handleCatChange(e.target.value)}
            style={{ ...selectStyle, width: '100%', borderRadius: '2px' }}>
            <option value="">{locale === 'ja' ? 'すべてのカテゴリ' : 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat.slug} value={cat.slug}>{locale === 'ja' ? cat.name_ja : cat.name_en}</option>
            ))}
          </select>
        </div>
      )}

      {/* 検索ボックス */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        {categories.length > 0 && (
          <div className="tools-cat-pc">
            <select value={selectedCat} onChange={e => handleCatChange(e.target.value)}
              style={{ ...selectStyle, height: '100%', borderRadius: '2px', minWidth: '160px' }}>
              <option value="">{locale === 'ja' ? 'すべてのカテゴリ' : 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{locale === 'ja' ? cat.name_ja : cat.name_en}</option>
              ))}
            </select>
          </div>
        )}
        <div className="search-wrapper" style={{ display: 'flex', flex: 1 }}>
          <input
            type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
            placeholder={locale === 'ja' ? 'ツール名・機能・用途で検索...' : 'Search by name, feature, or use case...'}
            style={{ flex: 1, maxWidth: '420px', fontFamily: 'var(--font-noto), sans-serif', fontSize: '0.88rem', padding: '10px 14px', background: 'var(--color-search-bg)', border: `1px solid rgba(${theme.rgb},0.3)`, borderRight: 'none', borderRadius: '2px 0 0 2px', color: 'var(--color-text)', outline: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,140,237,0.8)'; const btn = e.currentTarget.nextElementSibling as HTMLElement | null; if (btn) btn.style.borderColor = 'rgba(0,140,237,0.8)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = `rgba(${theme.rgb},0.3)`; const btn = e.currentTarget.nextElementSibling as HTMLElement | null; if (btn) btn.style.borderColor = theme.accent; }}
          />
          <button type="submit" style={{ padding: '10px 20px', background: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: '0 2px 2px 0', color: '#FFFFFF', fontFamily: 'var(--font-fira), system-ui', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {locale === 'ja' ? '検索' : 'Search'}
          </button>
        </div>
        {initialQ && (
          <button type="button" onClick={handleClear}
            style={{ padding: '10px 12px', background: 'transparent', border: '1px solid var(--color-border-mid)', borderRadius: '2px', color: 'var(--color-text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
            ✕
          </button>
        )}
      </form>

      {/* 件数表示 */}
      {(initialQ || initialCat) && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {locale === 'ja' ? `${total}件` : `${total} tools`}
        </p>
      )}

      {/* グリッド */}
      {tools.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {initialQ ? (locale === 'ja' ? `「${initialQ}」に一致するツールが見つかりませんでした。` : `No tools found for "${initialQ}".`) : tt.emptyTools}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {tools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} locale={locale} index={i}
              categorySlug={(tool as any).category_slug ?? categorySlug}
              categoryName={activeCatName ?? (locale === 'ja' ? (tool as any).category_name_ja : (tool as any).category_name_en) ?? categoryName} />
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', gap: '4px', flexWrap: 'wrap' }}>
          {getPages().map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} style={{ padding: '5px 10px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>...</span>
            ) : (
              <a key={p} href={buildUrl(selectedCat, initialQ, p as number)}
                style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.82rem', fontWeight: 700, padding: '5px 10px', minWidth: '34px', textAlign: 'center', textDecoration: 'none', border: `1px solid ${p === currentPage ? theme.accent : 'var(--color-page-btn-border)'}`, borderRadius: '4px', background: p === currentPage ? theme.accent : 'transparent', color: p === currentPage ? '#FFFFFF' : 'var(--color-page-btn-text)', display: 'inline-block' }}>
                {p}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
