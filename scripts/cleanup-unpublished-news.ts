// =============================================
// AI Chronicle - 非公開ツールのニュース削除
// =============================================
// 実行: tsx scripts/cleanup-unpublished-news.ts

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';

async function main() {
  const db = new D1Client(
    process.env.CLOUDFLARE_ACCOUNT_ID!,
    process.env.CLOUDFLARE_D1_DATABASE_ID!,
    process.env.CLOUDFLARE_API_TOKEN!,
  );

  // 非公開ツールに紐づくニュースを取得
  const targets = await db.query<{ id: string; title_ja: string }>(
    `SELECT n.id, n.title_ja
     FROM news n
     INNER JOIN tools t ON n.tool_id = t.id
     WHERE t.is_published = 0`,
    []
  );

  if (targets.length === 0) {
    console.log('削除対象のニュースはありません');
    return;
  }

  console.log(`削除対象: ${targets.length}件`);

  let deleted = 0;
  for (const item of targets) {
    await db.query(`DELETE FROM news WHERE id = ?`, [item.id]);
    console.log(`削除: ${item.title_ja}`);
    deleted++;
  }

  console.log(`完了: ${deleted}件削除しました`);
}

main().catch(e => { console.error(e); process.exit(1); });
