// src/lib/tool-publish.ts
// =============================================
// ツール登録時の公開判定ロジック（全登録スクリプト共通）
// collect-new-tools.ts / collect-news-bulk.ts / seed-from-url.ts / seed-ph-top100.ts
// ここを変えると全スクリプトに反映される
// =============================================

export interface PublishJudgeInput {
  officialUrl:  string | null;
  confidenceOk: boolean;
  logoUrl:      string | null;
  isChromeStore?: boolean;
}

export interface PublishJudgeResult {
  isPublished:       0 | 1;
  unpublishCondition: boolean;
  reasons:           string[];
}

/**
 * ツールを公開すべきか判定する
 *
 * 公開条件（全部満たす場合のみ公開）：
 *   - 公式URLがある
 *   - github.com URLでない
 *   - AIコンフィデンススコアが閾値以上
 *   - ロゴURLがある
 *
 * 非公開になる理由：
 *   - 公式URLなし
 *   - GitHub URLのみ
 *   - コンフィデンス不足
 *   - ロゴなし
 *   - Chrome拡張ストアURL（保留扱い）
 *
 * ※ 会社名は公開条件に含まない（auto-check-tools.tsが後から補完する）
 */
export function judgePublish(input: PublishJudgeInput): PublishJudgeResult {
  const { officialUrl, confidenceOk, logoUrl, isChromeStore = false } = input;

  const reasons: string[] = [];

  const hasOfficialUrl = !!officialUrl;
  const isGithubOnly   = !!officialUrl && officialUrl.includes('github.com');
  const isStoreOnly    = !!officialUrl && (
    officialUrl.includes('apps.apple.com') ||
    officialUrl.includes('play.google.com')
  );
  const hasLogo        = !!logoUrl;

  if (!hasOfficialUrl)  reasons.push('公式URLなし');
  if (isGithubOnly)     reasons.push('GitHub URL');
  if (isStoreOnly)      reasons.push('App Store / Google Play のみ');
  if (isChromeStore)    reasons.push('Chrome拡張ストアURL');
  if (!confidenceOk)    reasons.push('コンフィデンス不足');
  if (!hasLogo)         reasons.push('ロゴなし');

  const unpublishCondition = !hasOfficialUrl || isGithubOnly || isStoreOnly || isChromeStore || !confidenceOk || !hasLogo;
  const isPublished        = unpublishCondition ? 0 : 1;

  return { isPublished, unpublishCondition, reasons };
}
