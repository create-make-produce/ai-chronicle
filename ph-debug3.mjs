import { readFileSync } from 'fs';
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

// post(id:) と post(slug:) の両方を試す
for (const query of [
  `query { post(id: "1125981") { url website } }`,
  `query { post(slug: "askquerylens") { url website } }`,
]) {
  const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  console.log('Query:', query.substring(0, 50));
  console.log('Result:', JSON.stringify(json.data ?? json.errors, null, 2));
  console.log('---');
}
