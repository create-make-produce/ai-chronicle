import puppeteer from 'puppeteer';
(async () => {
  const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  const res = await p.goto('https://www.producthunt.com/products/chatgpt', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('status:', res?.status());
  const html = await p.content();
  console.log('App Store:', html.includes('App Store'));
  console.log('Play Store:', html.includes('Play Store'));
  const iosMatch = html.match(/href="(https?:\/\/www\.producthunt\.com\/r\/[^"]+)"[^<]*App Store/s);
  const androidMatch = html.match(/href="(https?:\/\/www\.producthunt\.com\/r\/[^"]+)"[^<]*Play Store/s);
  console.log('ios_url:', iosMatch?.[1] ?? 'なし');
  console.log('android_url:', androidMatch?.[1] ?? 'なし');
  await b.close();
})();
