export const runtime = 'edge';
// src/app/api/admin/notes/route.ts

import { NextRequest, NextResponse } from 'next/server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const session = req.cookies.get('admin_session')?.value;
  const token = process.env.ADMIN_TOKEN;
  return !!(session && token && session === token);
}

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
    }
  );
  const data = await res.json();
  return data.result?.[0]?.results ?? [];
}

// GET: ツールのNote記事一覧 or Note件数マップ
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('tool_id');
  const counts = searchParams.get('counts');

  // 全ツールのNote件数マップを返す
  if (counts === '1') {
    const rows = await queryD1(
      `SELECT tool_id, COUNT(*) as cnt FROM tool_note_articles GROUP BY tool_id`
    ) as { tool_id: string; cnt: number }[];
    const map: Record<string, number> = {};
    for (const r of rows) map[r.tool_id] = r.cnt;
    return NextResponse.json({ counts: map });
  }

  // 特定ツールのNote記事一覧
  if (!toolId) return NextResponse.json({ articles: [] });

  const articles = await queryD1(
    `SELECT * FROM tool_note_articles WHERE tool_id = ? ORDER BY likes_count DESC, published_at DESC`,
    [toolId]
  );
  return NextResponse.json({ articles });
}

// DELETE: Note記事を削除
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await queryD1(`DELETE FROM tool_note_articles WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}
