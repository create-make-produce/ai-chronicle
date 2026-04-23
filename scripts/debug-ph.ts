// =============================================
// AI Chronicle - Product Hunt デバッグスクリプト
// =============================================
// 実行: npm run debug-ph
// 生のProduct Huntデータを確認する
// =============================================

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else {
  loadEnv();
}

import { fetchLatestPosts, isAITool } from '../src/lib/product-hunt';
import { CONFIG } from '../src/config';

async function main() {
  console.log('🔍 Product Hunt デバッグ開始');
  console.log(`   CONFIG.PRODUCT_HUNT_POSTS_PER_REQUEST = ${CONFIG.PRODUCT_HUNT_POSTS_PER_REQUEST}`);
  console.log(`   CONFIG.PRODUCT_HUNT_MIN_VOTES = ${CONFIG.PRODUCT_HUNT_MIN_VOTES}`);
  console.log('');

  try {
    const posts = await fetchLatestPosts();
    console.log(`✅ 取得成功: ${posts.length}件\n`);

    if (posts.length === 0) {
      console.log('⚠️  投稿が0件。APIエンドポイントに問題がある可能性があります。');
      return;
    }

    let aiCount = 0;
    let voteFilteredCount = 0;
    let bothPassedCount = 0;

    posts.forEach((post, i) => {
      const isAI = isAITool(post);
      const votesOK = post.votesCount >= CONFIG.PRODUCT_HUNT_MIN_VOTES;
      if (isAI) aiCount++;
      if (votesOK) voteFilteredCount++;
      if (isAI && votesOK) bothPassedCount++;

      const aiMark = isAI ? '🤖' : '  ';
      const voteMark = votesOK ? '✓' : '✗';
      const topics = post.topics.map((t) => t.slug).join(', ');

      console.log(
        `${(i + 1).toString().padStart(2, ' ')}. ${aiMark} votes=${post.votesCount
          .toString()
          .padStart(4, ' ')} ${voteMark}  ${post.name}`
      );
      console.log(`     topics: ${topics || '(なし)'}`);
      console.log(`     tagline: ${post.tagline}`);
      console.log('');
    });

    console.log('========== サマリー ==========');
    console.log(`  全投稿: ${posts.length}件`);
    console.log(`  AI判定パス: ${aiCount}件`);
    console.log(`  投票数${CONFIG.PRODUCT_HUNT_MIN_VOTES}以上: ${voteFilteredCount}件`);
    console.log(`  両方パス（登録対象）: ${bothPassedCount}件`);
  } catch (error) {
    console.error(
      '🔥 エラー:',
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

main();
