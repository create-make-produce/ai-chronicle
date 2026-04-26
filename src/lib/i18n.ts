// src/lib/i18n.ts
// 日本語・英語の文言・パス変換ヘルパー

import type { Locale } from '@/types';

export const LOCALES: Locale[] = ['ja', 'en'];
export const DEFAULT_LOCALE: Locale = 'ja';

// =============================================
// UI テキスト辞書（画面上の固定文言）
// =============================================

export const t = {
  ja: {
    // サイト名・キャッチ
    siteName: 'AI Chronicle',
    siteNameSub: '',
    heroTitle: 'AIツールを、最新の価格で。',
    heroSub: '数百のAIツールを、USD / 日本公式価格で比較。毎日自動更新。',
    searchPlaceholder: 'ツール名・カテゴリ・キーワードで検索...',

    // ナビゲーション
    navHome: 'ホーム',
    navTools: 'すべてのツール',
    navCategories: 'カテゴリ',
    navNews: 'ニュース',
    navNew: '新着',
    navFree: '無料ツール',
    navAbout: 'サイトについて',
    navContact: 'お問い合わせ',
    navPrivacy: 'プライバシーポリシー',

    // セクション
    secLatestNews: '最新ニュース',
    secNewTools: '新着ツール',
    secPriceChanges: '価格改定',
    secCategories: 'カテゴリ',
    secFreeTools: '無料で使えるツール',
    secSeeAll: 'すべて見る',
    secViewAllNews: 'すべてのニュースを見る',
    secRelatedTools: '関連ツール',
    secRelatedNews: '関連ニュース',

    // 統計
    statsTools: '登録ツール',
    statsNewToday: '本日の新着',
    statsUpdated: '更新ツール',

    // バッジ
    badgeFree: '無料',
    badgeFreePlan: '無料プランあり',
    badgePaid: '有料',
    badgeActive: '稼働中',
    badgeBeta: 'ベータ',
    badgeInactive: '停止中',
    badgeContact: '要問い合わせ',

    // 価格
    priceMonthly: '/月',
    priceAnnual: '/年',
    priceJpOfficial: '日本向け公式価格',
    priceLastChecked: '最終確認',
    priceDisclaimer: '掲載価格は自動収集に基づく参考情報です。実際の価格・プラン詳細は公式サイトでご確認ください。',
    priceHeaderPlan: 'プラン',
    priceHeaderUsd: 'USD',
    priceHeaderJpy: '円',
    priceHeaderFeatures: '主要機能',

    // スペック
    specCompany: '開発会社',
    specCountry: '本社',
    specFounded: '設立',
    specOs: '対応OS',
    specLanguages: '対応言語',
    specHasApi: 'API',
    specHasMobileApp: 'モバイルアプリ',
    specHasChromeExt: 'Chrome拡張',
    specLoginMethods: 'ログイン方法',
    specDataRegion: 'データ保存地域',
    specGdpr: 'GDPR',
    specSoc2: 'SOC2',
    specOss: 'オープンソース',
    specLicense: 'ライセンス',
    specGithub: 'GitHub',
    specYes: '対応',
    specNo: '非対応',
    specUnknown: '不明',

    // CTA
    ctaVisitSite: '公式サイトで見る',
    ctaLearnMore: '詳しく見る',
    ctaAffiliateNote: '※アフィリエイトリンクを含みます',
    ctaShowMore: 'もっと見る',
    ctaBack: '戻る',

    // ニュースタイプ
    newsTypePriceChange: '価格改定',
    newsTypeNewTool: '新リリース',
    newsTypeNewFeature: '新機能',
    newsTypeOther: 'その他',

    // フィルター
    filterAll: 'すべて',
    filterFreeOnly: '無料プランあり',
    filterJaSupport: '日本語対応',
    filterApiOnly: 'API提供あり',
    filterSortNewest: '新着順',
    filterSortPriceAsc: '価格安い順',
    filterSortPopular: '人気順',

    // 比較
    compareTitle: '横並び比較',
    compareHint: '2〜3件選択して比較できます',
    compareSelect: '比較に追加',
    compareRemove: '外す',
    compareClear: 'クリア',

    // 状態
    emptyTools: '該当するツールはまだありません。',
    emptyNews: 'ニュースはまだありません。',
    loading: '読み込み中...',

    // 共通
    moreInfo: '詳細',
    optional: '任意',
    required: '必須',
    yes: 'はい',
    no: 'いいえ',

    // フッター
    footerDisclaimer: '当サイトに掲載されているAIツールの価格・機能・仕様等の情報は、自動収集システムにより取得した参考情報です。情報の正確性・完全性を保証するものではありません。最新・正確な情報は各ツールの公式サイトをご確認ください。',
    footerCopyright: '© AI Chronicle',

    // Contact
    contactTitle: 'お問い合わせ',
    contactIntro: 'AI Chronicleへのお問い合わせは以下のフォームよりお願いいたします。',

    // About
    aboutTitle: 'AI Chronicleについて',
    aboutLead: 'AI Chronicleは、日米同時展開のAIツール価格比較データベースです。',

    // Privacy
    privacyTitle: 'プライバシーポリシー',
  },
  en: {
    siteName: 'AI Chronicle',
    siteNameSub: '',
    heroTitle: 'Every AI tool, priced right.',
    heroSub: 'Compare hundreds of AI tools with USD and JPY official pricing. Updated daily.',
    searchPlaceholder: 'Search tools, categories, keywords...',

    navHome: 'Home',
    navTools: 'All Tools',
    navCategories: 'Categories',
    navNews: 'News',
    navNew: 'New',
    navFree: 'Free Tools',
    navAbout: 'About',
    navContact: 'Contact',
    navPrivacy: 'Privacy Policy',

    secLatestNews: 'Latest News',
    secNewTools: 'New Tools',
    secPriceChanges: 'Price Updates',
    secCategories: 'Categories',
    secFreeTools: 'Free to Use',
    secSeeAll: 'See all',
    secViewAllNews: 'View all news',
    secRelatedTools: 'Related tools',
    secRelatedNews: 'Related news',

    statsTools: 'Tools',
    statsNewToday: 'Added today',
    statsUpdated: 'Updated',

    badgeFree: 'Free',
    badgeFreePlan: 'Free plan',
    badgePaid: 'Paid',
    badgeActive: 'Active',
    badgeBeta: 'Beta',
    badgeInactive: 'Inactive',
    badgeContact: 'Contact us',

    priceMonthly: '/mo',
    priceAnnual: '/yr',
    priceJpOfficial: 'Official JP price',
    priceLastChecked: 'Last checked',
    priceDisclaimer: "Prices shown are collected automatically and may not reflect current pricing. Please verify on the official website.",
    priceHeaderPlan: 'Plan',
    priceHeaderUsd: 'USD',
    priceHeaderJpy: 'JPY',
    priceHeaderFeatures: 'Key features',

    specCompany: 'Company',
    specCountry: 'HQ',
    specFounded: 'Founded',
    specOs: 'OS',
    specLanguages: 'Languages',
    specHasApi: 'API',
    specHasMobileApp: 'Mobile app',
    specHasChromeExt: 'Chrome extension',
    specLoginMethods: 'Login',
    specDataRegion: 'Data region',
    specGdpr: 'GDPR',
    specSoc2: 'SOC2',
    specOss: 'Open source',
    specLicense: 'License',
    specGithub: 'GitHub',
    specYes: 'Yes',
    specNo: 'No',
    specUnknown: 'Unknown',

    ctaVisitSite: 'Visit official site',
    ctaLearnMore: 'Learn more',
    ctaAffiliateNote: '* Contains affiliate links',
    ctaShowMore: 'Show more',
    ctaBack: 'Back',

    newsTypePriceChange: 'Price update',
    newsTypeNewTool: 'New release',
    newsTypeNewFeature: 'New feature',
    newsTypeOther: 'Other',

    filterAll: 'All',
    filterFreeOnly: 'Has free plan',
    filterJaSupport: 'JP support',
    filterApiOnly: 'Has API',
    filterSortNewest: 'Newest',
    filterSortPriceAsc: 'Price: low to high',
    filterSortPopular: 'Popular',

    compareTitle: 'Side-by-side compare',
    compareHint: 'Select 2-3 tools to compare',
    compareSelect: 'Add to compare',
    compareRemove: 'Remove',
    compareClear: 'Clear',

    emptyTools: 'No tools found yet.',
    emptyNews: 'No news yet.',
    loading: 'Loading...',

    moreInfo: 'Details',
    optional: 'Optional',
    required: 'Required',
    yes: 'Yes',
    no: 'No',

    footerDisclaimer: "Information about AI tools on this site including pricing, features, and specifications is collected automatically and provided for reference only. We do not guarantee the accuracy or completeness of this information. Please verify current information on each tool's official website.",
    footerCopyright: '© AI Chronicle',

    contactTitle: 'Contact',
    contactIntro: 'Please use the form below to contact AI Chronicle.',

    aboutTitle: 'About AI Chronicle',
    aboutLead: 'AI Chronicle is a bilingual (JP/EN) AI tools pricing database.',

    privacyTitle: 'Privacy Policy',
  },
} as const;

// 日英どちらにも使える辞書型
export type TDict = typeof t[keyof typeof t];

// =============================================
// パスヘルパー
// =============================================

/**
 * 指定されたロケール用のパスを生成
 * localizedPath('ja', '/tool/chatgpt') => '/tool/chatgpt'
 * localizedPath('en', '/tool/chatgpt') => '/en/tool/chatgpt'
 */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'ja') return clean;
  // 英語：先頭に /en を付与（ただし / のみは /en に）
  if (clean === '/') return '/en';
  return `/en${clean}`;
}

/**
 * 現在のロケールの反対言語のパスを生成（JP⇔EN切替用）
 */
export function alternatePath(currentLocale: Locale, path: string): string {
  const otherLocale: Locale = currentLocale === 'ja' ? 'en' : 'ja';
  // 現在のパスから /en プレフィックスを除去して、反対側を生成
  const base = currentLocale === 'en' ? path.replace(/^\/en/, '') || '/' : path;
  return localizedPath(otherLocale, base);
}

// =============================================
// 日付フォーマット
// =============================================

export function formatDate(isoString: string | null, locale: Locale): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '-';
    if (locale === 'ja') {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
}

export function formatDateShort(isoString: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  } catch {
    return '-';
  }
}
