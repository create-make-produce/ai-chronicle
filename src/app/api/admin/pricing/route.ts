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
  return data.result?.[0]?.results ?? [];
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('tool_id');
  if (!toolId) return NextResponse.json({ error: 'tool_idが必要です' }, { status: 400 });
  const plans = await d1(
    `SELECT * FROM pricing_plans WHERE tool_id = ? ORDER BY is_free DESC, price_usd ASC`,
    [toolId]
  );
  return NextResponse.json({ plans });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });

  const allowed = [
    'plan_name', 'plan_name_ja', 'is_free',
    'price_usd', 'price_jpy_official', 'has_japan_pricing',
    'price_usd_annual', 'price_jpy_annual', 'billing_cycle',
    'manually_verified',
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

  await d1(`UPDATE pricing_plans SET ${setClauses.join(', ')} WHERE id = ?`, params);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const body = await req.json();
  const id = crypto.randomUUID();
  await d1(
    `INSERT INTO pricing_plans (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, price_jpy_official, has_japan_pricing, billing_cycle, manually_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, body.tool_id, body.plan_name ?? 'New Plan', body.plan_name_ja ?? null,
     body.is_free ?? 0, body.price_usd ?? null, body.price_jpy_official ?? null,
     body.has_japan_pricing ?? 0, body.billing_cycle ?? 'monthly']
  );
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });
  await d1(`DELETE FROM pricing_plans WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}
