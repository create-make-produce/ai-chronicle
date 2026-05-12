// =============================================
// AI Chronicle - AIプロバイダー抽象化ラッパー
// =============================================
// config.tsのAI_PROVIDER/AI_MODELを変更するだけで
// 別プロバイダーに切り替え可能にするための抽象化レイヤー
// =============================================

import { CONFIG } from '../config';

/**
 * sleep関数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * APIキーを環境変数から取得
 */
function getApiKey(): string {
  const key = process.env.AI_API_KEY;
  if (!key) {
    throw new Error('環境変数 AI_API_KEY が設定されていません');
  }
  return key;
}

/**
 * Gemini APIを呼び出す
 */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  const model = CONFIG.AI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: CONFIG.AI_MAX_OUTPUT_TOKENS,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API: 応答が空です');
  }
  return text;
}

/**
 * OpenAI APIを呼び出す
 */
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: CONFIG.AI_MAX_OUTPUT_TOKENS,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI API: 応答が空です');
  }
  return text;
}

/**
 * Claude APIを呼び出す
 */
async function callClaude(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  const url = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.AI_MODEL,
      max_tokens: CONFIG.AI_MAX_OUTPUT_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = json.content?.find((c) => c.type === 'text')?.text;
  if (!text) {
    throw new Error('Claude API: 応答が空です');
  }
  return text;
}

/**
 * 最終リクエスト時刻（レート制限用）
 */
let lastRequestTime = 0;

/**
 * AI APIを呼び出す（プロバイダーは CONFIG.AI_PROVIDER で切替）
 * レート制限・リトライ機能付き
 */
export async function callAI(prompt: string): Promise<string> {
  // レート制限：前回リクエストから AI_REQUEST_INTERVAL_MS は待つ
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < CONFIG.AI_REQUEST_INTERVAL_MS) {
    await sleep(CONFIG.AI_REQUEST_INTERVAL_MS - elapsed);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < CONFIG.AI_MAX_RETRIES; attempt++) {
    try {
      lastRequestTime = Date.now();
      let result: string;
      switch (CONFIG.AI_PROVIDER) {
        case 'gemini':
          result = await callGemini(prompt);
          break;
        case 'openai':
          result = await callOpenAI(prompt);
          break;
        case 'claude':
          result = await callClaude(prompt);
          break;
        default:
          throw new Error(`未知のAIプロバイダー: ${CONFIG.AI_PROVIDER}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);

      // 429はRPD上限のため即中断（リトライ不要）
      if (msg.includes('429')) {
        throw error;
      }

      console.warn(`AI API呼び出し失敗 (試行 ${attempt + 1}/${CONFIG.AI_MAX_RETRIES}): ${msg}`);
      if (attempt < CONFIG.AI_MAX_RETRIES - 1) {
        await sleep(CONFIG.AI_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('AI APIの呼び出しに失敗しました');
}

/**
 * JSON応答をパースする（マークダウンコードブロック除去含む）
 */
export function parseJsonResponse<T = unknown>(text: string): T {
  // ```json ... ``` や ``` ... ``` を除去
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');

  // 最初の { または [ から最後の } または ] まで抽出
  const firstBrace = cleaned.search(/[{[]/);
  const lastBrace = cleaned.search(/[}\]](?=[^}\]]*$)/);
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new Error(
      `AI応答のJSONパースに失敗: ${
        error instanceof Error ? error.message : String(error)
      }\n応答内容: ${text.slice(0, 500)}`
    );
  }
}
