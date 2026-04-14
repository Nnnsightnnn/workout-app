const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'workout-app.html');

// 1. Read template
const template = fs.readFileSync(path.join(SRC, 'template.html'), 'utf-8');

// 2. Read CSS
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf-8');

// 3. Read and concatenate JS files in order
const jsDir = path.join(SRC, 'js');
const jsFiles = fs.readdirSync(jsDir)
  .filter(f => f.endsWith('.js'))
  .sort();

const js = jsFiles
  .map(f => fs.readFileSync(path.join(jsDir, f), 'utf-8'))
  .join('\n\n');

// 4. Inject into template
let output = template
  .replace('/* {{CSS}} */', css)
  .replace('/* {{JS}} */', js);

// 5. Write output
fs.writeFileSync(OUT, output, 'utf-8');

// 6. Report
const lines = output.split('\n').length;
console.log(`Built ${OUT} (${lines} lines, ${output.length} bytes)`);
