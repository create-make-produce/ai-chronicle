// src/components/SpecTable.tsx
import type { Locale, Tool } from '@/types';
import { t } from '@/lib/i18n';

interface SpecTableProps {
  tool: Tool;
  locale: Locale;
}

export default function SpecTable({ tool, locale }: SpecTableProps) {
  const tt = t[locale];

  const rows: Array<{ label: string; value: string | null | undefined; hint?: string }> = [
    { label: tt.specCompany, value: tool.company_name },
    { label: tt.specCountry, value: tool.company_country },
    { label: tt.specFounded, value: tool.founded_year?.toString() },
    { label: tt.specOs, value: formatArray(tool.os_support) },
    { label: tt.specLanguages, value: formatArray(tool.language_support) },
    { label: tt.specHasApi, value: boolLabel(tool.has_api, tt) },
    { label: tt.specHasMobileApp, value: boolLabel(tool.has_mobile_app, tt) },
    { label: tt.specHasChromeExt, value: boolLabel(tool.has_chrome_ext, tt) },
    { label: tt.specLoginMethods, value: formatArray(tool.login_methods) },
    { label: tt.specDataRegion, value: tool.data_storage_region },
    { label: tt.specGdpr, value: tool.gdpr_compliant == null ? null : boolLabel(tool.gdpr_compliant, tt) },
    { label: tt.specSoc2, value: tool.soc2_certified == null ? null : boolLabel(tool.soc2_certified, tt) },
    { label: tt.specOss, value: boolLabel(tool.is_open_source, tt) },
    { label: tt.specLicense, value: tool.license_type },
  ];

  const visibleRows = rows.filter((r) => r.value);

  return (
    <div className="border border-[var(--color-border)] rounded-sm overflow-hidden">
      <dl className="divide-y divide-[var(--color-border)]">
        {visibleRows.map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="col-span-1 text-sm font-bold text-[var(--color-text-sub)]">
              {row.label}
            </dt>
            <dd className="col-span-2 text-sm text-[var(--color-text)]">
              {row.value}
            </dd>
          </div>
        ))}

        {tool.github_url && (
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="col-span-1 text-sm font-bold text-[var(--color-text-sub)]">
              {tt.specGithub}
            </dt>
            <dd className="col-span-2 text-sm">
              <a
                href={tool.github_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="link-underline text-[var(--color-accent)]"
              >
                {tool.github_url.replace('https://github.com/', '')}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {visibleRows.length === 0 && !tool.github_url && (
        <p className="px-4 py-6 text-sm text-[var(--color-text-muted)] text-center">
          {locale === 'ja' ? '詳細情報は公式サイトをご確認ください。' : 'See the official site for specs.'}
        </p>
      )}
    </div>
  );
}

function formatArray(json: string | null): string | null {
  if (!json) return null;
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.filter((x) => typeof x === 'string').join(' · ');
  } catch {
    return null;
  }
}

function boolLabel(v: number | null, tt: typeof t['ja']): string {
  if (v == null) return tt.specUnknown;
  return v === 1 ? tt.specYes : tt.specNo;
}
