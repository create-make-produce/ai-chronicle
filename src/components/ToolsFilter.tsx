// src/components/ToolsFilter.tsx
'use client';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
}

type SortKey = 'newest' | 'name';
const PER_PAGE = 12;

export default function ToolsFilter({ tools, locale, categorySlug, categoryName, categories = [] }: ToolsFilterProps) {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat') ?? categorySlug ?? '';
  const initialQ   = searchParams.get('q') ?? '';

  const [query,       setQuery]       = useState(initialQ);
  const [inputValue,  setInputValue]  = useState(initialQ);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [freeOnly,    setFreeOnly]    = useState(false);
  const [jaOnly,      setJaOnly]      = useState(false);
  const [apiOnly,     setApiOnly]     = useState(false);
  const [sort,        setSort]        = useState<SortKey>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const tt = t[locale];

  // フィルター変更時はページを1に戻す
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
      r = r.filter(t => {
        const fields = [
          t.name_ja, t.name_en,
          t.tagline_ja, t.tagline_en,
          t.description_ja, t.description_en,
        ].filter(Boolean).join(' ').toLowerCase();
        return fields.includes(q);
      });
    }
    if (selectedCat) r = r.filter(t => (t as any).category_slug === selectedCat);
    if (freeOnly) r = r.filter(t => t.has_free_plan === 1);
    if (apiOnly)  r = r.filter(t => t.has_api === 1);
    if (jaOnly)   r = r.filter(t => {
      try { const a = JSON.parse(t.language_support || '[]'); return Array.isArray(a) && a.includes('ja'); }
      catch { return false; }
    });
    if (sort === 'newest') r.sort((a, b) => b.created_at > a.created_at ? 1 : -1);
    if (sort === 'name')   r.sort((a, b) => {
      const an = locale === 'ja' ? a.name_ja : a.name_en;
      const bn = locale === 'ja' ? b.name_ja : b.name_en;
      return an.localeCompare(bn);
    });
    return r;
  }, [tools, query, selectedCat, freeOnly, jaOnly, apiOnly, sort, locale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const activeCatName = categories.find(c => c.slug === selectedCat)?.[locale === 'ja' ? 'name_ja' : 'name_en'] ?? null;

  // ページ番号ボタン生成
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

  return (
    <div>
      {/* 検索ボックス */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, marginBottom: '1rem' }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={locale === 'ja' ? 'ツール名・機能・用途で検索...' : 'Search by name, feature, or use case...'}
          style={{
            flex: 1,
            fontFamily: 'var(--font-noto), sans-serif',
            fontSize: '0.88rem',
            padding: '10px 14px',
            background: 'var(--color-bg-sub)',
            border: '1px solid var(--color-border-mid)',
            borderRight: 'none',
            borderRadius: '2px 0 0 2px',
            color: 'var(--color-text)',
            outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-mid)'}
        />
        <button type="submit" style={{ padding: '10px 20px', background: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: '0 2px 2px 0', color: '#000', fontFamily: 'var(--font-fira), system-ui', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {locale === 'ja' ? '検索' : 'Search'}
        </button>
        {query && (
          <button type="button" onClick={() => { setQuery(''); setInputValue(''); resetPage(); }}
            style={{ marginLeft: '8px', padding: '10px 12px', background: 'transparent', border: '1px solid var(--color-border-mid)', borderRadius: '2px', color: 'var(--color-text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
            ✕
          </button>
        )}
      </form>

      {/* カテゴリ選択 */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
          <CatChip active={selectedCat === ''} onClick={() => { setSelectedCat(''); resetPage(); }}>
            {locale === 'ja' ? 'すべて' : 'All'}
          </CatChip>
          {categories.map(cat => (
            <CatChip key={cat.slug} active={selectedCat === cat.slug} onClick={() => { setSelectedCat(cat.slug); resetPage(); }}>
              {locale === 'ja' ? cat.name_ja : cat.name_en}
            </CatChip>
          ))}
        </div>
      )}

      {/* フィルターバー */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip active={freeOnly} onClick={() => { setFreeOnly(!freeOnly); resetPage(); }}>{tt.filterFreeOnly}</Chip>
        <Chip active={jaOnly}   onClick={() => { setJaOnly(!jaOnly); resetPage(); }}>{tt.filterJaSupport}</Chip>
        <Chip active={apiOnly}  onClick={() => { setApiOnly(!apiOnly); resetPage(); }}>{tt.filterApiOnly}</Chip>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span style={{ color: 'var(--color-text-muted)' }}>{locale === 'ja' ? '並べ替え：' : 'Sort:'}</span>
          <select value={sort} onChange={e => { setSort(e.target.value as SortKey); resetPage(); }}
            className="px-2 py-1 text-xs"
            style={{ background: 'var(--color-bg-sub)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '2px' }}>
            <option value="newest">{tt.filterSortNewest}</option>
            <option value="name">A-Z</option>
          </select>
        </div>
      </div>

      {/* 検索中の表示 */}
      {query && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {locale === 'ja' ? `「${query}」の検索結果：${filtered.length}件` : `Results for "${query}": ${filtered.length} tools`}
        </p>
      )}

      {/* グリッド */}
      {paged.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
          {query
            ? (locale === 'ja' ? `「${query}」に一致するツールが見つかりませんでした。` : `No tools found for "${query}".`)
            : tt.emptyTools}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paged.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} locale={locale} index={i}
              categorySlug={categorySlug} categoryName={activeCatName ?? categoryName} />
          ))}
        </div>
      )}

      {/* ページネーション（下部） */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', gap: '4px', flexWrap: 'wrap' }}>
          {getPages().map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} style={{ padding: '5px 10px', color: '#4A5568', fontSize: '0.82rem' }}>...</span>
            ) : (
              <button
                key={p}
                onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  fontFamily: 'Fira Sans, sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '5px 10px',
                  minWidth: '34px',
                  border: `1px solid ${p === safePage ? '#008CED' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '4px',
                  background: p === safePage ? '#008CED' : 'transparent',
                  color: p === safePage ? '#000' : '#7A8A99',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {p}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 text-xs font-bold border rounded-sm transition-colors"
      style={{ background: active ? 'var(--color-accent)' : 'transparent', color: active ? '#000' : 'var(--color-text-sub)', borderColor: active ? 'var(--color-accent)' : 'var(--color-border-mid)' }}>
      {children}
    </button>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.75rem', fontWeight: active ? 700 : 400, padding: '4px 12px', borderRadius: '2px', border: `1px solid ${active ? '#008CED' : 'var(--color-border-mid)'}`, background: active ? 'rgba(0,140,237,0.15)' : 'transparent', color: active ? '#008CED' : 'var(--color-text-sub)', cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}
