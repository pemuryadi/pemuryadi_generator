const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
let patched = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Let's find styles specifically in window.open or print block
  // A safe replacement: find 'th, td {' and if it lacks 'border:', add it.
  // Actually, we can just replace 'th, td {' with 'th, td { border: 1px solid #d1d5db !important; padding: 8px !important; '
  content = content.replace(/th,\s*td\s*\{/g, 'th, td { border: 1px solid #777 !important; padding: 8px !important;');
  
  // also make sure table has borders
  // replace 'table {' with 'table { border: 1px solid #777 !important;'
  content = content.replace(/(\s+)table\s*\{/g, '$1table { border: 1px solid #777 !important;');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patched++;
  }
}

console.log('Total files patched:', patched);
