// src/components/CategoryCompare.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { Locale, Tool } from '@/types';
import { t, localizedPath } from '@/lib/i18n';

interface CategoryCompareProps {
  tools: Tool[];
  locale: Locale;
}

export default function CategoryCompare({ tools, locale }: CategoryCompareProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const tt = t[locale];
  const MAX_COMPARE = 3;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const selectedTools = useMemo(
    () => selectedIds.map((id) => tools.find((t) => t.id === id)).filter((x): x is Tool => !!x),
    [selectedIds, tools],
  );

  const compareRows: Array<{ label: string; get: (t: Tool) => string | React.ReactNode }> = [
    {
      label: locale === 'ja' ? '無料プラン' : 'Free plan',
      get: (t) => (t.has_free_plan === 1 ? tt.specYes : tt.specNo),
    },
    {
      label: 'API',
      get: (t) => (t.has_api === 1 ? tt.specYes : tt.specNo),
    },
    {
      label: locale === 'ja' ? 'モバイル' : 'Mobile',
      get: (t) => (t.has_mobile_app === 1 ? tt.specYes : tt.specNo),
    },
    {
      label: locale === 'ja' ? '日本語対応' : 'JP support',
      get: (t) => {
        const langs = safeParseArray(t.language_support);
        return langs.includes('ja') ? tt.specYes : tt.specNo;
      },
    },
    {
      label: locale === 'ja' ? '開発会社' : 'Company',
      get: (t) => t.company_name || '—',
    },
  ];

  return (
    <div className="mb-12">
      {/* 見出し */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">{tt.compareTitle}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{tt.compareHint}</p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs font-bold text-[var(--color-text-sub)] hover:text-[var(--color-text)]"
          >
            {tt.compareClear}
          </button>
        )}
      </div>

      {/* 選択チップ */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tools.slice(0, 12).map((tool) => {
          const name = locale === 'ja' ? tool.name_ja : tool.name_en;
          const selected = selectedIds.includes(tool.id);
          const disabled = !selected && selectedIds.length >= MAX_COMPARE;
          return (
            <button
              key={tool.id}
              onClick={() => toggleSelect(tool.id)}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm border rounded-sm transition-colors ${
                selected
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : disabled
                  ? 'text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed'
                  : 'text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
              }`}
            >
              {selected && <span className="mr-1">✓</span>}
              {name}
            </button>
          );
        })}
      </div>

      {/* 比較テーブル */}
      <AnimatePresence>
        {selectedTools.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto border border-[var(--color-border)] rounded-sm">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th className="w-36"></th>
                    {selectedTools.map((tool) => (
                      <th key={tool.id}>
                        <Link
                          href={localizedPath(locale, `/tool/${tool.slug}`)}
                          className="link-underline font-bold text-sm"
                        >
                          {locale === 'ja' ? tool.name_ja : tool.name_en}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr key={i}>
                      <td className="font-bold text-[var(--color-text-sub)] text-xs uppercase tracking-wide">
                        {row.label}
                      </td>
                      {selectedTools.map((tool) => (
                        <td key={tool.id}>{row.get(tool)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function safeParseArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
