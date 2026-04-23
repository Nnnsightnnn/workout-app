const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'workout-app.html');

// 1. Read template
const template = fs.readFileSync(path.join(SRC, 'template.html'), 'utf-8');

// 2. Read CSS
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf-8');

// 2b. Inline fonts (Latin-only subsets from mockups/fonts/)
let fontCSS = '';
const fontsCSSPath = path.join(ROOT, 'mockups', 'fonts', 'fonts.css');
if (fs.existsSync(fontsCSSPath)) {
  const fontsDir = path.join(ROOT, 'mockups', 'fonts');
  const raw = fs.readFileSync(fontsCSSPath, 'utf8');
  // Split into individual @font-face blocks (each preceded by a /* comment */)
  const blocks = raw.split(/(?=\/\*\s)/).filter(b => b.trim());
  // Keep only /* latin */ blocks (not latin-ext, cyrillic, greek, vietnamese)
  const latinBlocks = blocks.filter(b => /^\/\*\s+latin\s+\*\//.test(b.trim()));
  // Replace url(font-X.woff2) with inline data URIs
  fontCSS = latinBlocks.join('\n').replace(/url\((font-\d+\.woff2)\)/g, (match, filename) => {
    const filePath = path.join(fontsDir, filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      return 'url(data:font/woff2;base64,' + data.toString('base64') + ')';
    }
    console.warn('  Warning: font file not found: ' + filename);
    return match;
  });
  const faceCount = (fontCSS.match(/@font-face/g) || []).length;
  console.log(`  Fonts inlined (${faceCount} @font-face blocks, Latin only)`);
} else {
  console.log('  No fonts directory — using system fonts only');
}

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
  .replace('/* {{FONTS}} */', fontCSS)
  .replace('/* {{CSS}} */', css)
  .replace('/* {{JS}} */', js);

// 5. Inject build hash
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(output).digest('hex').slice(0, 8);
output = output.replace('__BUILD_HASH__', hash);

// 6. Write output
fs.writeFileSync(OUT, output, 'utf-8');

// 7. Report
const lines = output.split('\n').length;
console.log(`Built ${OUT} (${lines} lines, ${output.length} bytes, hash: ${hash})`);
