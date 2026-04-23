// =============================================
// AI Chronicle - スラッグ生成ユーティリティ
// =============================================

/**
 * 文字列からURL用スラッグを生成
 * 例: "ChatGPT Plus!" → "chatgpt-plus"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // 日本語・中国語・韓国語などマルチバイト文字は削除（英数字名を優先）
    .replace(/[^\x20-\x7E]/g, '')
    // アルファベット・数字・ハイフン・スペース以外を削除
    .replace(/[^a-z0-9\s-]/g, '')
    // スペースをハイフンに
    .replace(/\s+/g, '-')
    // 連続するハイフンを1つに
    .replace(/-+/g, '-')
    // 先頭・末尾のハイフンを削除
    .replace(/^-+|-+$/g, '')
    // 最大80文字
    .slice(0, 80);
}

/**
 * URL文字列からドメインベースのスラッグを生成
 * 例: "https://chatgpt.com" → "chatgpt"
 */
export function slugifyFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const mainPart = hostname.split('.')[0];
    return slugify(mainPart);
  } catch {
    return '';
  }
}

/**
 * 重複を避けるためのランダムサフィックスを付加
 * 例: "chatgpt" → "chatgpt-a3f9"
 */
export function addRandomSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}
