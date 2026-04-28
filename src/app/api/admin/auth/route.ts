export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password, token } = await req.json();

  const validEmail    = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;
  const validToken    = process.env.ADMIN_TOKEN;

  if (
    email    === validEmail &&
    password === validPassword &&
    token    === validToken
  ) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', validToken!, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: '認証情報が正しくありません' }, { status: 401 });
}

export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });
  return res;
}
