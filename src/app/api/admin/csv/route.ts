import { NextRequest, NextResponse } from 'next/server';



function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_TOKEN;
}

async function d1(sql: string, params: (string | number | null)[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId      = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token     = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
    }
  );
  const data = await res.json() as any;
  return data.result?.[0]?.results ?? [];
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// カラム名の日本語マッピング
const TOOL_COLUMNS: Record<string, string> = {
  id:                 'ID',
  slug:               'スラッグ',
  name_ja:            'ツール名（日本語）',
  name_en:            'ツール名（英語）',
  tagline_ja:         'タグライン（日本語）',
  tagline_en:         'タグライン（英語）',
  description_ja:     '概要（日本語）',
  description_en:     '概要（英語）',
  official_url:       '公式URL',
  logo_url:           'ロゴURL',
  company_name:       '会社名',
  status:             'ステータス',
  is_published:       '公開(1=公開/0=非公開)',
  has_free_plan:      '無料プラン(1=あり/0=なし)',
  has_api:            'API提供(1=あり/0=なし)',
  manually_verified:  'ツール内容固定(1=固定/0=自動更新)',
  category_id:        'カテゴリID',
  category_name_ja:   'カテゴリ名（日本語）',
  data_source:        'データソース',
  created_at:         '登録日時',
  updated_at:         '更新日時',
};

// GET: CSV出力（BOM付き・2行目日本語）
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const rows: Record<string, unknown>[] = await d1(`
    SELECT t.id, t.slug, t.name_ja, t.name_en, t.tagline_ja, t.tagline_en,
           t.description_ja, t.description_en, t.official_url, t.logo_url,
           t.company_name, t.status, t.is_published, t.has_free_plan, t.has_api,
           t.manually_verified, t.category_id, t.data_source, t.created_at, t.updated_at,
           c.name_ja as category_name_ja
    FROM tools t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
  `);

  if (rows.length === 0) {
    return new NextResponse('\uFEFFデータがありません', { status: 200 });
  }

  const headers = Object.keys(rows[0]);
  const jaHeaders = headers.map(h => TOOL_COLUMNS[h] ?? h);

  const csvLines = [
    headers.join(','),                                                           // 1行目：英語カラム名
    jaHeaders.map(h => escapeCSV(h)).join(','),                                  // 2行目：日本語カラム名
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),           // 3行目以降：データ
  ];

  // BOM付きUTF-8でExcelが文字化けしない
  const BOM = '\uFEFF';
  const csv = BOM + csvLines.join('\n');
  const filename = `ai-chronicle-tools-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// POST: CSVインポート（1行目ヘッダー・2行目日本語説明をスキップ・idキーで上書き）
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json() as { rows: Record<string, string>[] };
  const { rows } = body;

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'データがありません' }, { status: 400 });
  }

  const allowed = [
    'name_ja', 'name_en', 'tagline_ja', 'tagline_en',
    'description_ja', 'description_en', 'official_url', 'logo_url',
    'company_name', 'status', 'is_published', 'has_free_plan', 'has_api',
    'manually_verified',
  ];

  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const id = row['id'];
    if (!id || id === 'ID') { continue; } // ヘッダー行・日本語行をスキップ

    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    for (const key of allowed) {
      if (key in row && row[key] !== undefined) {
        setClauses.push(`${key} = ?`);
        const val = row[key];
        params.push(val === '' ? null : val);
      }
    }

    if (setClauses.length === 0) continue;

    setClauses.push(`updated_at = datetime('now')`);
    params.push(id);

    try {
      await d1(`UPDATE tools SET ${setClauses.join(', ')} WHERE id = ?`, params);
      updated++;
    } catch (e) {
      errors.push(`id=${id}: ${e}`);
    }
  }

  return NextResponse.json({ ok: true, updated, errors });
}
