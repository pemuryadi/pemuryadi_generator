const https = require('https');
const p = `Hyper-realistic 3D travel guide infographic poster for Arab Saudi. Raised textured terrain map floating on clean light gray surface. Miniature 3D sculpted landmarks at geographic locations. Roads connect key cities. Floating 3D props: vintage leather suitcase, compass rose, crystal heart charms, postage stamp. National flag of Arab Saudi in corner. Bold black city labels. Title: TRAVEL GUIDE TO Arab Saudi. Editorial style, studio lighting.`;
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
