const https = require('https');
const p = `A 3D travel poster for Arab Saudi`;
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1200&height=800&nologo=true`;

https.get(url, (res) => {
  console.log('Status:', res.statusCode);
  if (res.statusCode >= 300 && res.statusCode < 400) {
     console.log('Redirect:', res.headers.location);
  }
  process.exit(0);
}).on('error', (e) => {
  console.error(e);
});
