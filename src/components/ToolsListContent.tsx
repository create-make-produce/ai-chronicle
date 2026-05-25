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

export default function ToolsListContent({
  tools, locale, title, description, categories = [], initialCat = '', initialQ = '',
}: ToolsListContentProps) {
  const tt        = t[locale];
  const pageTitle = title || tt.navTools;

  return (
    <main className="flex-1" style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section
        className="hero-bg"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderBottom:    '1px solid var(--color-border)',
          paddingTop:      '36px',
          paddingBottom:   '36px',
        }}
      >
        <div className="max-w-7xl mx-auto section-px">
          {/* パンくず */}
          <nav style={{
            display:      'flex',
            flexWrap:     'wrap',
            alignItems:   'center',
            gap:          '0.4rem',
            fontSize:     '0.78rem',
            marginBottom: '1.25rem',
          }}>
            <Link
              href={localizedPath(locale, '/')}
              style={{ color: 'var(--color-text-breadcrumb)', textDecoration: 'none' }}
            >
              {tt.navHome}
            </Link>
            <span style={{ color: 'var(--color-border-mid)' }}>/</span>
            <span style={{ color: 'var(--color-text)' }}>{pageTitle}</span>
          </nav>

          {/* セクションラベル */}
          <span className="section-label" style={{ marginBottom: '10px' }}>AI Tools</span>

          {/* タイトル */}
          <h1 style={{
            fontFamily:    'var(--font-fira), system-ui',
            fontSize:      'clamp(2rem, 5vw, 2.8rem)',
            fontWeight:    900,
            color:         'var(--color-text)',
            lineHeight:    1.1,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            marginTop:     '10px',
            marginBottom:  '10px',
          }}>
            {pageTitle}
          </h1>

          <p style={{
            fontFamily: locale === 'ja' ? 'var(--font-noto), sans-serif' : 'var(--font-inter), sans-serif',
            fontSize:   '0.9rem',
            color:      'var(--color-text-muted)',
            margin:     0,
          }}>
            {description || (locale === 'ja' ? 'すべてのAIツールを一覧で確認' : 'Browse all AI tools in one place')}
          </p>
        </div>
      </section>

      {/* ── コンテンツ ── */}
      <div style={{ background: 'var(--color-page-gradient)' }}>
        <div className="max-w-7xl mx-auto section-px" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <AdSlot slot="header" className="mb-8" />
          <ToolsFilter
            tools={tools}
            locale={locale}
            categories={categories}
            initialCat={initialCat}
            initialQ={initialQ}
          />
        </div>
      </div>
    </main>
  );
}
