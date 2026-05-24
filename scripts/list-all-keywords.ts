// =============================================
// AI Chronicle - ツール名・キーワード一覧表示
// =============================================
// 実行: npx tsx scripts/list-all-keywords.ts
// GitHub非管理

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';

async function main() {
  const db = D1Client.fromEnv();
  const tools = await db.query<{ name_en: string; search_keywords: string }>(
    `SELECT name_en, search_keywords FROM tools WHERE search_keywords IS NOT NULL ORDER BY name_en ASC`
  );

  console.log(`全${tools.length}件\n`);
  console.log('ツール名'.padEnd(35) + 'search_keywords');
  console.log('-'.repeat(80));
  for (const t of tools) {
    console.log(t.name_en.padEnd(35) + t.search_keywords);
  }
}

main().catch(e => { console.error('🔥 エラー:', e); process.exit(1); });
