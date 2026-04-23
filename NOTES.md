# AI Chronicle - 運用メモ

## GitHubリポジトリについて

### 現在の設定
- リポジトリ：https://github.com/create-make-produce/ai-chronicle
- 公開設定：**Public**

### Privateに変更するには
1. https://github.com/create-make-produce/ai-chronicle/settings にアクセス
2. 一番下の「Danger Zone」セクションまでスクロール
3. 「Change visibility」をクリック
4. 「Change to private」を選択
5. リポジトリ名（ai-chronicle）を入力して確定

**注意：PrivateにするとGitHub Actionsの無料枠が月2,000分に制限される。**
AI Chronicleの自動収集は月200〜380分程度なので収まる範囲ではあるが、
余裕を持たせるためPublicのままが推奨。

### GitHub Actions使用分数の確認方法
- https://github.com/settings/billing にアクセス
- 「Actions」の項目で当月の使用分数・残り分数を確認できる

---

## 宿題リスト（後回し・優先度低）

### データ収集の実行頻度を1日6回に増やす
現在は1日1回（UTC 02:00）だが、Product Huntは1日中投稿がバラバラに来るため
6回/日に増やすと取りこぼしが減る。

変更が必要なファイル：
- `.github/workflows/collect-new-tools.yml`
  ```yaml
  # 現在
  - cron: '0 2 * * *'
  # 変更後（4時間ごと）
  - cron: '0 2,6,10,14,18,22 * * *'
  ```

注意：実行回数を増やしてもGeminiのリクエスト数は「実際の新着数」にしか比例しない
（重複はGemini呼び出し前にD1照合でスキップされるため）。
Gemini 2.5 Flash-Liteの無料枠（1,000RPD）は余裕で収まる。
