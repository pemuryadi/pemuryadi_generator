const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
let patched = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Set width of th if not already present
  if (!content.includes('th { width: 25% !important; }')) {
    // find 'th, td { word-wrap...' and inject th { width:... } before or after
    content = content.replace(/(th,\s*td\s*\{\s*word-wrap:\s*break-word\s*!important;\s*border:[^}]+})/, '$1\n                th { width: 25% !important; }');
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Patched th', file);
    patched++;
  }
}

console.log('Total files patched with th width:', patched);
