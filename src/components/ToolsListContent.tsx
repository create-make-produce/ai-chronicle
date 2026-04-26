// src/components/ToolsListContent.tsx
import Link from 'next/link';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import ToolsFilter from './ToolsFilter';
import AdSlot from './AdSlot';

interface ToolsListContentProps {
  tools: Tool[];
  locale: Locale;
  title?: string;
  description?: string;
}

export default function ToolsListContent({ tools, locale, title, description }: ToolsListContentProps) {
  const tt = t[locale];
  const pageTitle = title || tt.navTools;

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* パンくず */}
        <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
          <Link href={localizedPath(locale, '/')} className="hover:text-[var(--color-accent)] transition-colors">
            {tt.navHome}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>{pageTitle}</span>
        </nav>

        <h1 className="hero-title text-4xl sm:text-5xl mt-3 mb-3">{pageTitle}</h1>
        {description && (
          <p className="text-base text-[var(--color-text-sub)] max-w-2xl">{description}</p>
        )}
        <div className="mt-4 text-sm text-[var(--color-text-muted)]">
          {tools.length} {locale === 'ja' ? '件' : 'tools'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <AdSlot slot="header" className="mb-8" />
        <ToolsFilter tools={tools} locale={locale} />
      </div>
    </main>
  );
}
