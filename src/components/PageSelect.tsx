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

  const goTo = (p: number) => {
    const query = month ? `?m=${month}&p=${p}` : `?p=${p}`;
    router.push(`${basePath}${query}`);
  };

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const btnBase: React.CSSProperties = {
    fontFamily: 'Fira Sans, sans-serif',
    fontSize: '0.82rem',
    fontWeight: 700,
    padding: '5px 10px',
    minWidth: '34px',
    border: '1px solid var(--color-page-btn-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.12s',
    textAlign: 'center',
    background: 'transparent',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ ...btnBase, border: 'none', color: 'var(--color-text-muted)', cursor: 'default' }}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            style={{
              ...btnBase,
              background: p === currentPage ? '#008CED' : 'transparent',
              color: p === currentPage ? '#000' : 'var(--color-page-btn-text)',
              borderColor: p === currentPage ? '#008CED' : 'var(--color-page-btn-border)',
            }}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}
