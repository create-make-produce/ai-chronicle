// src/lib/price.ts
// 価格表示ロジック
// 設計図10章に従う：
// - 為替換算は一切しない
// - 日本公式価格があれば円表示、なければハイフン

import type { Locale } from '@/types';
import type { PricingPlan } from '@/types';
import { t } from './i18n';

export function formatUsd(priceUsd: number | null, locale: Locale, isFree = false): string {
  if (isFree) return t[locale].badgeFree;
  if (priceUsd == null) return t[locale].badgeContact;
  // 小数点ありかなしか
  const formatted = priceUsd % 1 === 0 ? priceUsd.toString() : priceUsd.toFixed(2);
  return `$${formatted}${t[locale].priceMonthly}`;
}

export function formatJpy(plan: PricingPlan, locale: Locale): string {
  if (plan.is_free === 1) return t[locale].badgeFree;
  if (plan.has_japan_pricing === 1 && plan.price_jpy_official != null) {
    const yen = plan.price_jpy_official.toLocaleString('ja-JP');
    const suffix = locale === 'ja' ? '（日本向け公式）' : ' (Official JP)';
    return `¥${yen}${t[locale].priceMonthly}${suffix}`;
  }
  return '—';
}

export function formatPriceTrend(plan: PricingPlan): { label: string; type: 'up' | 'down' | 'stable' | null } | null {
  if (!plan.price_trend) return null;
  if (plan.price_trend === 'up') return { label: '▲', type: 'up' };
  if (plan.price_trend === 'down') return { label: '▼', type: 'down' };
  return null;
}

/**
 * 価格改定セクション用：変化量の文字列
 * 例: "$20 → $25 (+25%)"
 */
export function formatPriceChange(plan: Pick<PricingPlan, 'previous_price_usd' | 'price_usd'>): string {
  if (plan.previous_price_usd == null || plan.price_usd == null) return '';
  const from = plan.previous_price_usd;
  const to = plan.price_usd;
  const diff = to - from;
  const pct = from !== 0 ? Math.round((diff / from) * 100) : 0;
  const sign = diff > 0 ? '+' : '';
  return `$${from} → $${to} (${sign}${pct}%)`;
}

/**
 * 日本公式価格の変化量
 */
export function formatPriceChangeJpy(plan: PricingPlan): string | null {
  if (plan.has_japan_pricing !== 1 || plan.price_jpy_official == null) return null;
  return `¥${plan.price_jpy_official.toLocaleString('ja-JP')}`;
}
