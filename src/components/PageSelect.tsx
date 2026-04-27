'use client';
import { useRouter } from 'next/navigation';

interface PageSelectProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  month?: string;
  lang?: 'ja' | 'en';
}

export default function PageSelect({ currentPage, totalPages, basePath, month, lang = 'ja' }: PageSelectProps) {
  const router = useRouter();
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.75rem', color: '#4A5568' }}>
        {lang === 'ja' ? 'ページ：' : 'Page:'}
      </span>
      <select
        value={currentPage}
        onChange={(e) => {
          const p = Number(e.target.value);
          const query = month ? `?m=${month}&p=${p}` : `?p=${p}`;
          router.push(`${basePath}${query}`);
        }}
        style={{
          fontFamily: 'Fira Sans, sans-serif',
          fontSize: '0.85rem',
          color: '#F0EBE1',
          background: '#1A1D24',
          border: '1px solid rgba(0,140,237,0.3)',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <option key={p} value={p} style={{ background: '#1A1D24' }}>
            {p} / {totalPages}
          </option>
        ))}
      </select>
    </div>
  );
}
