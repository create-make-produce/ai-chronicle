// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // =============================================
  // 管理者ページの認証チェック
  // =============================================
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.next();
    }
    const session = req.cookies.get(ADMIN_COOKIE)?.value;
    const token   = process.env.ADMIN_TOKEN;
    if (!session || !token || session !== token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // =============================================
  // /en/* → 日本語パスに301リダイレクト
  // =============================================
  if (pathname.startsWith('/en')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, '') || '/';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
