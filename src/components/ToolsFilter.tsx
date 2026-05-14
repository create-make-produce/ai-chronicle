// src/components/ToolsFilter.tsx
'use client';
import { useState, useMemo } from 'react';
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
}

type SortKey = 'newest' | 'name';
const PER_PAGE = 12;

export default function ToolsFilter({ tools, locale, categorySlug, categoryName, categories = [], initialCat = '', initialQ = '' }: ToolsFilterProps) {
  const [query,       setQuery]       = useState(initialQ);
  const [inputValue,  setInputValue]  = useState(initialQ);
  const [selectedCat, setSelectedCat] = useState(initialCat || categorySlug || '');
  const [sort,        setSort]        = useState<SortKey>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const tt = t[locale];

  const resetPage = () => setCurrentPage(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue.trim());
    resetPage();
  };

  const filtered = useMemo(() => {
    let r = [...tools];
    if (query) {
      const q = query.toLowerCase();
      r = r.filter(tool => {
        const fields = [
          tool.name_ja, tool.name_en,
          tool.tagline_ja, tool.tagline_en,
          tool.description_ja, tool.description_en,
        ].filter(Boolean).join(' ').toLowerCase();
        return fields.includes(q);
      });
    }
    if (selectedCat) r = r.filter(tool => (tool as any).category_slug === selectedCat);
    if (sort === 'newest') r.sort((a, b) => b.created_at > a.created_at ? 1 : -1);
    if (sort === 'name')   r.sort((a, b) => {
      const an = locale === 'ja' ? a.name_ja : a.name_en;
      const bn = locale === 'ja' ? b.name_ja : b.name_en;
      return an.localeCompare(bn);
    });
    return r;
  }, [tools, query, selectedCat, sort, locale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const activeCatName = categories.find(c => c.slug === selectedCat)?.[locale === 'ja' ? 'name_ja' : 'name_en'] ?? null;

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }
    return pages;
  };

  const selectStyle: React.CSSProperties = {
    fontFamily: 'Noto Sans JP, sans-serif',
    fontSize: '0.85rem',
    padding: '10px 12px',
    background: 'var(--color-bg-sub)',
    border: '1px solid rgba(0,140,237,0.3)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div>
      {/* スマホ：カテゴリドロップダウンを上に表示 */}
      {categories.length > 0 && (
        <div className="tools-cat-mobile" style={{ marginBottom: '0.75rem' }}>
          <select
            value={selectedCat}
            onChange={e => { setSelectedCat(e.target.value); resetPage(); }}
            style={{ ...selectStyle, width: '100%', borderRadius: '2px' }}
          >
            <option value="">{locale === 'ja' ? 'すべてのカテゴリ' : 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat.slug} value={cat.slug}>
                {locale === 'ja' ? cat.name_ja : cat.name_en}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 検索ボックス（PC：左にカテゴリドロップダウン） */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        {categories.length > 0 && (
          <div className="tools-cat-pc">
            <select
              value={selectedCat}
              onChange={e => { setSelectedCat(e.target.value); resetPage(); }}
              style={{ ...selectStyle, height: '100%', borderRadius: '2px', minWidth: '160px' }}
            >
              <option value="">{locale === 'ja' ? 'すべてのカテゴリ' : 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {locale === 'ja' ? cat.name_ja : cat.name_en}
                </option>
              ))}
            </select>
          </div>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={locale === 'ja' ? 'ツール名・機能・用途で検索...' : 'Search by name, feature, or use case...'}
          style={{ flex: 1, maxWidth: '420px', fontFamily: 'var(--font-noto), sans-serif', fontSize: '0.88rem', padding: '10px 14px', background: 'var(--color-bg-sub)', border: '1px solid rgba(0,140,237,0.3)', borderRight: 'none', borderRadius: '2px 0 0 2px', color: 'var(--color-text)', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,140,237,0.8)'; if(e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.borderColor = 'rgba(0,140,237,0.8)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,140,237,0.3)'; if(e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.borderColor = '#008CED'; }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#008CED', border: '1px solid #008CED', borderRadius: '0 2px 2px 0', color: '#000', fontFamily: 'var(--font-fira), system-ui', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {locale === 'ja' ? '検索' : 'Search'}
        </button>
        {query && (
          <button type="button" onClick={() => { setQuery(''); setInputValue(''); resetPage(); }}
            style={{ padding: '10px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '2px', color: 'var(--color-text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
            ✕
          </button>
        )}

      </form>

      {/* 検索中の表示 */}
      {query && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {locale === 'ja' ? `「${query}」の検索結果：${filtered.length}件` : `Results for "${query}": ${filtered.length} tools`}
        </p>
      )}

      {/* グリッド */}
      {paged.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {query
            ? (locale === 'ja' ? `「${query}」に一致するツールが見つかりませんでした。` : `No tools found for "${query}".`)
            : tt.emptyTools}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {paged.map((tool, i) => (
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
              <span key={`e-${i}`} style={{ padding: '5px 10px', color: '#4A5568', fontSize: '0.82rem' }}>...</span>
            ) : (
              <button type="button" key={p}
                onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.82rem', fontWeight: 700, padding: '5px 10px', minWidth: '34px', border: `1px solid ${p === safePage ? '#008CED' : 'rgba(255,255,255,0.08)'}`, borderRadius: '4px', background: p === safePage ? '#008CED' : 'transparent', color: p === safePage ? '#000' : '#7A8A99', cursor: 'pointer' }}>
                {p}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
