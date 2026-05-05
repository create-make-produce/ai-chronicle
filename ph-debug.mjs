import { readFileSync } from 'fs';

// .env.localから環境変数読み込み
const env = readFileSync('.env.local', 'utf-8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
}

const clientId = process.env.PRODUCT_HUNT_API_KEY;
const clientSecret = process.env.PRODUCT_HUNT_API_SECRET;

const tokenRes = await fetch('https://api.producthunt.com/v2/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
});
const { access_token } = await tokenRes.json();

const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { post(id: "1125981") { url website product { websiteUrl } } }`
  }),
});
const json = await res.json();
console.log(JSON.stringify(json.data?.post, null, 2));
