const https = require('https');
const p = `A hyper-realistic 3D travel guide infographic poster for Arab Saudi. The country shape is rendered as a raised, textured terrain map floating on a clean light gray surface. Iconic landmarks are placed as miniature 3D sculpted models at their correct geographic locations across the map — each one highly detailed and photorealistic. Roads or railway lines connect key cities as white paths across the terrain. Around the map, floating 3D decorative props related to travel are scattered: a vintage leather suitcase with travel stickers, a compass rose, crystal heart charms, and a postage stamp seal reading "Travel to Arab Saudi". The national flag of Arab Saudi is shown as a small realistic folded flag in the upper right corner. Each major city has a bold black label on the map, and beside the map, each city has a neat checklist of its top attractions in clean sans-serif typography. A large bold title at the top reads: "TRAVEL GUIDE TO Arab Saudi" in black uppercase typography with the word Arab Saudi in heavy bold. The overall aesthetic is premium editorial travel content — soft studio lighting, photorealistic 3D render, white or light gray background, clean layout.`;
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1200&height=800&nologo=true`;

https.get(url, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
}).on('error', (e) => {
  console.error(e);
});
