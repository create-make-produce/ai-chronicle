// src/components/DisclaimerBadge.tsx
import type { Locale } from '@/types';
import { t } from '@/lib/i18n';

interface DisclaimerBadgeProps {
  locale: Locale;
  compact?: boolean;
}

export default function DisclaimerBadge({ locale, compact = false }: DisclaimerBadgeProps) {
  const tt = t[locale];

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
        <span className="badge badge-warn">i</span>
        <span>{locale === 'ja' ? '参考情報' : 'Reference only'}</span>
      </span>
    );
  }

  return (
    <div className="bg-[var(--color-warn-bg)] border border-[var(--color-warn)]/20 rounded-sm p-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-warn)] text-white text-xs font-bold flex items-center justify-center">
          !
        </span>
        <p className="text-xs text-[var(--color-warn)] leading-relaxed">
          {tt.priceDisclaimer}
        </p>
      </div>
    </div>
  );
}
