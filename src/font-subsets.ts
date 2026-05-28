/**
 * フォントサブセット定義（参照ドキュメント）
 *
 * ⚠️ このファイルはlayout.tsxにはimportしない。
 *    Next.js font loaderはリテラル文字列のみ受け付けるため、
 *    layout.tsxには同じ内容を直接記述している。
 *
 * 文字を追加・変更する場合は：
 *   1. このファイルの該当箇所を更新（管理用）
 *   2. layout.tsxの対応するtext:パラメータも同じ内容に更新
 */
export const FONT_SUBSETS = {

  /**
   * Orbitron：ロゴ・ラベル専用
   * 使用箇所: Header/Footer ロゴ「AI/CHRONICLE」、HeroSection「AI CHRONICLE」
   */
  ORBITRON: 'AI/CHRONICLE ',

  /**
   * Fira Sans：英語UI・日付・バッジ専用
   * 使用箇所: ナビ英語名・ヒーロー見出し・ニュースバッジ・日付・著作権表記
   */
  FIRA_SANS: [
    // ナビゲーション
    'TOP NEWS MONTHLY TOOLS ABOUT',
    // ヒーローセクション
    'AI TOOLS LATEST INFO AI CHRONICLE',
    // PageHeroラベル
    'AI NEWS AI TOOL',
    // ニュースバッジ（英語）
    'Price Change New Tool New Feature Other',
    // ToolCard
    'Learn more',
    // フッターコピーライト
    '© AI Chronicle. All rights reserved.',
    // 日付・時刻文字（数字・記号・JST）
    '0123456789/:- JST',
    // MonthSelect英語
    'Select period:',
    // 月名
    'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec',
    // カテゴリ英語名
    'Text Generation Image Video Audio Music Coding Assistant Productivity Research Analysis Marketing Other',
    // LinkBadge
    'Visit App Store Google Play',
    // 記号類
    '▶ . , & ( ) _',
  ].join(' '),

  /**
   * Noto Sans JP：日本語固定UIテキスト専用
   * 使用箇所: ナビ日本語名・フッター・バッジ・カテゴリ名・固定ラベル
   */
  NOTO_SANS_JP: [
    // ナビゲーション
    'トップニュース月刊AIツール一覧',
    // フッターリンク
    '運営についてプライバシーポリシーお問い合わせ',
    // フッター説明文
    'AI最新情報データベース：最新ニュース・アップデート情報を一つの場所で確認',
    // フッター免責
    '※最新・正確な情報は各ツールの公式ページをご確認ください。',
    // ボトムナビ
    'AI一覧',
    // ニュースバッジ（日本語）
    '料金改定新ツール新機能その他',
    // カテゴリ日本語名（8種固定）
    'テキスト生成画像動画音声音楽コーディング業務効率化情報分析マーケティング',
    // ToolCard
    '詳しく見る',
    // パンくず固定部分
    'ホームすべてのAI',
    // ToolDetail固定ラベル
    '概要リンクメディアWebサイトダウンロードデモを見る動画を見るユーザー数',
    // NewsDetail
    'ニュース一覧に戻る',
    // MonthSelect
    '期間を選択：',
    // 日付日本語
    '年月日',
  ].join(''),

  /**
   * Noto Serif JP：ヒーローキャッチコピー専用
   * 使用箇所: HeroSection の4行コピーテキスト
   */
  NOTO_SERIF_JP: [
    // 日本語ロケール
    'AIの世界は、毎日動いている',
    '海外発の最新ツールを日本語でいち早く',
    '新機能／新サービス／料金改定',
    '知るべきニュースを、見逃さない',
    // 英語ロケール
    'The AI world moves every day',
    'The latest tools from overseas in Japanese',
    'New features services Price changes',
    'Stay ahead Miss nothing',
  ].join(''),

} as const;
