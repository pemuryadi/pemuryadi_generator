const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
let patched = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add strong constraints to body, table, th, td
  content = content.replace(/body\s*\{\s*-webkit-print-color-adjust/g, `
                html, body {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow-x: hidden !important;
                }
                body { -webkit-print-color-adjust`);

  content = content.replace(/table\s*\{(?![^}]*page-break-after: auto)/g, `table {
                  width: 100% !important;
                  max-width: 100% !important;
                  table-layout: fixed !important;
                  page-break-inside: auto !important;
                  border-collapse: collapse !important;
`);
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Patched global width constraints', file);
    patched++;
  }
}

console.log('Total files patched with global width constraints:', patched);
