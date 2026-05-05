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

// GET /api/admin/launches?tool_id=xxx
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const tool_id = new URL(req.url).searchParams.get('tool_id');
  if (!tool_id) return NextResponse.json({ error: 'tool_idが必要です' }, { status: 400 });
  try {
    const launches = await d1(
      `SELECT id, launch_name, tagline, tagline_ja, launch_date, thumbnail_url, url
       FROM tool_launches WHERE tool_id = ? ORDER BY launch_date DESC, created_at DESC`,
      [tool_id]
    );
    return NextResponse.json({ launches });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT /api/admin/launches
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const { id, launch_name, tagline_ja, url, thumbnail_url } = await req.json();
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });
  try {
    await d1(
      `UPDATE tool_launches SET launch_name=?, tagline_ja=?, url=?, thumbnail_url=? WHERE id=?`,
      [launch_name ?? null, tagline_ja ?? null, url ?? null, thumbnail_url ?? null, id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
