/**
 * translate.ts
 * ツールのtagline_ja / description_ja / search_keywords 生成を一元管理する。
 * news-generator.ts がニュース文章を管理するのと同じ役割。
 *
 * 変更時はこのファイルだけ修正すればすべてのスクリプトに反映される。
 */

import { callAI, parseJsonResponse } from './ai';

export interface TranslatedToolData {
  tagline_ja: string | null;
  description_ja: string | null;
  search_keywords: string;
}

/**
 * 「by xxx」形式のPH名から会社名部分を除去する
 */
function cleanPHName(phName: string): string {
  return phName.replace(/\s+by\s+.+$/i, '').trim();
}

/**
 * AIツールの英語情報を日本語に翻訳し、search_keywords も生成して返す。
 *
 * @param nameEn   ツール名（Product Hunt正式名 or 公式名）
 * @param tagline  英語タグライン（なければnull）
 * @param description 英語説明文（なければnull）
 */
export async function translateToJapanese(
  nameEn: string,
  tagline: string | null,
  description: string | null
): Promise<TranslatedToolData> {
  const cleanName = cleanPHName(nameEn);

  // 翻訳対象がなければキーワードだけ返す
  if (!tagline && !description) {
    return { tagline_ja: null, description_ja: null, search_keywords: cleanName };
  }

  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。

【ツール名（Product Hunt正式名）】: ${nameEn}

【翻訳対象】
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}

tagline_jaルール：
・「[カテゴリ] [キャッチコピー]」形式・25文字以内・会社名・製品名禁止
・「ソリューション」「シームレス」「インサイト」「ワークフロー」「エコシステム」等のカタカナ業界用語禁止
・何ができるかを具体的な動詞で表現する（例：「議事録を自動で文字起こし」「コードのバグを瞬時に検出」「SNS投稿をAIが自動で作成」）
・抽象的なキャッチコピー（「あなたの可能性を広げる」等）禁止

description_jaルール：
・最大4文・合計200文字以内
・会社名・製品名・バージョン番号禁止
・日本のAI初心者にも分かりやすい言葉で書く
・何ができるか・特徴・想定ユーザーを含む
・難しい専門用語・カタカナ語は使わない（「ソリューション」「インサイト」「ワークフロー」「シームレス」「オンボーディング」等は日本語に言い換える）
・「〜します。〜です。〜ます。」のように短文を並べることは絶対禁止
・複数の内容は「、」でつないで1文にまとめる
・各文末に「。」をつける

search_keywordsルール：製品名のみ（機能説明・会社名・バージョン番号は絶対に入れない）英語の製品名とカタカナ読みのみ
例: "Fathom,ファザム" / "Claude,クロード" / "ChatGPT,チャットGPT" / "Midjourney,ミッドジャーニー"

{"tagline_ja":"翻訳結果またはnull","description_ja":"各文末に「。」をつけた日本語概要またはnull","search_keywords":"keyword1,keyword2"}`;

  const raw = await callAI(prompt);
  const sanitized = raw.replace(
    /(\"(?:[^\"\\]|\\.)*\")/g,
    (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  );
  const result = parseJsonResponse<{
    tagline_ja: string | null;
    description_ja: string | null;
    search_keywords: string | null;
  }>(sanitized);

  return {
    tagline_ja: result.tagline_ja ?? null,
    description_ja: result.description_ja ?? null,
    search_keywords: result.search_keywords ?? cleanName,
  };
}
