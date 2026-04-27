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

// GET: お問い合わせ一覧
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  // 7日経過した削除対象を自動削除
  await d1(`DELETE FROM contacts WHERE delete_at IS NOT NULL AND delete_at <= datetime('now')`);

  const contacts = await d1(
    `SELECT id, category, subject, email, checked, checked_at, created_at
     FROM contacts ORDER BY created_at DESC`
  );
  return NextResponse.json({ contacts });
}

// GET single: 詳細取得
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await req.json();
  const rows = await d1(`SELECT * FROM contacts WHERE id = ?`, [id]);
  return NextResponse.json({ contact: rows[0] ?? null });
}

// PUT: チェック済みに更新
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id, checked } = await req.json();
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });

  if (checked) {
    // チェック済み → 7日後の削除日時をセット
    await d1(
      `UPDATE contacts SET checked = 1, checked_at = datetime('now'), delete_at = datetime('now', '+7 days') WHERE id = ?`,
      [id]
    );
  } else {
    // チェック解除 → 削除日時をクリア
    await d1(
      `UPDATE contacts SET checked = 0, checked_at = NULL, delete_at = NULL WHERE id = ?`,
      [id]
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE: 手動削除
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'idが必要です' }, { status: 400 });

  await d1(`DELETE FROM contacts WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}
