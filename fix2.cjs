const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
let patched = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/table-layout:\s*auto\s*!important/g, 'table-layout: fixed !important');
  // Add a base style for all tables to have word-wrap
  content = content.replace(/th,\s*td\s*\{\s*border/g, 'th, td { word-wrap: break-word !important; border');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patched++;
  }
}

console.log('Total files patched with fixed layout:', patched);
