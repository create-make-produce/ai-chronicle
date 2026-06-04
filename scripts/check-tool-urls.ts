// =============================================
// AI Chronicle - ツールURL死活確認スクリプト
// =============================================
// 対象  : is_published=1 かつ official_url が存在するツール全件
// 処理  : HEADリクエストを送信し、明確な404が返ったツールを保留（pending）に変更
// スキップ: 503・429・タイムアウト・その他エラー（一時的な障害として無視）
// 通知  : 保留にしたツールをメールで通知
// 実行  : npx tsx scripts/check-tool-urls.ts
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';

// =====================
// ユーティリティ
// =====================

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function sendEmail(subject: string, body: string) {
  const from  = process.env.GMAIL_FROM;
  const pass  = process.env.GMAIL_APP_PASSWORD;
  const to    = process.env.NOTIFY_EMAIL;
  if (!from || !pass || !to) return;

  const { createTransport } = await import('nodemailer');
  const transporter = createTransport({ service: 'gmail', auth: { user: from, pass } });
  await transporter.sendMail({ from, to, subject, text: body });
}

// =====================
// URLチェック
// =====================

async function checkUrl(url: string): Promise<'ok' | 'not_found' | 'skip'> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(CONFIG.SCRAPER_TIMEOUT_MS),
      headers: { 'User-Agent': CONFIG.SCRAPER_USER_AGENT },
      redirect: 'follow',
    });

    if (res.status === 404) return 'not_found';
    // 503・429・その他はスキップ
    return 'skip';
  } catch {
    // タイムアウト・ネットワークエラー等はスキップ
    return 'skip';
  }
}

// =====================
// メイン処理
// =====================

async function main() {
  const db = D1Client.fromEnv();

  const tools = await db.query<{
    id: string;
    name_en: string;
    official_url: string;
  }>(
    `SELECT id, name_en, official_url
     FROM tools
     WHERE is_published = 1
       AND status = 'active'
       AND admin_checked = 1
       AND official_url IS NOT NULL
     ORDER BY updated_at ASC`,
    []
  );

  console.log(`対象ツール: ${tools.length}件`);

  const inactivated: string[] = [];

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    console.log(`[${i + 1}/${tools.length}] ${tool.name_en}`);

    const result = await checkUrl(tool.official_url);

    if (result === 'not_found') {
      console.log(`  ❌ 404検出 → 保留に変更`);
      await db.execute(
        `UPDATE tools SET is_published = 0, status = 'pending', updated_at = datetime('now') WHERE id = ?`,
        [tool.id]
      );
      inactivated.push(`${tool.name_en} (${tool.official_url})`);
    } else {
      console.log(`  ✅ 正常 or スキップ`);
    }

    await sleep(3000);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`非公開にしたツール: ${inactivated.length}件`);

  if (inactivated.length > 0) {
    const body = [
      `【AI Chronicle】URLチェックで非公開にしたツール: ${inactivated.length}件`,
      '',
      ...inactivated.map((n, i) => `${i + 1}. ${n}`),
      '',
      '管理画面で確認・対応してください。',
      'https://localhost:3000/admin/dashboard',
    ].join('\n');

    await sendEmail(`[AI Chronicle] URL404検出 ${inactivated.length}件`, body);
    console.log('メール通知送信済み');
  }
}

main().catch(console.error);
