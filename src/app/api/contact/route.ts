export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  const { category, subject, email, body } = await req.json();

  if (!category || !subject || !body) {
    return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 });
  }

  if (body.length > 2000) {
    return NextResponse.json({ error: '本文は2000文字以内でお願いします' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  // チェック済みから7日後に削除するdelete_atを設定しない（チェック時にセット）

  await d1(
    `INSERT INTO contacts (id, category, subject, email, body, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [id, category, subject, email ?? null, body]
  );

  return NextResponse.json({ ok: true });
}
