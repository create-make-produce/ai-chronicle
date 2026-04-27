// src/components/ToolsListContent.tsx
import Link from 'next/link';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';
import ToolsFilter from './ToolsFilter';
import AdSlot from './AdSlot';

interface Category {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
}

interface ToolsListContentProps {
  tools: Tool[];
  locale: Locale;
  title?: string;
  description?: string;
  categories?: Category[];
  initialCat?: string;
  initialQ?: string;
}

export default function ToolsListContent({ tools, locale, title, description, categories = [], initialCat = '', initialQ = '' }: ToolsListContentProps) {
  const tt = t[locale];
  const pageTitle = title || tt.navTools;

  return (
    <main className="flex-1">
      <section style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #112240 60%, #0A1A35 100%)', borderBottom: '1px solid rgba(0,140,237,0.15)', padding: '2rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.25rem' }}>
            <Link href={localizedPath(locale, '/')} style={{ color: '#4A5568', textDecoration: 'none' }}>
              {tt.navHome}
            </Link>
            <span>/</span>
            <span style={{ color: '#F0EBE1' }}>{pageTitle}</span>
          </nav>
          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#008CED', marginBottom: '0.5rem' }}>
            AI Tools
          </p>
          <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            {pageTitle}
          </h1>
          <p style={{ fontFamily: locale === 'ja' ? 'Noto Sans JP, sans-serif' : 'Inter, sans-serif', fontSize: '0.9rem', color: '#7A8A99', margin: 0 }}>
            {description || (locale === 'ja' ? 'すべてのAIツールを一覧で確認' : 'Browse all AI tools in one place')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <AdSlot slot="header" className="mb-8" />
        <ToolsFilter
          tools={tools}
          locale={locale}
          categories={categories}
          initialCat={initialCat}
          initialQ={initialQ}
        />
      </div>
    </main>
  );
}
