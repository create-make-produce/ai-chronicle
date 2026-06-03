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
  use_case_ja: string | null;
  target_user_ja: string | null;
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
    return { tagline_ja: null, description_ja: null, use_case_ja: null, target_user_ja: null, search_keywords: cleanName };
  }

  const prompt = `以下の英語テキストを日本語に翻訳してください。JSONのみ出力。

【ツール名（Product Hunt正式名）】: ${nameEn}

【翻訳対象】
- tagline: ${tagline ?? '（なし）'}
- description: ${description ?? '（なし）'}

tagline_jaルール：
・「[カテゴリ] [キャッチコピー]」形式・35文字以内・会社名・製品名禁止
・「ソリューション」「シームレス」「インサイト」「ワークフロー」「エコシステム」等のカタカナ業界用語禁止
・何ができるかを具体的な動詞で表現する（例：「議事録を自動で文字起こし」「コードのバグを瞬時に検出」「SNS投稿をAIが自動で作成」）
・抽象的なキャッチコピー（「あなたの可能性を広げる」等）禁止

description_jaルール：
・250文字以上・上限なし
・会社名・製品名・バージョン番号禁止
・日本のAI初心者にも分かりやすい言葉で書く
・何ができるか・特徴を中心に書く
・難しい専門用語・カタカナ語は使わない（「ソリューション」「インサイト」「ワークフロー」「シームレス」「オンボーディング」等は日本語に言い換える）
・「〜します。〜です。〜ます。」のように短文を並べることは絶対禁止
・複数の内容は「、」でつないで1文にまとめる
・各文末に「。」をつける

use_case_jaルール：
・このツールの活用用途を箇条書きで最低1個・最大5個
・各項目は20文字以内で簡潔に
・文末に「。」不要
・JSON配列形式で出力（例：["SNS投稿用画像の作成", "プレゼン資料の素材づくり"]）

target_user_jaルール：
・このツールを使うのに向いている人物像を箇条書きで最低1個・最大5個
・各項目は25文字以内で簡潔に
・文末に「。」不要
・JSON配列形式で出力（例：["デザインツールが苦手なビジネスパーソン", "素材を自作したいブロガー"]）

search_keywordsルール：英語の製品名のみ（カタカナ読みは登録しない・機能説明・会社名・バージョン番号は絶対に入れない）
・ツール名自体がカタカナの場合のみカタカナで登録する
例: "Fathom" / "Claude" / "ChatGPT" / "Midjourney"

{"tagline_ja":"翻訳結果またはnull","description_ja":"250文字以上の日本語概要またはnull","use_case_ja":["活用用途1","活用用途2"],"target_user_ja":["利用者像1","利用者像2"],"search_keywords":"keyword1,keyword2"}`;

  const raw = await callAI(prompt);
  const sanitized = raw.replace(
    /(\"(?:[^\"\\]|\\.)*\")/g,
    (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  );
  const result = parseJsonResponse<{
    tagline_ja: string | null;
    description_ja: string | null;
    use_case_ja: string[] | null;
    target_user_ja: string[] | null;
    search_keywords: string | null;
  }>(sanitized);

  return {
    tagline_ja: result.tagline_ja ?? null,
    description_ja: result.description_ja ?? null,
    use_case_ja: result.use_case_ja ? JSON.stringify(result.use_case_ja) : null,
    target_user_ja: result.target_user_ja ? JSON.stringify(result.target_user_ja) : null,
    search_keywords: result.search_keywords ?? cleanName,
  };
}
