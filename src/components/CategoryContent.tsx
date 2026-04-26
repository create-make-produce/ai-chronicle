// src/components/CategoryContent.tsx
import Link from 'next/link';
import type { Locale, Tool, Category } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import ToolsFilter from './ToolsFilter';
import AdSlot from './AdSlot';

interface CategoryContentProps {
  category: Category;
  tools: Tool[];
  locale: Locale;
  totalCount: number;
}

export default function CategoryContent({ category, tools, locale, totalCount }: CategoryContentProps) {
  const tt = t[locale];
  const name = locale === 'ja' ? category.name_ja : category.name_en;
  const description = locale === 'ja' ? category.description_ja : category.description_en;

  return (
    <main className="flex-1">
      {/* パンくず */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Link href={localizedPath(locale, '/')} className="hover:text-[var(--color-accent)] transition-colors">{tt.navHome}</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>{name}</span>
        </nav>
      </div>

      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="section-label mb-3">{locale === 'ja' ? 'AIカテゴリ' : 'AI Category'}</p>
        <h1 className="font-display text-4xl sm:text-6xl mb-3" style={{ color: 'var(--color-text)' }}>
          {name}
        </h1>
        {description && (
          <p className="text-sm max-w-2xl mb-3" style={{ color: 'var(--color-text-sub)' }}>{description}</p>
        )}
        <p className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
          {totalCount} tools
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <AdSlot slot="header" className="mb-8" />
        <ToolsFilter
          tools={tools}
          locale={locale}
          categorySlug={category.slug}
          categoryName={name}
        />
      </div>
    </main>
  );
}
