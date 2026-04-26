// src/components/SearchBox.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/types';
import { t, localizedPath } from '@/lib/i18n';

export default function SearchBox({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`${localizedPath(locale, '/tools')}?q=${encodeURIComponent(q)}`);
  };
  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
        placeholder={t[locale].searchPlaceholder}
        className="w-full px-4 py-3 pr-12 text-sm focus:outline-none transition-colors"
        style={{
          background: 'var(--color-bg-sub)',
          border: '1px solid var(--color-border-mid)',
          color: 'var(--color-text)',
          borderRadius: '2px',
        }}
        onFocus={e=>(e.currentTarget.style.borderColor='var(--color-accent)')}
        onBlur={e=>(e.currentTarget.style.borderColor='var(--color-border-mid)')}
      />
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-sm transition-colors"
        style={{ background:'var(--color-accent)', color:'#000' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </form>
  );
}
