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
  company_name?: string | null;
}

interface ToolRow {
  id: string;
  name_en: string;
  official_url: string | null;
  category_id: string | null;
  company_name: string | null;
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

    // メタタグを抽出（title・description・og:title・og:description・keywords）
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

    // 本文テキストを抽出
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    // メタ情報 + 本文を結合
    const combined = [...metaParts, bodyText].join('\n').trim();
    return combined.length > 0 ? combined.slice(0, 3000) : null;
  } catch {
    return null;
  }
}

// =====================
// Gemini API呼び出し（CHECK_AI_MODEL専用・既存ai.tsとは独立）
// =====================

async function callGeminiCheck(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY が設定されていません');
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
    : `【注意】サイトの取得に失敗しました。`;

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
  - 成人向けコンテンツ・アダルトサービス・成人向け画像生成（ヌード・性的コンテンツ・セクシャルコンテンツ等）
  - 賭博・カジノ・スポーツベッティング・オンラインギャンブル関連
  - 詐欺・フィッシング・スパム支援ツール
  - マルウェア・ハッキング・サイバー攻撃支援ツール
  - 暴力的コンテンツの生成・過激派思想の拡散・テロ支援を目的とするツール
  - 違法薬物・規制薬物関連サービス
  - 政治的プロパガンダ生成・選挙操作・世論誘導ツール
  - 仮想通貨・NFT・ブロックチェーントークン販売が主目的のサービス
  - 日本以外の特定の国・地域の法律・制度・言語・行政に特化したサービス（例：特定国の法務・税務・政府手続き・判例検索専用ツール）
  - 医療・診断・治療・投薬に関する専門的アドバイスを提供するサービス（医師・医療機関向け専用ツール含む）
  - 健康状態の診断・病気の判定・医療的判断を主目的とするサービス
  - 投資・株式・仮想通貨・FX・金融商品の売買推奨・運用アドバイスを主目的とするサービス
  - 保険・融資・ローン・信用審査を主目的とするサービス
  - 医学部・医療系資格の受験・学習支援を主目的とするサービス
  - 医療機関・クリニック・病院向けに特化した業務支援ツール

【重要な判断ルール】
- 「そのツールからAIを取り除いたら、ツールとして成立するか？」で判断する
  - 成立しない（AIなしでは機能しない）→ ai
    例：AI背景削除ツール・AIライフスタイルコーチ・AI画像生成・AIチャットボット
  - 成立する（AIは付加機能に過ぎない）→ not_ai
    例：AIスケジュール提案付きカレンダー・AI件名提案付きメール送信ツール・AIタグ付け付き写真管理
- 迷った場合は review にする

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

【会社名抽出】
- 運営会社・開発元の正式名称を英語で答える
- 個人開発の場合は個人名またはブランド名
- 判断できない場合は null

【回答形式】JSON1行のみ・余分なテキスト不要
resultがaiの場合   : {"result":"ai","category":"カテゴリスラッグ","company_name":"会社名またはnull"}
resultがai以外の場合: {"result":"not_ai","company_name":"会社名またはnull"} または {"result":"review"}`;
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
      return { result: 'ai', category: validCategory, company_name: json.company_name ?? null };
    }

    return { result: json.result, company_name: json.company_name ?? null };
  } catch {
    // パース失敗は安全側に倒す
    return { result: 'review' };
  }
}

// =====================
// グレー地球儀・黒白△デフォルトロゴ検出
// =====================

// Googleデフォルトファビコンの既知バイト数
// 地球儀：726バイト、黒白△：1022バイト
const DEFAULT_LOGO_SIZES = new Set([726, 1022]);

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': CONFIG.SCRAPER_USER_AGENT },
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function checkDefaultLogo(db: D1Client): Promise<void> {
  console.log('\n🔍 STEP0：デフォルトロゴ検出開始（地球儀726B・黒白△1022B）');

  const logoTools = await db.query<{ id: string; name_en: string; logo_url: string | null }>(
    `SELECT id, name_en, logo_url FROM tools WHERE is_published = 1 AND status = 'active' AND logo_url IS NOT NULL`
  );
  console.log(`  対象ツール: ${logoTools.length}件`);

  let archivedCount = 0;
  for (const tool of logoTools) {
    if (!tool.logo_url) continue;
    const buf = await fetchImageBuffer(tool.logo_url);
    if (!buf) continue;
    if (DEFAULT_LOGO_SIZES.has(buf.length)) {
      console.log(`  🗂 デフォルトロゴ一致(${buf.length}B) → 特別非公開: ${tool.name_en}`);
      if (!isDryRun) {
        await db.execute(
          `UPDATE tools SET is_published=0, status='archived', admin_memo='デフォルトロゴ検出(${buf.length}B)', updated_at=datetime('now') WHERE id=?`,
          [tool.id]
        );
      }
      archivedCount++;
    }
    await sleep(200);
  }

  console.log(`  完了: ${archivedCount}件を特別非公開に設定\n`);
}

// =====================
// メイン処理
// =====================
// =====================
// メイン処理
// =====================

async function main() {
  if (isDryRun) console.log('🔍 DRY RUN モード（DBは更新しません）\n');

  console.log('🚀 AI Chronicle - AIツール自動判定開始');

  const db = D1Client.fromEnv();

  // =====================
  // STEP0：グレー地球儀ロゴ検出 → 特別非公開（archived）
  // =====================
  await checkDefaultLogo(db);

  const tools = await db.query<ToolRow>(
    `SELECT id, name_en, official_url, category_id, company_name
     FROM tools
     WHERE is_published = 1 AND admin_checked = 0 AND status = 'active'
     ORDER BY created_at ASC`
  );

  // 未処理件数に応じてモデルを動的選択
  const useModel = tools.length <= CONFIG.CHECK_AI_MODEL_THRESHOLD
    ? CONFIG.CHECK_AI_MODEL_HEAVY
    : CONFIG.CHECK_AI_MODEL_LIGHT;

  console.log(`未処理ツール: ${tools.length} 件`);
  console.log(`使用モデル: ${useModel} （閾値${CONFIG.CHECK_AI_MODEL_THRESHOLD}件・${tools.length <= CONFIG.CHECK_AI_MODEL_THRESHOLD ? '高精度モード' : '高速モード'}）\n`);

  if (tools.length === 0) {
    console.log('処理対象がありません。');
  } else {

  let aiCount = 0;
  let notAiCount = 0;
  let reviewCount = 0;
  let errorCount = 0;
  let consecutive503 = 0;

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
      // 公式サイト取得（100文字未満は取得失敗扱い）
      const rawPageText = await fetchPageText(tool.official_url);
      const pageText = (rawPageText && rawPageText.length >= 100) ? rawPageText : null;
      if (pageText) {
        console.log(`  🌐 サイト取得: ${pageText.length.toLocaleString()}文字`);
      } else {
        if (rawPageText && rawPageText.length < 100) {
          console.log(`  ⚠ サイト取得: ${rawPageText.length}文字（100文字未満のため失敗扱い）`);
        }
        // サイト取得失敗 → 同会社名の既存ツールがあれば保留・なければ非公開
        let hasSameCompany = false;
        if (tool.company_name) {
          const sameCompany = await db.query<{ cnt: number }>(
            `SELECT COUNT(*) as cnt FROM tools WHERE company_name=? AND id!=? AND status='active' AND is_published=1`,
            [tool.company_name, tool.id]
          );
          hasSameCompany = (sameCompany[0]?.cnt ?? 0) > 0;
        }
        if (hasSameCompany) {
          console.log(`  ⚠ サイト取得失敗 + 同会社名あり → 保留`);
          if (!isDryRun) {
            await db.execute(
              `UPDATE tools SET is_published=0, status='pending', admin_memo='同会社の既存ツールあり', updated_at=datetime('now') WHERE id=?`,
              [tool.id]
            );
          }
          reviewCount++;
        } else {
          console.log('  ⚠ サイト取得失敗 → 非公開');
          if (!isDryRun) {
            await db.execute(
              `UPDATE tools SET is_published=0, status='inactive', updated_at=datetime('now') WHERE id=?`,
              [tool.id]
            );
          }
          notAiCount++;
        }
        continue;
      }

      // ━━ STEP2+3：Gemini判定（会社名取得 + AIツール判定を1回で実行） ━━
      const prompt = buildPrompt(tool.name_en, tool.official_url, pageText);
      const rawResponse = await callGeminiCheck(prompt, useModel);
      consecutive503 = 0; // Gemini呼び出し成功でリセット
      console.log(`  🤖 Gemini応答: ${rawResponse.trim().slice(0, 200)}`);
      const parsed = parseResponse(rawResponse);
      console.log(`  → 判定: ${parsed.result}${parsed.category ? ` / カテゴリ: ${parsed.category}` : ''}`);

      if (!isDryRun) {
        // 文字列"null"もPHの誤データとして空扱いにする
        const companyIsEmpty = !tool.company_name || tool.company_name.toLowerCase() === 'null';

        if (parsed.result === 'ai') {
          const newCategoryId = CATEGORY_MAP[parsed.category ?? 'other'];
          // 会社名が空で取得できた場合は保存
          if (companyIsEmpty && parsed.company_name) {
            console.log(`  🏢 会社名取得: ${parsed.company_name}`);
            await db.execute(
              `UPDATE tools SET admin_checked=1, category_id=?, company_name=?, updated_at=datetime('now') WHERE id=?`,
              [newCategoryId, parsed.company_name, tool.id]
            );
          } else if (companyIsEmpty && !parsed.company_name) {
            console.log('  ❌ 会社名取得失敗 → 非公開');
            await db.execute(
              `UPDATE tools SET is_published=0, status='inactive', updated_at=datetime('now') WHERE id=?`,
              [tool.id]
            );
            notAiCount++;
            continue;
          } else {
            await db.execute(
              `UPDATE tools SET admin_checked=1, category_id=?, updated_at=datetime('now') WHERE id=?`,
              [newCategoryId, tool.id]
            );
          }
          if (tool.category_id !== newCategoryId) {
            console.log(`  📁 カテゴリ更新: ${tool.category_id} → ${newCategoryId}`);
          }
          aiCount++;
        } else if (parsed.result === 'not_ai') {
          await db.execute(
            `UPDATE tools SET is_published=0, status='inactive', updated_at=datetime('now') WHERE id=?`,
            [tool.id]
          );
          notAiCount++;
        } else {
          // review判定：会社名が空なら非公開・あれば保留
          if (companyIsEmpty && !parsed.company_name) {
            console.log('  ❌ review + 会社名なし → 非公開');
            await db.execute(
              `UPDATE tools SET is_published=0, status='inactive', updated_at=datetime('now') WHERE id=?`,
              [tool.id]
            );
            notAiCount++;
          } else {
            if (companyIsEmpty && parsed.company_name) {
              console.log(`  🏢 会社名取得: ${parsed.company_name}`);
              await db.execute(
                `UPDATE tools SET status='pending', is_published=0, company_name=?, admin_memo='サイト内容がツールと無関係', updated_at=datetime('now') WHERE id=?`,
                [parsed.company_name, tool.id]
              );
            } else {
              await db.execute(
                `UPDATE tools SET status='pending', is_published=0, admin_memo='サイト内容がツールと無関係', updated_at=datetime('now') WHERE id=?`,
                [tool.id]
              );
            }
            reviewCount++;
          }
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

      // 503は連続5回で中断（RPD節約）
      if (msg.includes('503')) {
        consecutive503++;
        console.error(`  ⚠ Gemini 503エラー（${consecutive503}回連続）`);
        if (consecutive503 >= 5) {
          console.error('  ❌ 503エラー5回連続 → 中断（次回起動時に続きから再開）');
          break;
        }
      } else {
        consecutive503 = 0;
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

  // =====================
  // メール通知（件数に関わらず常に実行）
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

    // お問い合わせ未確認件数チェック
    interface ContactRow { cnt: number }
    const contactRows = await db.query<ContactRow>(
      `SELECT COUNT(*) as cnt FROM contacts WHERE checked = 0`
    );
    const uncheckedContacts = contactRows[0]?.cnt ?? 0;

    let body = `AI Chronicle - 保留ツール通知\n`;
    body += `実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`;
    body += `保留件数: ${pendingTools.length}件\n\n`;
    for (const t of pendingTools) {
      body += `  - ${t.name_en}  ${t.official_url ?? 'URLなし'}\n`;
    }
    if (uncheckedContacts > 0) {
      body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      body += `📨 未確認お問い合わせ: ${uncheckedContacts}件\n`;
    }
    body += `\n管理画面で確認してください。\nhttp://localhost:3000/admin/dashboard?tab=tools\n`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: gmailUser,
      to: notifyTo,
      subject: `[AI Chronicle] 保留ツール${pendingTools.length}件${uncheckedContacts > 0 ? ` / お問い合わせ${uncheckedContacts}件` : ''}`,
      text: body,
    });

    console.log(`📧 メール送信完了 → ${notifyTo}（保留${pendingTools.length}件・お問い合わせ${uncheckedContacts}件）`);
  } catch (err: any) {
    console.warn(`📧 メール送信失敗（処理には影響なし）: ${err?.message ?? err}`);
  }
}

main().catch(e => {
  console.error('🔥 致命的エラー:', e);
  process.exit(1);
});
