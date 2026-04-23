// =============================================
// AI Chronicle - ジョブC
// 価格メンテナンス（週1回実行）
// =============================================
// 実行: tsx scripts/update-prices.ts
// GitHub Actions: 毎週月曜UTC 03:00
// =============================================

// .env.local を明示的に読み込む（Next.js準拠）
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else {
  loadEnv();
}

import { CONFIG } from '../src/config';
import { D1Client } from '../src/lib/d1-rest';
import { callAI, parseJsonResponse } from '../src/lib/ai';
import { fetchHtml, htmlToText, truncateForAI } from '../src/lib/scraper';
import { generateId } from '../src/lib/uuid';
import { createNews } from '../src/lib/news-generator';

// ----------------------------------------
// ツール1件分の情報
// ----------------------------------------
interface ToolToCheck {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  official_url: string | null;
}

interface ExistingPlan {
  id: string;
  plan_name: string;
  is_free: number;
  price_usd: number | null;
  price_jpy_official: number | null;
}

// ----------------------------------------
// AI抽出結果
// ----------------------------------------
interface ExtractedPricing {
  plans: Array<{
    plan_name: string;
    is_free: boolean;
    price_usd: number | null;
    price_usd_annual: number | null;
  }>;
  has_japan_pricing: boolean;
  japan_prices: Array<{ plan_name: string; price_jpy: number }> | null;
  price_changed: boolean;
}

// ----------------------------------------
// 1. チェック対象ツールを取得
// ----------------------------------------
async function fetchToolsToCheck(db: D1Client): Promise<ToolToCheck[]> {
  return await db.query<ToolToCheck>(
    `SELECT id, slug, name_ja, name_en, official_url
     FROM tools
     WHERE is_published = 1 AND official_url IS NOT NULL
     ORDER BY
       CASE WHEN last_price_checked_at IS NULL THEN 0 ELSE 1 END,
       last_price_checked_at ASC
     LIMIT ?`,
    [CONFIG.MAX_PRICE_CHECKS_PER_RUN]
  );
}

// ----------------------------------------
// 2. 現在の価格プランを取得
// ----------------------------------------
async function fetchExistingPlans(
  db: D1Client,
  toolId: string
): Promise<ExistingPlan[]> {
  return await db.query<ExistingPlan>(
    `SELECT id, plan_name, is_free, price_usd, price_jpy_official
     FROM pricing_plans
     WHERE tool_id = ?`,
    [toolId]
  );
}

// ----------------------------------------
// 3. AIで価格情報抽出
// ----------------------------------------
async function extractPricing(
  tool: ToolToCheck,
  pageText: string,
  existingPlans: ExistingPlan[]
): Promise<ExtractedPricing> {
  const existingSummary = existingPlans
    .map((p) => `- ${p.plan_name}: ${p.price_usd !== null ? `$${p.price_usd}` : '不明'}`)
    .join('\n');

  const prompt = `以下のWebサイトの価格情報を抽出してください。現在DBにある価格との差異を検出します。
JSONのみを出力し、マークダウンや説明文は出力しないでください。

【ツール】
${tool.name_en}

【現在DBにある価格】
${existingSummary || '（なし）'}

【公式サイトのテキスト（抜粋）】
${truncateForAI(pageText, 10000)}

【抽出項目】
以下のJSONフォーマットで回答：

{
  "plans": [
    {
      "plan_name": "Free / Pro / Business など",
      "is_free": true/false,
      "price_usd": 月額USD数値またはnull（年割引は除外・月額換算前の実際の月額）,
      "price_usd_annual": 年払い時の月換算USD数値またはnull
    }
  ],
  "has_japan_pricing": true/false,
  "japan_prices": [
    {"plan_name": "Pro", "price_jpy": 3080}
  ] または null,
  "price_changed": DBにある価格と現在の価格に差があるか true/false
}

注意：
- 価格が明記されていないプラン（「Custom」「Contact us」）は price_usd: null
- 1プラン1エントリ。重複させないこと
- 無料プランは必ず is_free: true, price_usd: null で入れる`;

  const raw = await callAI(prompt);
  return parseJsonResponse<ExtractedPricing>(raw);
}

// ----------------------------------------
// 4. プラン差分を反映（価格変更の検出）
// ----------------------------------------
interface PriceChangeEvent {
  plan_name: string;
  previous_price_usd: number | null;
  new_price_usd: number | null;
}

