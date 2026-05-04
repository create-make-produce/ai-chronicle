// =============================================
// AI Chronicle - ニュース自動生成
// =============================================

import { CONFIG } from '../config';
import { callAI } from './ai';
import { D1Client } from './d1-rest';
import { generateId } from './uuid';
import { slugify } from './slug';

export type NewsEvent =
  | {
      type: 'new_tool';
      tool: {
        id: string; slug: string;
        name_ja: string; name_en: string;
        tagline_ja: string | null; tagline_en: string | null;
        description_ja: string | null;
        official_url: string | null;
        category_name_ja: string | null;
      };
    }
  | {
      type: 'new_feature';
      tool: {
        id: string; slug: string;
        name_ja: string; name_en: string;
      };
      launch: {
        launch_name: string;
        tagline: string | null;
        tagline_ja: string | null;
        launch_date: string | null;
      };
    }
  | {
      type: 'price_change';
      tool: { id: string; slug: string; name_ja: string; name_en: string };
      change: {
        plan_name: string;
        previous_price_usd: number | null;
        new_price_usd: number | null;
      };
    };

async function generateNewToolNews(event: Extract<NewsEvent, { type: 'new_tool' }>): Promise<{
  title_ja: string; title_en: string; body_ja: string; body_en: string;
}> {
  const tool = event.tool;
  const prompt = `以下の新着AIツールについてニュース記事を日本語と英語で生成してください。

ツール情報：
- 名前（日）: ${tool.name_ja}
- 名前（英）: ${tool.name_en}
- キャッチコピー（日）: ${tool.tagline_ja ?? '（なし）'}
- キャッチコピー（英）: ${tool.tagline_en ?? '（なし）'}
- 説明（日）: ${tool.description_ja ?? '（なし）'}
- 公式サイト: ${tool.official_url ?? '（なし）'}
- カテゴリ: ${tool.category_name_ja ?? '（なし）'}

以下の形式でJSONのみを出力してください。マークダウンは使わないでください。

{
  "title_ja": "日本語タイトル（30文字以内・「AIツール」などを含む）",
  "title_en": "English title (under 60 characters)",
  "body_ja": "日本語本文（10〜15行・何ができるツールか・特徴・想定ユーザーを含む。最低200文字）",
  "body_en": "English body (10-15 lines, what it does, features, target users)"
}`;

  const raw = await callAI(prompt);
  return parseJsonOrThrow(raw);
}

async function generateNewFeatureNews(event: Extract<NewsEvent, { type: 'new_feature' }>): Promise<{
  title_ja: string; title_en: string; body_ja: string; body_en: string;
}> {
  const { tool, launch } = event;
  const tagline = launch.tagline_ja ?? launch.tagline ?? '';

  const prompt = `以下のAIツールの新機能・新リリースについてニュース記事を日本語と英語で生成してください。

ツール情報：
- ツール名（日）: ${tool.name_ja}
- ツール名（英）: ${tool.name_en}
- 新機能名: ${launch.launch_name}
- 機能の説明: ${tagline}
- リリース日: ${launch.launch_date ?? '不明'}

以下の形式でJSONのみを出力してください。マークダウンは使わないでください。

{
  "title_ja": "日本語タイトル（30文字以内・例：「${tool.name_ja}が${launch.launch_name}を追加」）",
  "title_en": "English title (under 60 characters)",
  "body_ja": "日本語本文（10〜15行・どんな機能か・誰に役立つか・使い方を含む。最低200文字）",
  "body_en": "English body (10-15 lines)"
}`;

  const raw = await callAI(prompt);
  return parseJsonOrThrow(raw);
}

async function generatePriceChangeNews(event: Extract<NewsEvent, { type: 'price_change' }>): Promise<{
  title_ja: string; title_en: string; body_ja: string; body_en: string;
}> {
  const { tool, change } = event;
  const direction =
    change.previous_price_usd !== null && change.new_price_usd !== null
      ? change.new_price_usd > change.previous_price_usd ? '値上げ' : '値下げ'
      : '変更';

  const prompt = `以下のAIツールの価格変更についてニュース記事を日本語と英語で生成してください。

ツール情報：
- 名前: ${tool.name_ja} / ${tool.name_en}
- プラン: ${change.plan_name}
- 変更前: ${change.previous_price_usd !== null ? `$${change.previous_price_usd}` : '不明'}
- 変更後: ${change.new_price_usd !== null ? `$${change.new_price_usd}` : '不明'}
- 方向: ${direction}

以下の形式でJSONのみを出力してください。マークダウンは使わないでください。

{
  "title_ja": "日本語タイトル（例：${tool.name_ja}の${change.plan_name}プランが${direction}）",
  "title_en": "English title",
  "body_ja": "日本語本文（10〜15行・何がいつから変わるか・影響するユーザーを含む。最低200文字）",
  "body_en": "English body (10-15 lines)"
}`;

  const raw = await callAI(prompt);
  return parseJsonOrThrow(raw);
}

function parseJsonOrThrow(text: string): {
  title_ja: string; title_en: string; body_ja: string; body_en: string;
} {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

function generateNewsSlug(event: NewsEvent): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  if (event.type === 'new_tool') {
    return `${slugify(event.tool.name_en) || event.tool.slug}-new-${dateStr}`;
  } else if (event.type === 'new_feature') {
    return `${slugify(event.tool.name_en) || event.tool.slug}-${slugify(event.launch.launch_name)}-${dateStr}`;
  } else {
    return `${slugify(event.tool.name_en) || event.tool.slug}-price-${dateStr}`;
  }
}

export async function createNews(db: D1Client, event: NewsEvent): Promise<void> {
  try {
    let newsContent: { title_ja: string; title_en: string; body_ja: string; body_en: string };
    let newsType: string;
    let toolId: string;

    if (event.type === 'new_tool') {
      if (!CONFIG.NEWS_GENERATE_ON_NEW_TOOL) return;
      newsContent = await generateNewToolNews(event);
      newsType = 'new_tool';
      toolId = event.tool.id;
    } else if (event.type === 'new_feature') {
      newsContent = await generateNewFeatureNews(event);
      newsType = 'new_feature';
      toolId = event.tool.id;
    } else {
      if (!CONFIG.NEWS_GENERATE_ON_PRICE_CHANGE) return;
      newsContent = await generatePriceChangeNews(event);
      newsType = 'price_change';
      toolId = event.tool.id;
    }

    if (newsContent.body_ja.length < CONFIG.NEWS_MIN_BODY_LENGTH) {
      console.warn(`ニュース本文が短すぎるためスキップ: ${newsContent.title_ja} (${newsContent.body_ja.length}文字)`);
      return;
    }

    const id = generateId('news');
    let slug = generateNewsSlug(event);

    const existing = await db.first<{ count: number }>(
      'SELECT COUNT(*) AS count FROM news WHERE slug = ?', [slug]
    );
    if (existing && existing.count > 0) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    await db.execute(
      `INSERT INTO news (id, slug, title_ja, title_en, body_ja, body_en, news_type, tool_id, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      [id, slug, newsContent.title_ja, newsContent.title_en, newsContent.body_ja, newsContent.body_en, newsType, toolId]
    );

    console.log(`📰 ニュース生成: ${newsContent.title_ja}`);
  } catch (error) {
    console.warn(`ニュース生成失敗: ${error instanceof Error ? error.message : String(error)}`);
  }
}
