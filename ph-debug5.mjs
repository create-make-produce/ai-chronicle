const url = 'https://www.producthunt.com/products/askquerylens';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Chronicle-Bot/1.0)' },
});
console.log('status:', res.status);
const html = await res.text();
console.log('html length:', html.length);

const m1 = html.match(/"websiteUrl":"(https?:\/\/[^"]+)"/);
console.log('websiteUrl match:', m1?.[1] ?? 'NOT FOUND');

const m2 = html.match(/data-test="visit-website-button"[^>]*href="([^"]+)"/);
console.log('visit-button match:', m2?.[1] ?? 'NOT FOUND');

// 最初の1000文字
console.log('html start:', html.substring(0, 200));
