// =============================================
// AI Chronicle - Cloudflare D1 REST APIクライアント
// =============================================
// GitHub ActionsなどNode.js環境からD1を操作する際に使用
// 本番Worker/Pages環境ではenv.DBバインディング経由で直接アクセス
// =============================================

/**
 * D1のREST APIのレスポンス形式
 */
interface D1ApiResponse<T = unknown> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: Array<{
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
  }>;
}

/**
 * D1 REST APIクライアント
 */
export class D1Client {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;

  constructor(config: {
    accountId: string;
    databaseId: string;
    apiToken: string;
  }) {
    this.accountId = config.accountId;
    this.databaseId = config.databaseId;
    this.apiToken = config.apiToken;
  }

  /**
   * 環境変数から自動でクライアントを生成
   */
  static fromEnv(): D1Client {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !databaseId || !apiToken) {
      throw new Error(
        'D1Client: 環境変数 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_D1_DATABASE_ID / CLOUDFLARE_API_TOKEN が必要です'
      );
    }

    return new D1Client({ accountId, databaseId, apiToken });
  }

  /**
   * SQLクエリを実行（SELECT用）
   * パラメータ化クエリに対応。第二引数はバインドする値の配列。
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`D1 query failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as D1ApiResponse<T>;

    if (!json.success) {
      const errorMessages = json.errors.map((e) => e.message).join(', ');
      throw new Error(`D1 query error: ${errorMessages}`);
    }

    return json.result[0]?.results ?? [];
  }

  /**
   * INSERT/UPDATE/DELETE用（結果セットを返さない）
   */
  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.query(sql, params);
  }

  /**
   * 1件取得（該当なければnull）
   */
  async first<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results[0] ?? null;
  }
}