async function applyPricingDiff(
  db: D1Client,
  tool: ToolToCheck,
  existingPlans: ExistingPlan[],
  extracted: ExtractedPricing
): Promise<PriceChangeEvent[]> {
  const changes: PriceChangeEvent[] = [];
  const japanPriceMap = new Map<string, number>(
    (extracted.japan_prices ?? []).map((jp) => [jp.plan_name, jp.price_jpy])
  );

  for (const newPlan of extracted.plans) {
    const existing = existingPlans.find(
      (p) => p.plan_name.toLowerCase() === newPlan.plan_name.toLowerCase()
    );

    const japanPrice = japanPriceMap.get(newPlan.plan_name) ?? null;

    if (existing) {
      // 既存プランの更新
      const priceChanged =
        existing.price_usd !== newPlan.price_usd &&
        newPlan.price_usd !== null;

      if (priceChanged) {
        const trend =
          existing.price_usd === null
            ? 'stable'
            : newPlan.price_usd! > existing.price_usd
            ? 'up'
            : 'down';

        await db.execute(
          `UPDATE pricing_plans SET
             price_usd = ?,
             price_usd_annual = ?,
             previous_price_usd = ?,
             price_trend = ?,
             price_changed_at = datetime('now'),
             is_free = ?,
             price_jpy_official = ?,
             has_japan_pricing = ?,
             updated_at = datetime('now')
           WHERE id = ?`,
          [
            newPlan.price_usd,
            newPlan.price_usd_annual,
            existing.price_usd,
            trend,
            newPlan.is_free ? 1 : 0,
            japanPrice,
            japanPrice !== null ? 1 : 0,
            existing.id,
          ]
        );

        changes.push({
          plan_name: newPlan.plan_name,
          previous_price_usd: existing.price_usd,
          new_price_usd: newPlan.price_usd,
        });
      } else {
        // 価格変化なしでも日本価格だけ更新
        await db.execute(
          `UPDATE pricing_plans SET
             price_jpy_official = ?,
             has_japan_pricing = ?,
             updated_at = datetime('now')
           WHERE id = ?`,
          [japanPrice, japanPrice !== null ? 1 : 0, existing.id]
        );
      }
    } else {
      // 新規プラン
      await db.execute(
        `INSERT INTO pricing_plans (
           id, tool_id, plan_name, is_free, price_usd, price_usd_annual,
           price_jpy_official, has_japan_pricing, billing_cycle, price_source_url
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'monthly', ?)`,
        [
          generateId('plan'),
          tool.id,
          newPlan.plan_name,
          newPlan.is_free ? 1 : 0,
          newPlan.price_usd,
          newPlan.price_usd_annual,
          japanPrice,
          japanPrice !== null ? 1 : 0,
          tool.official_url,
        ]
      );
    }
  }

  // ツールの last_price_checked_at を更新
  await db.execute(
    `UPDATE tools SET last_price_checked_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
    [tool.id]
  );

  return changes;
}

// ----------------------------------------
// 5. 1ツール分の処理
// ----------------------------------------
async function processSingleTool(
  db: D1Client,
  tool: ToolToCheck
): Promise<{ success: boolean; changed: number; error?: string }> {
  console.log(`\n💰 価格チェック: ${tool.name_ja} (${tool.slug})`);

  try {
    if (!tool.official_url) {
      return { success: false, changed: 0, error: '公式URL未設定' };
    }

    const html = await fetchHtml(tool.official_url);
    const text = htmlToText(html);

    const existingPlans = await fetchExistingPlans(db, tool.id);
    const extracted = await extractPricing(tool, text, existingPlans);

    const changes = await applyPricingDiff(db, tool, existingPlans, extracted);

    if (changes.length > 0) {
      console.log(`  📝 ${changes.length}件の価格変更を検出`);
      for (const c of changes) {
        console.log(
          `     ${c.plan_name}: $${c.previous_price_usd ?? '?'} → $${c.new_price_usd ?? '?'}`
        );
        await createNews(db, {
          type: 'price_change',
          tool,
          change: c,
        });
      }
    } else {
      console.log(`  ✓ 価格変更なし`);
    }

    return { success: true, changed: changes.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ 失敗: ${msg}`);
    return { success: false, changed: 0, error: msg };
  }
}

// ----------------------------------------
// メイン処理
// ----------------------------------------
async function main() {
  console.log('🚀 AI Chronicle - 価格メンテナンスジョブ開始');
  console.log(
    `   設定: MAX_PRICE_CHECKS_PER_RUN = ${CONFIG.MAX_PRICE_CHECKS_PER_RUN}`
  );

  const startedAt = new Date().toISOString();
  const db = D1Client.fromEnv();
  const logId = generateId('log');

  await db.execute(
    `INSERT INTO scrape_logs (id, job_name, status, started_at)
     VALUES (?, 'update_prices', 'running', ?)`,
    [logId, startedAt]
  );

  let updated = 0;
  let changeCount = 0;
  const errors: string[] = [];

  try {
    const tools = await fetchToolsToCheck(db);
    console.log(`   対象: ${tools.length}件`);

    if (tools.length === 0) {
      console.log('\n✨ チェック対象のツールがありません');
    }

    for (const tool of tools) {
      const result = await processSingleTool(db, tool);
      if (result.success) {
        updated++;
        changeCount += result.changed;
      } else {
        errors.push(`${tool.slug}: ${result.error ?? 'unknown'}`);
      }
    }

    const status =
      errors.length === 0 ? 'success' : updated > 0 ? 'partial' : 'error';

    await db.execute(
      `UPDATE scrape_logs SET
         status = ?, tools_updated = ?, errors = ?, finished_at = datetime('now')
       WHERE id = ?`,
      [
        status,
        updated,
        errors.length > 0 ? JSON.stringify(errors) : null,
        logId,
      ]
    );

    console.log(`\n========== 結果 ==========`);
    console.log(`  ✅ チェック完了: ${updated}件`);
    console.log(`  📝 価格変更: ${changeCount}件`);
    console.log(`  ❌ エラー: ${errors.length}件`);
    console.log(`  🏁 ステータス: ${status}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔥 致命的エラー:', msg);
    await db.execute(
      `UPDATE scrape_logs SET
         status = 'error', errors = ?, finished_at = datetime('now')
       WHERE id = ?`,
      [JSON.stringify([msg]), logId]
    );
    process.exit(1);
  }
}

main();
