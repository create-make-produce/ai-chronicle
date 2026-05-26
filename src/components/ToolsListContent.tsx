// src/components/ToolsListContent.tsx
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import ToolsFilter from './ToolsFilter';
import AdSlot from './AdSlot';
import PageHero, { PageHeroTitle } from './PageHero';
import { PAGE_THEMES } from '@/lib/page-themes';

interface Category { id: string; slug: string; name_ja: string; name_en: string; }
interface ToolsListContentProps {
  tools: Tool[];
  locale: Locale;
  title?: string;
  description?: string;
  categories?: Category[];
  initialCat?: string;
  initialQ?: string;
}

const theme = PAGE_THEMES.tools;

export default function ToolsListContent({
  tools, locale, title, description, categories = [], initialCat = '', initialQ = '',
}: ToolsListContentProps) {
  const tt = t[locale];

  return (
    <main className="flex-1" style={{ minHeight: '100vh' }}>
      <PageHero
        breadcrumbs={[{ label: tt.navHome, href: localizedPath(locale, '/') }, { label: tt.navTools }]}
        watermark="TOOLS"
        theme={theme}
      >
        <PageHeroTitle
          en="AI Tools"
          ja={locale === 'ja' ? 'AIツール一覧' : 'All Tools'}
          theme={theme}
          subtitle={description || (locale === 'ja' ? 'すべてのAIツールを一覧で確認' : 'Browse all AI tools in one place')}
        />
      </PageHero>

      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <AdSlot slot="header" className="mb-8" />
          <ToolsFilter tools={tools} locale={locale} categories={categories} initialCat={initialCat} initialQ={initialQ} theme={theme} />
        </div>
      </div>
    </main>
  );
}
