// src/middleware.ts
// Accept-Language に基づく自動ロケール判定
// - 初回アクセス時、ブラウザの言語が en で / にアクセスしたら /en にリダイレクト
// - 手動切り替え後は Cookie で記憶
// - /api, /_next, 静的ファイル、/en 配下は素通し

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 除外パス（静的ファイル・APIルート・sitemap/robots）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/en') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // ファイル拡張子付き
  ) {
    return NextResponse.next();
  }

  // Cookie で言語を記憶している場合はそれを優先
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === 'en') {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }
  if (cookieLocale === 'ja') {
    return NextResponse.next();
  }

  // Accept-Language から判定
  const acceptLang = req.headers.get('accept-language') ?? '';
  const prefersEnglish = /^en\b/i.test(acceptLang.split(',')[0] ?? '');

  if (prefersEnglish) {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 静的ファイルと API 以外すべてにマッチ
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
