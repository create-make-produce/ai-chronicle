// =============================================
// AI Chronicle - AIツール自動判定スクリプト
// =============================================
// 対象  : is_published=1 かつ admin_checked=0 のツール（未処理全件）
// 処理  : 公式サイトを取得 → Geminiで ai/not_ai/review + カテゴリ判定 → DB直接更新
// モデル: CONFIG.CHECK_AI_MODEL（config.tsのみで変更可能）
// 実行  : npx tsx scripts/auto-check-tools.ts
// オプション: --dry-run → DBを更新せず結果だけ表示
//
// ・未処理ツールを全件処理する（バッチサイズ制限なし）
// ・429（RPD上限）が来たら即中断・次回起動時に続きから再開
// ・処理済み管理はDBフラグのみ（GitHub Actions対応）
// ・ai判定時はカテゴリも同時に更新
// ・GitHub Actions: 30分おき自動実行
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) { loadEnv({ path: envLocalPath }); } else { loadEnv(); }

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import nodemailer from 'nodemailer';

// =====================
// 型定義
// =====================

type CheckResult = 'ai' | 'not_ai' | 'review';
type CategorySlug =
  | 'image-generation'
  | 'audio'
  | 'coding'
  | 'text-generation'
  | 'productivity'
  | 'research'
  | 'marketing'
  | 'other';

interface GeminiResponse {
  result: CheckResult;
  category?: CategorySlug;
}

interface ToolRow {
  id: string;
  name_en: string;
  official_url: string | null;
  category_id: string | null;
}

interface PendingTool {
  id: string;
  name_en: string;
  official_url: string | null;
  status: string;
  created_at: string;
}

// カテゴリスラッグ → category_id マッピング
const CATEGORY_MAP: Record<CategorySlug, string> = {
  'image-generation': 'cat_image',
  'audio':            'cat_audio',
  'coding':           'cat_coding',
  'text-generation':  'cat_text',
  'productivity':     'cat_productivity',
  'research':         'cat_research',
  'marketing':        'cat_marketing',
  'other':            'cat_other',
};

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

【aiの判定基準】
以下を両方満たす場合のみ ai：
  1. エンドユーザーが直接使えるUIがある（ベータ・招待制・ウェイトリスト中でも可）
  2. AI機能がそのツールの核心・メイン機能である

【not_aiの判定基準】
以下のいずれかに該当する場合は not_ai：
  - 開発者向けSDK・API単体（UIなし）
  - MCPサーバー・オーケストレーションフレームワーク
  - インフラ・ゲートウェイ・ランタイム
  - MLフレームワーク・ハードウェア・チップ
  - AIエージェント向け開発者インフラ
  - モデルのバージョン名・リリース発表（独立したサービスUIがない）
  - 既存プロダクトの機能追加・機能拡張（独立したエントリーポイントがない）
  - 「AI-powered」「AI機能あり」と書いてあってもAIが補助機能に過ぎず、メイン機能はAI以外のツール
  - Google Play / App Storeのリンクしかなく、独自のWebサービスUIがない

【重要な判断ルール】
- AIが補助機能（検索補助・自動タグ付け・レコメンド等）に過ぎない場合は not_ai
- AIがプランを作る・文章を生成する・画像を生成する・アドバイスをする等、AIが主役の場合は ai
- 迷った場合は ai か not_ai のどちらかに必ず決めること。reviewにしない

【reviewにする条件（厳格に適用・滅多に使わない）】
以下のいずれかに該当する場合のみ review：
  - サイトにアクセスできなかった（取得失敗）
  - サイトの内容がツール名と全く関係ないページだった（ドメインが無関係な別サービスに転用されている等）

【カテゴリ判定（resultがaiの場合のみ・上から順に判定して最初に該当したもの）】
image-generation : 画像生成・動画生成・動画編集・映像変換・字幕・SNS動画作成が主機能
audio            : 音声生成・音楽生成・文字起こし・声クローン・ポッドキャストが主機能
coding           : コード生成・補完・デバッグ・テスト・開発支援が主機能
text-generation  : テキスト生成・ライティング・翻訳・要約・チャットが主機能
productivity     : 業務効率化・タスク管理・会議要約・メール自動化・ワークフロー・カスタマーサポート自動化
research         : Web検索・情報収集・リサーチ・データ分析・グラフ化・予測分析が主目的
marketing        : SNS投稿・広告コピー・SEO記事・メールマーケティング・集客・販売促進が主目的
other            : 上記いずれにも当てはまらない

