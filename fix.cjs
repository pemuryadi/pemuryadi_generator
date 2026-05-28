const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
let patched = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/th,\s*td\s*\{/g, 'th, td { border: 1px solid #777 !important; padding: 10px !important;');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patched++;
  }
}

console.log('Total files patched:', patched);
