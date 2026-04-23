// =============================================
// AI Chronicle - UUID生成ユーティリティ
// =============================================
// Node.jsの crypto モジュールの randomUUID を使用
// （Node 19+で標準搭載）
// =============================================

import { randomUUID } from 'node:crypto';

/**
 * UUID v4 を生成
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * プレフィックス付きIDを生成
 * 例: generateId('tool') → 'tool_a1b2c3d4...'
 */
export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}
