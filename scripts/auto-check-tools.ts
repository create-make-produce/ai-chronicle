// =============================================
// AI Chronicle - AIツール自動判定スクリプト
// =============================================
// 対象  : is_published=1 かつ admin_checked=0 のツール（未処理全件）
// 処理  : 公式サイトを取得 → Geminiで ai/not_ai/review 判定 → DB直接更新
// モデル: CONFIG.CHECK_AI_MODEL（config.tsのみで変更可能）
// 実行  : npx tsx scripts/auto-check-tools.ts
// オプション: --dry-run → DBを更新せず結果だけ表示
//
// ・未処理ツールを全件処理する（バッチサイズ制限なし）
// ・429（RPD上限）が来たら即中断・次回起動時に続きから再開
// ・処理済み管理はDBフラグのみ（done file不要・GitHub Actions対応）
// ・GitHub Actions: 30分おき自動実行
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';

// =====================
// 型定義
// =====================

type CheckResult = 'ai' | 'not_ai' | 'review';

interface ToolRow {
  id: string;
  name_en: string;
  official_url: string | null;
}

const isDryRun = process.argv.includes('--dry-run');

// =====================
// ユーティリティ
// =====================

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
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
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 3000);
  } catch {
    return null;
  }
}

// =====================
// Gemini API呼び出し（CHECK_AI_MODEL専用・既存ai.tsとは独立）
// =====================

async function callGeminiCheck(prompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY が設定されていません');

  const model = CONFIG.CHECK_AI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${text}`);
  }

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API: 応答が空です');
  return text;
}

// =====================
// プロンプト生成
// =====================

function buildPrompt(name_en: string, url: string, pageText: string | null): string {
  const contentSection = pageText
    ? `【サイト内容（抜粋）】\n${pageText}`
    : `【注意】サイトの取得に失敗しました。ツール名とURLドメインのみで判定してください。`;

  return `あなたはAIツールの分類専門家です。以下のツールを判定してください。

【ツール名】${name_en}
【公式URL】${url}
${contentSection}

【判定基準】
ai：エンドユーザーが直接使えるUIを持ち、AI機能が核心にある
not_ai：以下のいずれかに該当する
  - 開発者向けSDK・API単体（UIなし）
  - MCPサーバー・オーケストレーションフレームワーク
  - インフラ・ゲートウェイ・ランタイム
  - MLフレームワーク・ハードウェア・チップ
  - AIエージェント向け開発者インフラ
  - モデルのバージョン名・リリース発表（独立したサービスUIがない）
  - 既存プロダクトの機能追加・機能拡張（独立したエントリーポイントがない）
review：サイト内容がツール名と一致しない、またはアクセスできず判断できない

【回答】以下のいずれか1単語のみ：
ai
not_ai
review`;
}

// =====================
// 判定結果パース
// =====================

function parseResult(text: string): CheckResult {
  const lower = text.trim().toLowerCase();
  if (lower.includes('not_ai')) return 'not_ai';
  if (lower.includes('review')) return 'review';
  if (lower.includes('ai')) return 'ai';
  return 'review';
}

// =====================
// メイン処理
// =====================

async function main() {
  if (isDryRun) console.log('🔍 DRY RUN モード（DBは更新しません）\n');

  console.log('🚀 AI Chronicle - AIツール自動判定開始');
  console.log(`使用モデル: ${CONFIG.CHECK_AI_MODEL}\n`);

  const db = D1Client.fromEnv();

  const tools = await db.query<ToolRow>(
    `SELECT id, name_en, official_url
     FROM tools
     WHERE is_published = 1 AND admin_checked = 0
     ORDER BY created_at ASC`
  );

  console.log(`未処理ツール: ${tools.length} 件\n`);

  if (tools.length === 0) {
    console.log('処理対象がありません。');
    return;
  }

  let aiCount = 0;
  let notAiCount = 0;
  let reviewCount = 0;
  let errorCount = 0;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    console.log(`[${i + 1}/${tools.length}] ${tool.name_en}`);

    // URLなし → review
    if (!tool.official_url) {
      console.log('  ⏭ URLなし → review');
      if (!isDryRun) {
        await db.execute(
          `UPDATE tools SET status='pending', is_published=0, updated_at=datetime('now') WHERE id=?`,
          [tool.id]
        );
      }
      reviewCount++;
      continue;
    }

    try {
      // 公式サイト取得
      const pageText = await fetchPageText(tool.official_url);
      if (pageText) {
        console.log(`  🌐 サイト取得: ${pageText.length.toLocaleString()}文字`);
      } else {
        console.log('  ⚠ サイト取得失敗 → 名前+URLのみで判定');
      }

      // Gemini判定
      const prompt = buildPrompt(tool.name_en, tool.official_url, pageText);
      const response = await callGeminiCheck(prompt);
      const result = parseResult(response);
      console.log(`  → 判定: ${result}`);

      if (!isDryRun) {
        if (result === 'ai') {
          await db.execute(
            `UPDATE tools SET admin_checked=1, updated_at=datetime('now') WHERE id=?`,
            [tool.id]
          );
          aiCount++;
        } else if (result === 'not_ai') {
          await db.execute(
            `UPDATE tools SET is_published=0, updated_at=datetime('now') WHERE id=?`,
            [tool.id]
          );
          notAiCount++;
        } else {
          await db.execute(
            `UPDATE tools SET status='pending', is_published=0, updated_at=datetime('now') WHERE id=?`,
            [tool.id]
          );
          reviewCount++;
        }
      } else {
        if (result === 'ai') aiCount++;
        else if (result === 'not_ai') notAiCount++;
        else reviewCount++;
      }

    } catch (err: any) {
      const msg = err?.message ?? String(err);

      // 429はRPD上限のため即中断・次回起動時に続きから再開
      if (msg.includes('429')) {
        console.error('  ❌ Gemini RPD上限（429）→ 中断（次回起動時に続きから再開）');
        break;
      }

      console.error(`  ⚠ エラー: ${msg}`);
      errorCount++;
    }

    if (i < tools.length - 1) {
      await sleep(CONFIG.AI_REQUEST_INTERVAL_MS);
    }
  }

  console.log('\n=============================');
  console.log(`ai=${aiCount} / not_ai=${notAiCount} / review=${reviewCount} / error=${errorCount}`);
  if (isDryRun) console.log('※ DRY RUN のためDBは変更されていません');
  console.log('=============================\n');
}

main().catch(e => {
  console.error('🔥 致命的エラー:', e);
  process.exit(1);
});
