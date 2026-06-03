// =============================================
// AI Chronicle - ツール説明文一括更新スクリプト
// =============================================
// 対象  : is_published=1 かつ use_case_ja IS NULL のツール（全件）
// 処理  : 公式URLをfetch → translateToJapaneseで description_ja / use_case_ja / target_user_ja を生成 → DB更新
// 実行  : npx tsx scripts/update-tool-descriptions.ts
// オプション: --dry-run → DBを更新せず結果だけ表示
//
// ・途中で止まっても再実行すれば続きから自動再開（use_case_jaがNULLの件のみ処理）
// ・公式URLのfetch失敗ツールはログに記録（後で手動確認用）
// ・fetch失敗時はDBのtagline_en・description_enで補完
// ・429（RPD上限）が来たら即中断
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync, appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { translateToJapanese } from '../src/lib/translate';

const isDryRun = process.argv.includes('--dry-run');
const LOG_FILE = resolve(process.cwd(), 'update-tool-descriptions-failed.log');

// =====================
// ユーティリティ
// =====================

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function logFailedFetch(toolId: string, nameEn: string, url: string, reason: string) {
  const line = `${new Date().toISOString()} | id=${toolId} | name=${nameEn} | url=${url} | reason=${reason}\n`;
  appendFileSync(LOG_FILE, line);
}

// =====================
// 公式サイト取得
// =====================

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(CONFIG.SCRAPER_TIMEOUT_MS),
      headers: {
        'User-Agent': CONFIG.SCRAPER_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const metaParts: string[] = [];
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) metaParts.push(`title: ${titleMatch[1].trim()}`);
    const metaTags = html.matchAll(/<meta[^>]+>/gi);
    for (const tag of metaTags) {
      const nameMatch = tag[0].match(/(?:name|property)=["']([^"']+)["']/i);
      const contentMatch = tag[0].match(/content=["']([^"']+)["']/i);
      if (nameMatch && contentMatch) {
        const name = nameMatch[1].toLowerCase();
        if (['description','keywords','og:title','og:description','twitter:title','twitter:description'].includes(name)) {
          metaParts.push(`${name}: ${contentMatch[1].trim()}`);
        }
      }
    }

    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    const combined = [...metaParts, bodyText].join('\n').trim();
    return combined.length > 0 ? combined.slice(0, 3000) : null;
  } catch {
    return null;
  }
}

// =====================
// メイン処理
// =====================

async function main() {
  const db = D1Client.fromEnv();

  writeFileSync(LOG_FILE, `=== update-tool-descriptions 実行開始 ${new Date().toISOString()} ===\n`);

  const tools = await db.query<{
    id: string;
    name_en: string;
    tagline_en: string | null;
    description_en: string | null;
    official_url: string | null;
  }>(
    `SELECT id, name_en, tagline_en, description_en, official_url
     FROM tools
     WHERE is_published = 1 AND use_case_ja IS NULL
     ORDER BY created_at ASC`,
    []
  );

  console.log(`対象ツール: ${tools.length}件`);
  if (isDryRun) console.log('🔍 DRY RUN モード（DBは更新しません）');

  let success = 0;
  let failed = 0;
  let fetchFailed = 0;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    console.log(`\n[${i + 1}/${tools.length}] ${tool.name_en}`);

    // 公式URLをfetch
    let pageText: string | null = null;
    if (tool.official_url) {
      pageText = await fetchPageText(tool.official_url);
      if (pageText) {
        console.log(`  ✅ fetch成功`);
      } else {
        console.log(`  ⚠ fetch失敗 → 保留（pending）に変更`);
        logFailedFetch(tool.id, tool.name_en, tool.official_url, 'fetch失敗');
        fetchFailed++;
        if (!isDryRun) {
          await db.execute(
            `UPDATE tools SET status = 'pending', is_published = 0, updated_at = datetime('now') WHERE id = ?`,
            [tool.id]
          );
        }
        await sleep(1000);
        continue;
      }
    } else {
      console.log(`  ⚠ 公式URLなし → tagline_en + description_en + Gemini知識で補完`);
      logFailedFetch(tool.id, tool.name_en, '（URLなし）', '公式URLなし');
      fetchFailed++;
    }

    // translateToJapaneseで生成
    try {
      const translated = await translateToJapanese(
        tool.name_en,
        tool.tagline_en,
        tool.description_en,
        pageText
      );

      if (!translated.description_ja || !translated.use_case_ja || !translated.target_user_ja) {
        console.log(`  ❌ 必須フィールド不足`);
        failed++;
        await sleep(2000);
        continue;
      }

      console.log(`  📝 description_ja: ${translated.description_ja.length}文字`);

      if (!isDryRun) {
        await db.execute(
          `UPDATE tools SET description_ja = ?, use_case_ja = ?, target_user_ja = ?, updated_at = datetime('now') WHERE id = ?`,
          [translated.description_ja, translated.use_case_ja, translated.target_user_ja, tool.id]
        );
      }

      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.includes('RATE_LIMIT')) {
        console.log(`\n⛔ RPD上限に達しました。中断します。再実行すれば続きから再開されます。`);
        break;
      }
      console.log(`  ❌ エラー: ${msg}`);
      failed++;
    }

    await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`成功: ${success}件 / 失敗: ${failed}件 / fetchFailed: ${fetchFailed}件`);
  console.log(`fetch失敗ログ: ${LOG_FILE}`);
}

main().catch(console.error);
