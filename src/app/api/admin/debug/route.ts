export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId      = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token     = process.env.CLOUDFLARE_API_TOKEN;
  const adminToken = process.env.ADMIN_TOKEN;
  const session   = req.cookies.get('admin_session')?.value;

  // 環境変数の有無だけ確認（値は出さない）
  const envCheck = {
    CLOUDFLARE_ACCOUNT_ID:    !!accountId,
    CLOUDFLARE_D1_DATABASE_ID: !!dbId,
    CLOUDFLARE_API_TOKEN:     !!token,
    ADMIN_TOKEN:              !!adminToken,
    session_cookie:           !!session,
    auth_ok:                  !!session && !!adminToken && session === adminToken,
  };

  // D1に実際にクエリしてみる
  let d1Result: unknown = null;
  let d1Error: unknown = null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT COUNT(*) as count FROM tools', params: [] }),
        cache: 'no-store',
      }
    );
    d1Result = await res.json();
  } catch (e) {
    d1Error = String(e);
  }

  return NextResponse.json({ envCheck, d1Result, d1Error });
}