【回答形式】JSON1行のみ・余分なテキスト不要
resultがaiの場合   : {"result":"ai","category":"カテゴリスラッグ"}
resultがai以外の場合: {"result":"not_ai"} または {"result":"review"}`;
}

// =====================
// 判定結果パース
// =====================

function parseResponse(text: string): GeminiResponse {
  try {
    const cleaned = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '');
    const json = JSON.parse(cleaned) as GeminiResponse;

    // result検証
    if (!['ai', 'not_ai', 'review'].includes(json.result)) {
      return { result: 'review' };
    }

    // ai判定時のカテゴリ検証
    if (json.result === 'ai') {
      const validCategory = json.category && json.category in CATEGORY_MAP
        ? json.category
        : 'other' as CategorySlug;
      return { result: 'ai', category: validCategory };
    }

    return { result: json.result };
  } catch {
    // パース失敗は安全側に倒す
    return { result: 'review' };
  }
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
    `SELECT id, name_en, official_url, category_id
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
      const rawResponse = await callGeminiCheck(prompt);
      console.log(`  🤖 Gemini応答: ${rawResponse.trim().slice(0, 200)}`);
      const parsed = parseResponse(rawResponse);
      console.log(`  → 判定: ${parsed.result}${parsed.category ? ` / カテゴリ: ${parsed.category}` : ''}`);

      if (!isDryRun) {
        if (parsed.result === 'ai') {
          const newCategoryId = CATEGORY_MAP[parsed.category ?? 'other'];
          await db.execute(
            `UPDATE tools SET admin_checked=1, category_id=?, updated_at=datetime('now') WHERE id=?`,
            [newCategoryId, tool.id]
          );
          if (tool.category_id !== newCategoryId) {
            console.log(`  📁 カテゴリ更新: ${tool.category_id} → ${newCategoryId}`);
          }
          aiCount++;
        } else if (parsed.result === 'not_ai') {
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
        if (parsed.result === 'ai') aiCount++;
        else if (parsed.result === 'not_ai') notAiCount++;
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

  // =====================
  // メール通知（review発生 or DB内pending存在時）
  // =====================
  if (!isDryRun) {
    await sendNotificationIfNeeded(db);
  }
}

// =====================
// DB内のpendingツール取得 + メール送信
// =====================

async function sendNotificationIfNeeded(db: D1Client): Promise<void> {
  const gmailUser = process.env.GMAIL_FROM;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const notifyTo  = process.env.NOTIFY_EMAIL;
  if (!gmailUser || !gmailPass || !notifyTo) {
    console.log('📧 メール設定未完了のためスキップ（GMAIL_FROM / GMAIL_APP_PASSWORD / NOTIFY_EMAIL）');
    return;
  }

  try {
    const pendingTools = await db.query<PendingTool>(
      `SELECT id, name_en, official_url, status, created_at
       FROM tools
       WHERE is_published = 0 AND status = 'pending'
       ORDER BY created_at DESC`
    );

    if (pendingTools.length === 0) {
      console.log('📧 保留ツールなし・通知スキップ');
      return;
    }

    let body = `AI Chronicle - 保留ツール通知\n`;
    body += `実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`;
    body += `保留件数: ${pendingTools.length}件\n\n`;
    for (const t of pendingTools) {
      body += `  - ${t.name_en}  ${t.official_url ?? 'URLなし'}\n`;
    }
    body += `\n管理画面で確認してください。\nhttp://localhost:3000/admin/dashboard?tab=tools\n`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: gmailUser,
      to: notifyTo,
      subject: `[AI Chronicle] 保留ツール通知 ${pendingTools.length}件`,
      text: body,
    });

    console.log(`📧 メール送信完了 → ${notifyTo}（保留${pendingTools.length}件）`);
  } catch (err: any) {
    console.warn(`📧 メール送信失敗（処理には影響なし）: ${err?.message ?? err}`);
  }
}

main().catch(e => {
  console.error('🔥 致命的エラー:', e);
  process.exit(1);
});
