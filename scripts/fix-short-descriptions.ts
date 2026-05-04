// =============================================
// AI Chronicle - 短い概要の一括再翻訳
// =============================================
// 実行: tsx scripts/fix-short-descriptions.ts
// 目的: description_jaが150文字未満のツールを全件再翻訳する
//       手動シード・自動収集どちらも対象
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { CONFIG } from '../src/config';

const MIN_LENGTH = 120;

interface ToolRow {
  id: string;
  name_en: string;
  tagline_en: string | null;
  description_en: string | null;
  description_ja: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function retranslate(tool: ToolRow): Promise<string | null> {
  const taglineEn = tool.tagline_en;
  const descEn = tool.description_en;
  if (!taglineEn && !descEn) return null;

  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。
【翻訳対象ツール】${tool.name_en}
- tagline: ${taglineEn ?? '（なし）'}
- description: ${descEn ?? '（なし）'}

【厳守ルール】
- 会社名・製品名・モデル名・バージョン番号は記載禁止（機能と用途のみ記述）
- 「、」は文中で使用可
- 「。」は各文の文末に必ずつけ、その後に改行（
）を入れる
- 文をスペースで区切ることは禁止
- 120文字以上（多い分はOK）、3〜5文構成
- ツールの機能・用途・対象ユーザーを具体的に記述
- 良い例: "テキスト生成やコード作成に対応した対話型AIサービス。
画像の分析やウェブ検索など幅広いタスクに活用できる。
無料から利用でき、学生からビジネスパーソンまで幅広いユーザーに対応している。"
- 悪い例（会社名あり）: "OpenAIが提供するAIサービス。GPT-4oを搭載している。"
- 悪い例（スペース区切り）: "テキスト生成に対応 画像分析もできる"
- 悪い例（短すぎ）: "AIチャットサービス。"

{"description_ja":"翻訳結果"}`;

  const raw = await callAI(prompt);
  const result = parseJsonResponse<{ description_ja: string | null }>(raw);
  return result.description_ja ?? null;
}

async function main() {
  console.log('🚀 AI Chronicle - 短い概要 一括再翻訳 開始');
  const db = D1Client.fromEnv();

  // 150文字未満 or NULL のツールを全件取得（公開・非公開問わず）
  const tools = await db.query<ToolRow>(
    `SELECT id, name_en, tagline_en, description_en, description_ja
     FROM tools
     WHERE description_ja IS NULL OR LENGTH(description_ja) < ${MIN_LENGTH}
     ORDER BY name_en`
  );

  console.log(`\n対象ツール: ${tools.length}件（description_ja が${MIN_LENGTH}文字未満 or NULL）\n`);

  if (tools.length === 0) {
    console.log('✅ 対象なし。すべてのツールが150文字以上です。');
    return;
  }

  let fixed = 0, skipped = 0, errors = 0;

  for (const tool of tools) {
    console.log(`🔍 ${tool.name_en}（現在: ${tool.description_ja ? `${tool.description_ja.length}文字` : 'NULL'}）`);

    if (!tool.tagline_en && !tool.description_en) {
      console.log(`  ⏭️ 英語テキストなし → スキップ`);
      skipped++;
      continue;
    }

    await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);

    try {
      const newDesc = await retranslate(tool);

      if (!newDesc || newDesc.length < MIN_LENGTH) {
        console.log(`  ⚠️ 再翻訳結果が短すぎ（${newDesc?.length ?? 0}文字）→ スキップ`);
        skipped++;
        continue;
      }

      await db.execute(
        `UPDATE tools SET description_ja = ?, updated_at = datetime('now') WHERE id = ?`,
        [newDesc, tool.id]
      );
      console.log(`  ✅ 更新完了（${newDesc.length}文字）`);
      fixed++;

    } catch (err) {
      console.error(`  ❌ エラー: ${err instanceof Error ? err.message : String(err)}`);
      errors++;
    }
  }

  console.log('\n========== 結果 ==========');
  console.log(`  ✅ 更新完了: ${fixed}件`);
  console.log(`  ⏭️ スキップ: ${skipped}件`);
  console.log(`  ❌ エラー  : ${errors}件`);
}

main().catch((e) => { console.error('致命的エラー:', e); process.exit(1); });
