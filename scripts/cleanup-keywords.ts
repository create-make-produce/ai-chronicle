// =============================================
// AI Chronicle - search_keywords カタカナ読み一括削除
// =============================================
// ローカル実行専用: npx tsx scripts/cleanup-keywords.ts
// GitHub非管理（gitignore済み）
// 処理：純粋なカタカナのみのキーワードをsearch_keywordsから削除する
// ※ツール名自体がカタカナの場合は手動で確認・修正すること

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';

// 純粋なカタカナ（長音符・中点含む）のみで構成されているか判定
function isPureKatakana(str: string): boolean {
  return /^[\u30A0-\u30FF\u30FC\u30FB\uFF65]+$/.test(str.trim());
}

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  if (isDryRun) console.log('🔍 DRY RUN モード（DBは更新しません）\n');
  console.log('🚀 search_keywords カタカナ読み一括削除開始');

  const db = D1Client.fromEnv();

  const tools = await db.query<{ id: string; name_en: string; search_keywords: string }>(
    `SELECT id, name_en, search_keywords FROM tools WHERE search_keywords IS NOT NULL`
  );
  console.log(`  → 対象ツール: ${tools.length}件\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const tool of tools) {
    const keywords = tool.search_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const filtered = keywords.filter(k => !isPureKatakana(k));

    if (filtered.length === keywords.length) {
      skippedCount++;
      continue; // 変化なし
    }

    const removed = keywords.filter(k => isPureKatakana(k));
    const newKeywords = filtered.join(',');

    console.log(`  [${tool.name_en}]`);
    console.log(`    削除: ${removed.join(', ')}`);
    console.log(`    残: ${newKeywords || '（空）'}`);

    if (!isDryRun) {
      await db.execute(
        `UPDATE tools SET search_keywords = ?, updated_at = datetime('now') WHERE id = ?`,
        [newKeywords || tool.name_en, tool.id]
      );
    }
    updatedCount++;
  }

  console.log(`\n========== 結果 ==========`);
  console.log(`  ✅ 更新: ${updatedCount}件`);
  console.log(`  ⏭️ 変化なし: ${skippedCount}件`);
  if (isDryRun) console.log('  ※ DRY RUN のためDBは変更されていません');
  console.log('===========================\n');
  console.log('⚠️  ツール名自体がカタカナのツールは手動確認してください');
}

main().catch(e => { console.error('🔥 エラー:', e); process.exit(1); });
