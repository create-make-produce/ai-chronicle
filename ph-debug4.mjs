const url = 'https://www.producthunt.com/r/S6ZDCCSH3CYDUY?utm_campaign=producthunt-api&utm_medium=api-v2&utm_source=Application%3A+AI+Chronicle+%28ID%3A+283081%29';

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

const res = await fetch(url, {
  method: 'HEAD',
  redirect: 'follow',
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Chronicle-Bot/1.0)' },
  signal: controller.signal,
});
clearTimeout(timeout);
console.log('status:', res.status);
console.log('final url:', res.url);
