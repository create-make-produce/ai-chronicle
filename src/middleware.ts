// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const ADMIN_COOKIE  = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // =============================================
  // 管理者ページの認証チェック
  // =============================================
  if (pathname.startsWith('/admin')) {
    // ログインページ自体は素通し
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
  // 通常の言語判定
  // =============================================
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/en') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === 'en') {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }
  if (cookieLocale === 'ja') {
    return NextResponse.next();
  }

  const acceptLang  = req.headers.get('accept-language') ?? '';
  const prefersEnglish = /^en\b/i.test(acceptLang.split(',')[0] ?? '');
  if (prefersEnglish) {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
