'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MonthSelectProps {
  months: string[];
  selectedMonth: string;
  basePath: string;
  lang?: 'ja' | 'en';
}

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonth(ym: string, lang: 'ja' | 'en') {
  const [y, m] = ym.split('-');
  if (lang === 'en') return `${MONTHS_EN[parseInt(m, 10) - 1]} ${y}`;
  return `${y}年${parseInt(m, 10)}月`;
}

export default function MonthSelect({ months, selectedMonth, basePath, lang = 'ja' }: MonthSelectProps) {
  const router = useRouter();
  const [value, setValue] = useState(selectedMonth);

  if (months.length <= 1) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* ラベル（固定テキスト → Fira Sans サブセット） */}
      <label style={{ fontFamily: 'Fira Sans, system-ui', fontSize: '0.78rem', color: 'var(--color-text-sub)', marginRight: '0.75rem' }}>
        {lang === 'ja' ? '期間を選択：' : 'Select period:'}
      </label>
      {/* 選択肢は動的（年月名）→ システムフォント */}
      <select
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          router.push(`${basePath}?m=${e.target.value}`);
        }}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
          fontSize: '0.85rem',
          color: 'var(--color-text)',
          background: 'var(--color-select-bg)',
          border: '1px solid rgba(0,140,237,0.3)',
          borderRadius: '4px',
          padding: '7px 14px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'auto',
        }}
      >
        {months.map((m) => (
          <option key={m} value={m} style={{ background: 'var(--color-select-bg)' }}>
            {formatMonth(m, lang)}
          </option>
        ))}
      </select>
    </div>
  );
}
