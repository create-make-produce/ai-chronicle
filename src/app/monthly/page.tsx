import Link from 'next/link';
import { Metadata } from 'next';
import MonthSelect from '@/components/MonthSelect';
import ToolCard from '@/components/ToolCard';

export const metadata: Metadata = {
  title: '月刊AIアップデート | AI Chronicle',
  description: '今月アップデートされたAIツールをまとめてチェック。',
};

async function queryD1(sql: string, params: (string | number | null)[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
      next: { revalidate: 3600 },
    }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

async function getAvailableMonths(): Promise<string[]> {
  const rows = await queryD1(
    `SELECT DISTINCT strftime('%Y-%m', updated_at) as month
     FROM tools WHERE is_published = 1 ORDER BY month DESC LIMIT 12`
  );
  return rows.map((r: { month: string }) => r.month);
}

async function getToolsByMonth(ym: string) {
  return queryD1(
    `SELECT t.*,
            c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug,
            (SELECT pp.price_usd FROM pricing_plans pp WHERE pp.tool_id = t.id AND pp.is_free = 0 ORDER BY pp.price_usd ASC LIMIT 1) as min_price_usd,
            (SELECT 1 FROM pricing_plans pp2 WHERE pp2.tool_id = t.id AND pp2.is_free = 1 LIMIT 1) as has_free
     FROM tools t LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_published = 1 AND strftime('%Y-%m', t.updated_at) = ?
     ORDER BY t.updated_at DESC`,
    [ym]
  );
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m, 10)}月`;
}

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const availableMonths = await getAvailableMonths();
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : (availableMonths[0] ?? currentYM);
  const tools = await getToolsByMonth(selectedMonth);
  const idx = availableMonths.indexOf(selectedMonth);
  const prevMonth = idx < availableMonths.length - 1 ? availableMonths[idx + 1] : null;
  const nextMonth = idx > 0 ? availableMonths[idx - 1] : null;

  return (
    <main style={{ minHeight: '100vh', background: '#111318' }}>
      <section style={{ background: 'linear-gradient(135deg, #0A0D12 0%, #111827 100%)', borderBottom: '1px solid rgba(0,140,237,0.15)', padding: '2rem 1.5rem 2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* パンくず */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.25rem' }}>
            <Link href="/" style={{ color: '#4A5568', textDecoration: 'none' }}>ホーム</Link>
            <span>/</span>
            <span style={{ color: '#F0EBE1' }}>月刊AIアップデート</span>
          </nav>

          <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#008CED', marginBottom: '0.75rem' }}>
            Monthly Update
          </p>
          <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            月刊AIアップデート
          </h1>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem', color: '#7A8A99' }}>
            今月アップデートされたAIツールをまとめてチェック
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* 月ナビ prev/next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {prevMonth && (
            <Link href={`/monthly?m=${prevMonth}`} style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.82rem', color: '#7A8A99', textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              ← {formatMonth(prevMonth)}
            </Link>
          )}
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#F0EBE1', padding: '6px 18px', background: 'rgba(0,140,237,0.12)', border: '1px solid rgba(0,140,237,0.3)', borderRadius: '4px' }}>
            {formatMonth(selectedMonth)}
          </span>
          {nextMonth && (
            <Link href={`/monthly?m=${nextMonth}`} style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.82rem', color: '#7A8A99', textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              {formatMonth(nextMonth)} →
            </Link>
          )}
          <span style={{ marginLeft: 'auto', fontFamily: 'Fira Sans, sans-serif', fontSize: '0.82rem', color: '#4A5568' }}>
            {tools.length}件
          </span>
        </div>

        <MonthSelect months={availableMonths} selectedMonth={selectedMonth} basePath="/monthly" lang="ja" />

        {tools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#4A5568', fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem' }}>
            {formatMonth(selectedMonth)}のアップデートはまだありません。
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem 1.25rem', paddingTop: '0.5rem' }}>
            {tools.map((tool: Record<string, unknown>, i: number) => (
              <ToolCard key={tool.id as string} tool={tool as any} locale="ja" index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
