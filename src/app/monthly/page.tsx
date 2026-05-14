export const runtime = 'edge';

import Link from 'next/link';
import { Metadata } from 'next';
import PageSelect from '@/components/PageSelect';
import ToolCard from '@/components/ToolCard';

export const metadata: Metadata = {
  title: '月刊AIアップデート | AI Chronicle',
  description: '最新アップデートされたAIツールをまとめてチェック。',
};

const PER_PAGE = 12;

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

async function getAllTools() {
  return queryD1(
    `SELECT t.*, c.name_ja as category_name_ja, c.name_en as category_name_en, c.slug as category_slug
     FROM tools t LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_published = 1 ORDER BY t.updated_at DESC`
  );
}

async function getThisMonthCount() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rows = await queryD1(
    `SELECT COUNT(*) as count FROM tools WHERE is_published = 1 AND strftime('%Y-%m', updated_at) = ?`,
    [ym]
  );
  return (rows[0]?.count as number) ?? 0;
}

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;
  const [allTools, thisMonthCount] = await Promise.all([getAllTools(), getThisMonthCount()]);
  const totalPages = Math.max(1, Math.ceil(allTools.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(sp.p ?? '1', 10)), totalPages);
  const tools = allTools.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #040912 0%, #0A1628 60%, #081428 100%)' }}>
      <section style={{ position: 'relative', overflow: 'hidden', background: '#040912', borderBottom: '1px solid rgba(0,140,237,0.15)', paddingTop: '16px', paddingBottom: '24px' }}>
        {/* 背景：青い斜め帯 + ドット + 縦線 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '55%', height: '140%', background: 'linear-gradient(135deg, rgba(0,80,180,0.18) 0%, rgba(0,140,237,0.08) 100%)', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', top: '-20%', right: '15%', width: '2px', height: '140%', background: 'rgba(0,140,237,0.2)', transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,140,237,0.12) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#4A5568', marginBottom: '1.25rem' }}>
            <Link href="/" style={{ color: '#4A5568', textDecoration: 'none' }}>ホーム</Link>
            <span>/</span>
            <span style={{ color: '#F0EBE1' }}>月刊AIアップデート</span>
          </nav>

          {/* タイトル + 右側ラベル */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#008CED', marginBottom: '0.5rem' }}>
                Monthly Update
              </p>
              <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#F0EBE1', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                月刊AIアップデート
              </h1>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem', color: '#7A8A99', margin: 0 }}>
                今月更新のAIツール（{thisMonthCount}件更新）
              </p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {allTools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#4A5568', fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem' }}>
            アップデート情報はまだありません。
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem 1.25rem' }}>
              {tools.map((tool: Record<string, unknown>, i: number) => (
                <ToolCard key={tool.id as string} tool={tool as any} locale="ja" index={i}
                  categoryName={tool.category_name_ja as string | undefined} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                <PageSelect currentPage={currentPage} totalPages={totalPages} basePath="/monthly" lang="ja" />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
