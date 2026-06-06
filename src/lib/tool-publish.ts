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
  fetchFailed?: boolean;  // 公式URLがあってfetch失敗 → 保留
  sslError?: boolean;     // SSL証明書エラー → 非公開
}

export interface PublishJudgeResult {
  isPublished:       0 | 1;
  status:            'active' | 'inactive' | 'pending';
  unpublishCondition: boolean;
  reasons:           string[];
  pendingMemo:       string | null;  // 保留時の管理画面表示用メモ
}

/**
 * ツールを公開すべきか判定する
 *
 * 公開条件（全部満たす場合のみ公開）：
 *   - 公式URLがある
 *   - github.com URLでない
 *   - AIコンフィデンススコアが閾値以上
 *   - ロゴURLがある
 *   - 公式URLがあってfetch失敗でない
 *
 * 非公開になる理由：
 *   - 公式URLなし
 *   - GitHub URLのみ
 *   - コンフィデンス不足
 *   - ロゴなし
 *   - Chrome拡張ストアURL（非公開扱い・同会社ツールがあれば呼び出し側で保留に変更）
 *   - 公式URLがあってfetch失敗（保留扱い）
 *
 * ※ 会社名は公開条件に含まない（auto-check-tools.tsが後から補完する）
 */
export function judgePublish(input: PublishJudgeInput): PublishJudgeResult {
  const { officialUrl, confidenceOk, logoUrl, isChromeStore = false, fetchFailed = false, sslError = false } = input;

  const reasons: string[] = [];

  const hasOfficialUrl    = !!officialUrl;
  const isGithubOnly      = !!officialUrl && officialUrl.includes('github.com');
  const isStoreOnly       = !!officialUrl && (
    officialUrl.includes('apps.apple.com') ||
    officialUrl.includes('play.google.com')
  );
  const hasLogo           = !!logoUrl;
  const isFetchFailed     = hasOfficialUrl && fetchFailed && !sslError;
  const isSslFailed       = hasOfficialUrl && fetchFailed && sslError;

  if (!hasOfficialUrl)  reasons.push('公式URLなし');
  if (isGithubOnly)     reasons.push('GitHub URL');
  if (isStoreOnly)      reasons.push('App Store / Google Play のみ');
  if (isChromeStore)    reasons.push('Chrome拡張ストアURL');
  if (!confidenceOk)    reasons.push('コンフィデンス不足');
  if (!hasLogo)         reasons.push('ロゴなし');
  if (isFetchFailed)    reasons.push('公式サイトfetch失敗');
  if (isSslFailed)      reasons.push('SSL証明書エラー');

  const unpublishCondition = !hasOfficialUrl || isGithubOnly || isStoreOnly || isChromeStore || !confidenceOk || !hasLogo || isFetchFailed || isSslFailed;
  const isPublished        = unpublishCondition ? 0 : 1;
  // SSL証明書エラーはinactive（証明書が無効なサイトは信頼できない）
  // その他のfetch失敗はpending（ボット対策されている有名ツールの可能性）
  // Chrome拡張はinactive（同会社ツールがあれば呼び出し側でpendingに変更）
  const status             = isFetchFailed ? 'pending' : isPublished ? 'active' : 'inactive';
  const pendingMemo        = isFetchFailed ? '公式サイトにアクセスできず' : null;

  return { isPublished, status, unpublishCondition, reasons, pendingMemo };
}
