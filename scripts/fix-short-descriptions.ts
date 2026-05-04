// =============================================
// AI Chronicle - タグライン・概要 一括再翻訳
// =============================================
// 実行: tsx scripts/fix-short-descriptions.ts
// 目的: tagline_ja / description_ja が NULL のツールを全件再翻訳
//       事前に以下のDBコマンドでリセットしてから実行すること:
//       UPDATE tools SET description_ja=NULL, tagline_ja=NULL WHERE manually_verified=0;
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { CONFIG } from '../src/config';

interface ToolRow {
  id: string;
  name_en: string;
  tagline_en: string | null;
  description_en: string | null;
  tagline_ja: string | null;
  description_ja: string | null;
}

interface TranslateResult {
  tagline_ja: string | null;
  description_ja: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function translate(tool: ToolRow): Promise<TranslateResult> {
  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。
【翻訳対象ツール】${tool.name_en}
- tagline: ${tool.tagline_en ?? '（なし）'}
- description: ${tool.description_en ?? '（なし）'}

【厳守ルール】
- 会社名・製品名・モデル名・バージョン番号は記載禁止（機能と用途のみ記述）
- tagline_ja：「[カテゴリ] [キャッチコピー]」形式、最大2文（「。」区切り）、句読点は2文目末のみ可、会社名・製品名禁止
- description_ja：最大4文、合計200文字以内、「。」を文末につけその直後に改行文字（\nのみ・<br>禁止）を入れる
- 「。」は各文の文末に必ずつけ、その後に改行（\n）を入れる
- 「、」は文中で使用可、文をスペースで区切ることは禁止
- ツールの機能・用途・対象ユーザーを具体的に記述
- 良い例（description）: "テキスト生成やコード作成に対応した対話型AIサービス。\n画像の分析やウェブ検索など幅広いタスクに活用できる。\n無料から利用でき、学生からビジネスパーソンまで幅広いユーザーに対応している。"
- 悪い例（会社名あり）: "OpenAIが提供するAIサービス。GPT-4oを搭載している。"
- 悪い例（短すぎ）: "AIチャットサービス。"

{"tagline_ja":"翻訳結果またはnull","description_ja":"翻訳結果"}`;

  const raw = await callAI(prompt);
  return parseJsonResponse<TranslateResult>(raw);
}

async function main() {
  console.log('🚀 AI Chronicle - タグライン・概要 一括再翻訳 開始');
  const db = D1Client.fromEnv();

  // tagline_ja または description_ja が NULL のツールを対象
  const tools = await db.query<ToolRow>(
    `SELECT id, name_en, tagline_en, description_en, tagline_ja, description_ja
     FROM tools
     WHERE (tagline_ja IS NULL OR description_ja IS NULL)
       AND (tagline_en IS NOT NULL OR description_en IS NOT NULL)
     ORDER BY name_en`
  );

  console.log(`\n対象ツール: ${tools.length}件\n`);
  if (tools.length === 0) {
    console.log('✅ 対象なし。全ツールのtagline_ja・description_jaが設定済みです。');
    return;
  }

  let fixed = 0, skipped = 0, errors = 0;

  for (const tool of tools) {
    const needsTagline = !tool.tagline_ja;
    const needsDesc = !tool.description_ja;
    console.log(`🔍 ${tool.name_en}（tagline_ja: ${needsTagline ? 'NULL' : '済'} / description_ja: ${needsDesc ? 'NULL' : '済'}）`);

    await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);

    try {
      const result = await translate(tool);

      const updates: string[] = [];
      const params: unknown[] = [];

      if (needsTagline && result.tagline_ja) {
        updates.push('tagline_ja = ?');
        params.push(result.tagline_ja);
      }
      if (needsDesc && result.description_ja && result.description_ja.length >= 120) {
        updates.push('description_ja = ?');
        params.push(result.description_ja);
      } else if (needsDesc && result.description_ja) {
        console.log(`  ⚠️ description_jaが短すぎ（${result.description_ja.length}文字）→ スキップ`);
      }

      if (updates.length === 0) {
        console.log(`  ⏭️ 更新なし`);
        skipped++;
        continue;
      }

      params.push(tool.id);
      await db.execute(
        `UPDATE tools SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
        params
      );
      console.log(`  ✅ 更新: ${updates.map(u => u.split(' = ')[0]).join(', ')}`);
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
  if (errors > 0 || skipped > 0) {
    console.log('\n⚠️ 未完了のツールがあります。再実行してください。');
  }
}

main().catch((e) => { console.error('致命的エラー:', e); process.exit(1); });
