// src/components/PriceTable.tsx
import type { Locale, PricingPlan } from '@/types';
import { t, formatDate } from '@/lib/i18n';
import { formatUsd, formatJpy } from '@/lib/price';

interface PriceTableProps {
  plans: PricingPlan[];
  locale: Locale;
  lastCheckedAt?: string | null;
}

export default function PriceTable({ plans, locale, lastCheckedAt }: PriceTableProps) {
  const tt = t[locale];

  if (plans.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--color-text-muted)] text-sm border border-[var(--color-border)] rounded-sm">
        {locale === 'ja' ? '価格情報は公式サイトをご確認ください。' : 'Please check the official site for pricing.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-sm">
        <table className="clean-table">
          <thead>
            <tr>
              <th>{tt.priceHeaderPlan}</th>
              <th>{tt.priceHeaderUsd}</th>
              <th>{tt.priceHeaderJpy}</th>
              <th className="hidden md:table-cell">{tt.priceHeaderFeatures}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const name = locale === 'ja' && plan.plan_name_ja ? plan.plan_name_ja : plan.plan_name;
              const features = locale === 'ja' ? plan.features_ja : plan.features_en;
              const featureList = parseJsonArray(features);

              return (
                <tr key={plan.id} className={plan.price_trend === 'up' ? 'price-up' : ''}>
                  <td className="font-bold">{name}</td>
                  <td>
                    <span className={plan.is_free === 1 ? 'badge badge-free' : ''}>
                      {formatUsd(plan.price_usd, locale, plan.is_free === 1)}
                    </span>
                    {plan.price_trend === 'up' && plan.previous_price_usd != null && (
                      <span className="ml-2 text-xs text-[var(--color-warn)]">
                        ▲ ${plan.previous_price_usd} → ${plan.price_usd}
                      </span>
                    )}
                    {plan.price_trend === 'down' && plan.previous_price_usd != null && (
                      <span className="ml-2 text-xs text-[var(--color-free)]">
                        ▼ ${plan.previous_price_usd} → ${plan.price_usd}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-sm">
                    {formatJpy(plan, locale)}
                  </td>
                  <td className="hidden md:table-cell text-sm text-[var(--color-text-sub)]">
                    {featureList.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {featureList.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 免責事項 */}
      <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">
        <span className="badge badge-warn mr-2">!</span>
        {tt.priceDisclaimer}
        {lastCheckedAt && (
          <span className="ml-1">
            {tt.priceLastChecked}: {formatDate(lastCheckedAt, locale)}
          </span>
        )}
      </div>
    </div>
  );
}

function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
