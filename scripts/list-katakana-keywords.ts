// =============================================
// AI Chronicle - カタカナキーワード一覧表示
// =============================================
// 実行: npx tsx scripts/list-katakana-keywords.ts
// GitHub非管理

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';

function isPureKatakana(str: string): boolean {
  return /^[\u30A0-\u30FF\u30FC\u30FB\uFF65]+$/.test(str.trim());
}

async function main() {
  const db = D1Client.fromEnv();
  const tools = await db.query<{ id: string; name_en: string; search_keywords: string }>(
    `SELECT id, name_en, search_keywords FROM tools WHERE search_keywords IS NOT NULL ORDER BY name_en ASC`
  );

  const targets: { name_en: string; remove: string[]; keep: string[] }[] = [];

  for (const tool of tools) {
    const keywords = tool.search_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const remove = keywords.filter(k => isPureKatakana(k));
    const keep = keywords.filter(k => !isPureKatakana(k));
    if (remove.length > 0) targets.push({ name_en: tool.name_en, remove, keep });
  }

  console.log(`カタカナキーワードが含まれるツール: ${targets.length}件\n`);
  console.log('ツール名'.padEnd(30) + '削除されるキーワード'.padEnd(30) + '残るキーワード');
  console.log('-'.repeat(90));
  for (const t of targets) {
    console.log(t.name_en.padEnd(30) + t.remove.join(',').padEnd(30) + t.keep.join(','));
  }
}

main().catch(e => { console.error('🔥 エラー:', e); process.exit(1); });
