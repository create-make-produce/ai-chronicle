export const runtime = 'edge';
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
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result?.[0]?.results ?? [];
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  try {
    let sql = `
      SELECT t.id, t.slug, t.name_ja, t.name_en, t.tagline_ja, t.tagline_en,
             t.description_ja, t.description_en, t.official_url, t.logo_url,
             t.company_name, t.status, t.is_published, t.has_free_plan, t.has_api,
             t.manually_verified, t.category_id, t.product_hunt_url, t.ph_slug,
             t.ph_name, t.search_keywords,
             t.ios_url, t.android_url,
             t.created_at, t.updated_at,
             c.name_ja as category_name_ja, c.slug as category_slug,
             EXISTS (SELECT 1 FROM pricing_plans WHERE tool_id = t.id AND manually_verified = 1) AS has_verified_pricing,
             (SELECT COUNT(*) FROM tool_launches WHERE tool_id = t.id) AS launch_count
      FROM tools t
      LEFT JOIN categories c ON t.category_id = c.id
    `;
    const params: (string | number | null)[] = [];

    if (q) {
      sql += ` WHERE (t.name_ja LIKE ? OR t.name_en LIKE ? OR t.slug LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT 500`;

    const tools = await d1(sql, params);
    return NextResponse.json({ tools, count: tools.length });

  } catch (e) {
    return NextResponse.json({ error: String(e), tools: [] }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });

  const allowed = [
    'name_ja', 'name_en', 'tagline_ja', 'tagline_en',
    'description_ja', 'description_en', 'official_url', 'logo_url',
    'company_name', 'status', 'is_published', 'has_free_plan', 'has_api',
    'category_id', 'manually_verified',
    'ph_name', 'search_keywords',
  ];

  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  for (const key of allowed) {
    if (key in fields) {
      setClauses.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }

  if (setClauses.length === 0) return NextResponse.json({ error: '更新フィールドなし' }, { status: 400 });

  setClauses.push(`updated_at = datetime('now')`);
  params.push(id);

  try {
    await d1(`UPDATE tools SET ${setClauses.join(', ')} WHERE id = ?`, params);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });

  try {
    // 関連テーブルを先に削除（FK制約対応）
    for (const sql of [
      `DELETE FROM tool_tags WHERE tool_id = '${id}'`,
      `DELETE FROM tool_note_articles WHERE tool_id = '${id}'`,
      `DELETE FROM tool_launches WHERE tool_id = '${id}'`,
      `DELETE FROM news WHERE tool_id = '${id}'`,
      `DELETE FROM pricing_plans WHERE tool_id = '${id}'`,
      `DELETE FROM tools WHERE id = '${id}'`,
    ]) {
      await d1(sql);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
