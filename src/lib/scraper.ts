// =============================================
// AI Chronicle - HTMLフェッチャー
// =============================================
// 公式サイトからHTMLを取得してテキストに変換
// robots.txtの尊重・User-Agent明示・リクエスト間隔を守る
// =============================================

import { CONFIG } from '../config';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Product HuntのリダイレクトURLかどうかを判定
 * 例: https://www.producthunt.com/r/XXXXX は公式サイトではない（403になる）
 */
export function isProductHuntUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('producthunt.com');
  } catch {
    return false;
  }
}

/**
 * 前回のスクレイピング時刻（サーバー負荷対策）
 */
let lastFetchTime = 0;

/**
 * 指定URLのHTMLを取得
 */
export async function fetchHtml(url: string): Promise<string> {
  // Product HuntのリダイレクトURLはフェッチしない（403になるため）
  if (isProductHuntUrl(url)) {
    throw new Error(`Product HuntのURLはフェッチ対象外: ${url}`);
  }

  // リクエスト間隔制御
  const elapsed = Date.now() - lastFetchTime;
  if (elapsed < CONFIG.SCRAPER_REQUEST_DELAY_MS) {
    await sleep(CONFIG.SCRAPER_REQUEST_DELAY_MS - elapsed);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < CONFIG.SCRAPER_MAX_RETRIES; attempt++) {
    try {
      lastFetchTime = Date.now();

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        CONFIG.SCRAPER_TIMEOUT_MS
      );

      const response = await fetch(url, {
        headers: {
          'User-Agent': CONFIG.SCRAPER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return html;
    } catch (error) {
      lastError = error;
      console.warn(
        `fetch失敗 ${url} (試行 ${attempt + 1}/${CONFIG.SCRAPER_MAX_RETRIES}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (attempt < CONFIG.SCRAPER_MAX_RETRIES - 1) {
        await sleep(2000);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`fetchに失敗: ${url}`);
}

/**
 * HTMLからテキストを抽出（AI処理用に不要な要素を除去）
 */
export function htmlToText(html: string): string {
  return html
    // script/styleタグ全体を削除
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // HTMLタグを削除
    .replace(/<[^>]+>/g, ' ')
    // HTMLエンティティを戻す
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // 連続する空白を1つに
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * HTMLからメタ情報（title/description）を抽出
 */
export function extractMeta(html: string): {
  title: string | null;
  description: string | null;
  ogImage: string | null;
} {
  const title =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;

  const description =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i
    )?.[1] ??
    null;

  const ogImage =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i
    )?.[1] ??
    null;

  return { title, description, ogImage };
}

/**
 * faviconのURLを推定
 */
export function guessFaviconUrl(siteUrl: string): string {
  try {
    const u = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`;
  } catch {
    return '';
  }
}

/**
 * HTMLテキストをAI処理用に切り詰める（トークン制限対策）
 */
export function truncateForAI(text: string, maxChars = 15000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n...(以下省略)';
}
