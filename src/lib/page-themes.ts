// src/lib/page-themes.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ページごとのアクセントカラー一元管理
// ここを変えるだけで全ページに反映される
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type PageTheme = {
  /** ボタン・ラベル等のメインカラー */
  accent: string;
  /** ホバー時 */
  accentHover: string;
  /** 薄背景用（バッジ背景等） */
  accentBg: string;
  /** rgba用 "R,G,B" 形式 */
  rgb: string;
};

export const PAGE_THEMES = {
  /** TOP / デフォルト */
  home: {
    accent:      '#008CED',
    accentHover: '#006FC0',
    accentBg:    '#EBF5FF',
    rgb:         '0,140,237',
  },
  /** /news, /news/[slug] */
  news: {
    accent:      '#DC2626',
    accentHover: '#B91C1C',
    accentBg:    '#FEF2F2',
    rgb:         '220,38,38',
  },
  /** /monthly */
  monthly: {
    accent:      '#059669',
    accentHover: '#047857',
    accentBg:    '#ECFDF5',
    rgb:         '5,150,105',
  },
  /** /tools, /tool/[slug] */
  tools: {
    accent:      '#D97706',
    accentHover: '#B45309',
    accentBg:    '#FFFBEB',
    rgb:         '217,119,6',
  },
  /** /features, /feature/[slug] */
  features: {
    accent:      '#7C3AED',
    accentHover: '#6D28D9',
    accentBg:    '#F5F3FF',
    rgb:         '124,58,237',
  },
} as const satisfies Record<string, PageTheme>;

export type ThemeKey = keyof typeof PAGE_THEMES;

/**
 * パス文字列からテーマを返す（Header.tsx のクライアント側で使用）
 */
export function getThemeByPath(pathname: string): PageTheme {
  if (pathname.startsWith('/news'))                              return PAGE_THEMES.news;
  if (pathname.startsWith('/monthly'))                          return PAGE_THEMES.monthly;
  if (pathname.startsWith('/tools') || pathname.startsWith('/tool/')) return PAGE_THEMES.tools;
  if (pathname.startsWith('/features') || pathname.startsWith('/feature/')) return PAGE_THEMES.features;
  return PAGE_THEMES.home;
}
