// scripts/update-tools.ts
// =============================================
// 既存ツールの情報再取得スクリプト
// =============================================

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CONFIG = {
  MAX_TOOLS_PER_RUN:    30,
  REQUEST_DELAY_MS:     4000,
  SCRAPER_TIMEOUT_MS:   12000,
  AI_REQUEST_DELAY_MS:  5000,
  AI_MAX_RETRIES:       3,
  AI_RETRY_DELAY_MS:    10000,
  USER_AGENT:           'AI-Chronicle-Bot/1.0 (+https://ai-chronicle.com/about)',
};

const ACCOUNT_ID   = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DATABASE_ID  = process.env.CLOUDFLARE_D1_DATABASE_ID!;
const API_TOKEN    = process.env.CLOUDFLARE_API_TOKEN!;
const GEMINI_KEY   = process.env.AI_API_KEY || process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.AI_MODEL || 'gemini-3.1-flash-lite-preview';

async function queryD1<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) throw new Error(`D1 HTTP error: ${res.status}`);
  const text = await res.text();
  const data = JSON.parse(text);
  if (!data.success) throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
  return data.result?.[0]?.results ?? [];
}

async function callGemini(prompt: string): Promise<string> {
  for (let i = 0; i < CONFIG.AI_MAX_RETRIES; i++) {
    try {
      const waitMs = i === 0 ? CONFIG.AI_REQUEST_DELAY_MS : CONFIG.AI_RETRY_DELAY_MS * Math.pow(2, i);
      if (i > 0) {
        console.log(`  Gemini 待機中... ${Math.round(waitMs / 1000)}秒`);
        await sleep(waitMs);
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini HTTP error: ${res.status} ${errText.slice(0, 100)}`);
      }
      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (e) {
      console.error(`  Gemini retry ${i + 1}/${CONFIG.AI_MAX_RETRIES}:`, (e as Error).message);
    }
  }
  return '';
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

async function fetchSiteText(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.SCRAPER_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return '';
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000);
  } catch {
    return '';
  }
}

interface ExtractedInfo {
  tagline_ja:          string | null;
  tagline_en:          string | null;
  description_ja:      string | null;
  description_en:      string | null;
  has_mobile_app:      boolean;
  has_chrome_ext:      boolean;
  has_api:             boolean;
  has_free_plan:       boolean;
  has_japan_pricing:   boolean;
  price_jpy_official:  number | null;
  plans: Array<{
    plan_name:         string;
    plan_name_ja:      string;
    is_free:           boolean;
    price_usd:         number | null;
    price_jpy:         number | null;
    has_japan_pricing: boolean;
  }>;
  confidence: number;
}

async function extractToolInfo(
  toolName: string,
  siteText: string,
  currentData: Record<string, unknown>
): Promise<ExtractedInfo | null> {
  if (!siteText.trim()) return null;

  const prompt = `
以下のWebサイトのテキストから「${toolName}」の情報を正確に抽出してください。
情報が見つからない場合は null にしてください。
JSONのみ出力し、マークダウンのコードブロックは使わないでください。

【現在DBに入っている情報（参考）】
${JSON.stringify(currentData, null, 2)}

【Webサイトテキスト】
${siteText}

【日本語表記ルール・厳守】
tagline_ja のルール：
  - 「[ツールの種類・カテゴリ（名詞1〜4語）] [キャッチコピー]」の順番で書く
  - 例：「画像生成AI 思い通りのビジュアルを一瞬で」「コーディング支援 開発速度を10倍に」「文章校正ツール ライティングの質を上げる」
  - 末尾に句読点（。や、）を絶対につけない
  - 25文字以内

description_ja のルール：
  - 2〜3文で自然な説明
  - 各文の末尾に句読点（。）を絶対につけない
  - 文末は体言止め（名詞で終わる）か「〜できる」「〜可能」「〜に対応」などで終わる
  - 例：「テキストから高品質な画像を生成できるAIツール。スタイルの細かい指定や商用利用にも対応」

【出力形式（JSON）】
{
  "tagline_ja": "ルール厳守（nullの場合はnull）",
  "tagline_en": "Tagline in English (1 line, null if not found)",
  "description_ja": "ルール厳守（nullの場合はnull）",
  "description_en": "Description in English (3 sentences max, null if not found)",
  "has_mobile_app": true/false,
  "has_chrome_ext": true/false,
  "has_api": true/false,
  "has_free_plan": true/false,
  "has_japan_pricing": true/false,
  "price_jpy_official": 日本向け公式円価格（数値のみ・なければnull）,
  "plans": [
    {
      "plan_name": "Free",
      "plan_name_ja": "無料",
      "is_free": true,
      "price_usd": null,
      "price_jpy": null,
      "has_japan_pricing": false
    }
  ],
  "confidence": 0.0〜1.0（情報の確信度）
}
`;

  await sleep(CONFIG.AI_REQUEST_DELAY_MS);
  const text = await callGemini(prompt);
  const data = parseJson(text);
  if (!data) return null;
  return data as unknown as ExtractedInfo;
}

async function updateToolInDB(toolId: string, info: ExtractedInfo): Promise<void> {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];

  if (info.tagline_ja)     { updateFields.push('tagline_ja = ?');     updateValues.push(info.tagline_ja); }
  if (info.tagline_en)     { updateFields.push('tagline_en = ?');     updateValues.push(info.tagline_en); }
  if (info.description_ja) { updateFields.push('description_ja = ?'); updateValues.push(info.description_ja); }
  if (info.description_en) { updateFields.push('description_en = ?'); updateValues.push(info.description_en); }

  updateFields.push('has_mobile_app = ?');      updateValues.push(info.has_mobile_app ? 1 : 0);
  updateFields.push('has_chrome_ext = ?');      updateValues.push(info.has_chrome_ext ? 1 : 0);
  updateFields.push('has_api = ?');             updateValues.push(info.has_api ? 1 : 0);
  updateFields.push('has_free_plan = ?');       updateValues.push(info.has_free_plan ? 1 : 0);
  updateFields.push('ai_confidence_score = ?'); updateValues.push(info.confidence);
  updateFields.push('last_scraped_at = ?');     updateValues.push(new Date().toISOString());
  updateFields.push('updated_at = ?');          updateValues.push(new Date().toISOString());

  if (updateFields.length === 0) return;

  await queryD1(
    `UPDATE tools SET ${updateFields.join(', ')} WHERE id = ?`,
    [...updateValues, toolId]
  );

  if (info.plans && info.plans.length > 0) {
    const existing = await queryD1<{ plan_name: string; price_usd: number | null; id: string; manually_verified: number }>(
      `SELECT id, plan_name, price_usd, manually_verified FROM pricing_plans WHERE tool_id = ?`,
      [toolId]
    );

    for (const plan of info.plans) {
      const existingPlan = existing.find(e => e.plan_name.toLowerCase() === plan.plan_name.toLowerCase());

      if (existingPlan) {
        // 料金固定中のプランはスキップ
        if (existingPlan.manually_verified === 1) {
          console.log(`  → 料金固定中のためスキップ: ${plan.plan_name}`);
          continue;
        }

        const priceChanged = existingPlan.price_usd !== plan.price_usd && plan.price_usd !== null;
        const trend = priceChanged
          ? ((plan.price_usd ?? 0) > (existingPlan.price_usd ?? 0) ? 'up' : 'down')
          : null;

        // 価格改定を検知したらお問い合わせに自動記録
        if (priceChanged && trend) {
          const arrow = trend === 'up' ? '↑ 値上げ' : '↓ 値下げ';
          const toolRow = await queryD1<{ name_ja: string; slug: string }>(
            `SELECT name_ja, slug FROM tools WHERE id = ?`, [toolId]
          );
          const toolName = toolRow[0]?.name_ja ?? toolId;
          const toolSlug = toolRow[0]?.slug ?? toolId;
          const contactId = `pc-${toolId.slice(0, 8)}-${plan.plan_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          await queryD1(
            `INSERT OR IGNORE INTO contacts (id, category, subject, body, email, checked, created_at)
             VALUES (?, ?, ?, ?, '', 0, datetime('now'))`,
            [
              contactId,
              '価格改定',
              `【${arrow}】${toolName} — ${plan.plan_name}プラン`,
              `ツール: ${toolName} (${toolSlug})\nプラン: ${plan.plan_name} (${plan.plan_name_ja})\n変更前: $${existingPlan.price_usd ?? '?'}/月\n変更後: $${plan.price_usd}/月\n方向: ${arrow}\n検知日時: ${new Date().toISOString()}`,
            ]
          );
          console.log(`  → 価格改定を記録: ${toolName} [${plan.plan_name}] $${existingPlan.price_usd} → $${plan.price_usd} (${arrow})`);
        }

        await queryD1(
          `UPDATE pricing_plans SET
            plan_name_ja = ?, is_free = ?, price_usd = ?,
            price_jpy_official = ?, has_japan_pricing = ?,
            price_trend = COALESCE(?, price_trend),
            previous_price_usd = CASE WHEN ? THEN price_usd ELSE previous_price_usd END,
            price_changed_at = CASE WHEN ? THEN datetime('now') ELSE price_changed_at END,
            updated_at = datetime('now')
          WHERE id = ?`,
          [
            plan.plan_name_ja, plan.is_free ? 1 : 0, plan.price_usd,
            plan.price_jpy, plan.has_japan_pricing ? 1 : 0,
            trend,
            priceChanged ? 1 : 0, priceChanged ? 1 : 0,
            existingPlan.id,
          ]
        );
      } else {
        const newId = `pp-${toolId.slice(0, 8)}-${plan.plan_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        await queryD1(
          `INSERT OR IGNORE INTO pricing_plans
            (id, tool_id, plan_name, plan_name_ja, is_free, price_usd, price_jpy_official, has_japan_pricing, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [newId, toolId, plan.plan_name, plan.plan_name_ja, plan.is_free ? 1 : 0, plan.price_usd, plan.price_jpy, plan.has_japan_pricing ? 1 : 0]
        );
      }
    }

    await queryD1(`UPDATE tools SET last_price_checked_at = datetime('now') WHERE id = ?`, [toolId]);
  }
}

