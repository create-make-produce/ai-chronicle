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

export default function ToolsFilter({ tools, locale, categorySlug, categoryName, categories = [] }: ToolsFilterProps) {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat') ?? categorySlug ?? '';

  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [freeOnly, setFreeOnly]   = useState(false);
  const [jaOnly,   setJaOnly]     = useState(false);
  const [apiOnly,  setApiOnly]    = useState(false);
  const [sort,     setSort]       = useState<SortKey>('newest');
  const tt = t[locale];

  const filtered = useMemo(() => {
    let r = [...tools];
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
  }, [tools, selectedCat, freeOnly, jaOnly, apiOnly, sort, locale]);

  // 現在選択中のカテゴリ名
  const activeCatName = categories.find(c => c.slug === selectedCat)?.[locale === 'ja' ? 'name_ja' : 'name_en'] ?? null;

  return (
    <div>
      {/* カテゴリ選択 */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
          <CatChip
            active={selectedCat === ''}
            onClick={() => setSelectedCat('')}
          >
            {locale === 'ja' ? 'すべて' : 'All'}
          </CatChip>
          {categories.map(cat => (
            <CatChip
              key={cat.slug}
              active={selectedCat === cat.slug}
              onClick={() => setSelectedCat(cat.slug)}
            >
              {locale === 'ja' ? cat.name_ja : cat.name_en}
            </CatChip>
          ))}
        </div>
      )}

      {/* フィルターバー */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>{tt.filterFreeOnly}</Chip>
        <Chip active={jaOnly}   onClick={() => setJaOnly(!jaOnly)}>{tt.filterJaSupport}</Chip>
        <Chip active={apiOnly}  onClick={() => setApiOnly(!apiOnly)}>{tt.filterApiOnly}</Chip>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span style={{ color: 'var(--color-text-muted)' }}>
            {locale === 'ja' ? '並べ替え：' : 'Sort:'}
          </span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="px-2 py-1 text-xs"
            style={{ background: 'var(--color-bg-sub)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '2px' }}
          >
            <option value="newest">{tt.filterSortNewest}</option>
            <option value="name">A-Z</option>
          </select>
        </div>
      </div>

      {/* グリッド */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm"
          style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
          {tt.emptyTools}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tool, i) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              locale={locale}
              index={i}
              categorySlug={categorySlug}
              categoryName={activeCatName ?? categoryName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-bold border rounded-sm transition-colors"
      style={{
        background:  active ? 'var(--color-accent)'  : 'transparent',
        color:       active ? '#000'                 : 'var(--color-text-sub)',
        borderColor: active ? 'var(--color-accent)'  : 'var(--color-border-mid)',
      }}
    >
      {children}
    </button>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'Noto Sans JP, sans-serif',
        fontSize: '0.75rem',
        fontWeight: active ? 700 : 400,
        padding: '4px 12px',
        borderRadius: '2px',
        border: `1px solid ${active ? '#008CED' : 'var(--color-border-mid)'}`,
        background: active ? 'rgba(0,140,237,0.15)' : 'transparent',
        color: active ? '#008CED' : 'var(--color-text-sub)',
        cursor: 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
