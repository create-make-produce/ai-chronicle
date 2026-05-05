import puppeteer from 'puppeteer';
(async () => {
  const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await p.goto('https://www.producthunt.com/products/chatgpt', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const html = await p.content();
  // App Store周辺の100文字を出力
  const idx = html.indexOf('App Store');
  if (idx >= 0) console.log('App Store周辺:', JSON.stringify(html.slice(Math.max(0, idx-200), idx+50)));
  const idx2 = html.indexOf('Play Store');
  if (idx2 >= 0) console.log('Play Store周辺:', JSON.stringify(html.slice(Math.max(0, idx2-200), idx2+50)));
  await b.close();
})();