async function main() {
  console.log('=== update-tools.ts 開始 ===');
  console.log(`最大処理件数: ${CONFIG.MAX_TOOLS_PER_RUN}`);

  const tools = await queryD1<{
    id: string; slug: string; name_ja: string; name_en: string;
    official_url: string; tagline_ja: string | null; description_ja: string | null;
    has_mobile_app: number; has_chrome_ext: number; has_api: number;
    has_free_plan: number; last_scraped_at: string | null;
  }>(
    `SELECT id, slug, name_ja, name_en, official_url,
            tagline_ja, description_ja,
            has_mobile_app, has_chrome_ext, has_api, has_free_plan,
            last_scraped_at
     FROM tools
     WHERE is_published = 1
       AND official_url IS NOT NULL
       AND official_url != ''
     ORDER BY last_scraped_at ASC NULLS FIRST
     LIMIT ?`,
    [CONFIG.MAX_TOOLS_PER_RUN]
  );

  console.log(`処理対象: ${tools.length} 件`);

  let updated = 0;
  let failed  = 0;

  for (const tool of tools) {
    console.log(`\n[${updated + failed + 1}/${tools.length}] ${tool.name_ja} (${tool.slug})`);
    console.log(`  URL: ${tool.official_url}`);

    try {
      const siteText = await fetchSiteText(tool.official_url);
      if (!siteText) {
        console.log('  → サイト取得失敗・スキップ');
        failed++;
        await sleep(CONFIG.REQUEST_DELAY_MS);
        continue;
      }
      console.log(`  → サイト取得完了 (${siteText.length} 文字)`);

      const info = await extractToolInfo(tool.name_en, siteText, {
        tagline_ja:    tool.tagline_ja,
        description_ja: tool.description_ja,
        has_mobile_app: tool.has_mobile_app,
        has_chrome_ext: tool.has_chrome_ext,
        has_api:        tool.has_api,
        has_free_plan:  tool.has_free_plan,
      });

      if (!info) {
        console.log('  → AI 抽出失敗・スキップ');
        failed++;
        await sleep(CONFIG.REQUEST_DELAY_MS);
        continue;
      }

      console.log(`  → AI 抽出完了 (確信度: ${info.confidence})`);
      await updateToolInDB(tool.id, info);
      console.log('  → DB 更新完了');
      updated++;

    } catch (e) {
      console.error(`  → エラー:`, e);
      failed++;
    }

    await sleep(CONFIG.REQUEST_DELAY_MS);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新成功: ${updated} 件`);
  console.log(`失敗:     ${failed} 件`);
}

main().catch(console.error);
