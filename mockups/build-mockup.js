#!/usr/bin/env node
// build-mockup.js — Build a self-contained HTML mockup from a JSX skin file
// Usage: node mockups/build-mockup.js <skin-name> [--open]
// Output: mockups/dist/<skin-name>.html
//
// Bundles React + Babel + fonts + canvas + skin into one HTML file.
// No CDN, no server, no external requests. Just open the file.

const fs = require('fs');
const path = require('path');

const { execSync } = require('child_process');

const MOCKUPS = __dirname;
const SKINS   = path.join(MOCKUPS, 'skins');
const FONTS   = path.join(MOCKUPS, 'fonts');
const LIB     = path.join(MOCKUPS, 'lib');
const ASSETS  = path.join(MOCKUPS, 'assets');
const DIST    = path.join(MOCKUPS, 'dist');

const args = process.argv.slice(2);
const skinName = args.find(a => !a.startsWith('-'));
const shouldOpen = args.includes('--open');

if (!skinName) {
  const available = fs.readdirSync(SKINS).filter(f => f.endsWith('.jsx')).map(f => f.replace('.jsx', ''));
  console.log('Usage: node mockups/build-mockup.js <skin-name> [--open]');
  console.log('Available skins:', available.join(', ') || '(none — add .jsx files to mockups/skins/)');
  process.exit(1);
}

// Find skin file (.jsx or .js)
let skinPath = path.join(SKINS, skinName + '.jsx');
if (!fs.existsSync(skinPath)) skinPath = path.join(SKINS, skinName + '.js');
if (!fs.existsSync(skinPath)) {
  console.error('Skin not found: ' + skinName + '.jsx in ' + SKINS);
  process.exit(1);
}

// ─── Read source files ───
console.log('Building skin: ' + skinName);

const reactJS    = fs.readFileSync(path.join(LIB, 'react.min.js'), 'utf8');
const reactDomJS = fs.readFileSync(path.join(LIB, 'react-dom.min.js'), 'utf8');
const babelJS    = fs.readFileSync(path.join(LIB, 'babel.min.js'), 'utf8');
const canvasJSX  = fs.readFileSync(path.join(MOCKUPS, 'canvas.jsx'), 'utf8');
const skinJSX    = fs.readFileSync(skinPath, 'utf8');

// ─── Read the skin's App shell (or generate a default one) ───
let appShellPath = path.join(SKINS, skinName + '.app.jsx');
let appShellJSX;
if (fs.existsSync(appShellPath)) {
  appShellJSX = fs.readFileSync(appShellPath, 'utf8');
} else {
  // Auto-generate from SKIN_META if defined in the skin file, or use a generic shell
  appShellJSX = null; // will be generated below
}

// ─── Inline fonts ───
let fontCSS = '';
const fontsCSSPath = path.join(FONTS, 'fonts.css');
if (fs.existsSync(fontsCSSPath)) {
  let raw = fs.readFileSync(fontsCSSPath, 'utf8');
  raw = raw.replace(/url\((font-\d+\.woff2?)\)/g, function(match, filename) {
    const filePath = path.join(FONTS, filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      const b64 = data.toString('base64');
      const mime = filename.endsWith('.woff2') ? 'font/woff2' : 'font/woff';
      return 'url(data:' + mime + ';base64,' + b64 + ')';
    }
    console.warn('  Warning: font file not found: ' + filename);
    return match;
  });
  fontCSS = raw;
  console.log('  Fonts inlined (' + raw.split('@font-face').length - 1 + ' faces)');
} else {
  console.log('  No fonts.css — system font fallbacks');
}

// ─── Inline assets (images/textures from S3) ───
let assetsJS = 'window.SKIN_ASSETS = {};';
const assetsManifestPath = path.join(SKINS, skinName + '.assets.json');
if (fs.existsSync(assetsManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(assetsManifestPath, 'utf8'));
  const configPath = path.join(MOCKUPS, 'config.json');
  let config = null;
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const assetEntries = {};
  const entries = Object.entries(manifest);
  console.log('  Loading ' + entries.length + ' assets...');

  entries.forEach(function(kv) {
    const name = kv[0], s3Key = kv[1];
    // Check local cache first
    const localPath = path.join(ASSETS, s3Key);

    if (!fs.existsSync(localPath)) {
      // Download from S3
      if (!config) {
        console.warn('  Warning: ' + name + ' not cached and no config.json — skipping');
        return;
      }
      console.log('  Downloading: ' + s3Key);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      try {
        execSync('aws s3 cp "s3://' + config.bucket + '/' + s3Key + '" "' + localPath + '" --region ' + config.region,
          { stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (e) {
        console.warn('  Warning: failed to download ' + s3Key + ' — ' + (e.stderr || e.message));
        return;
      }
    }

    // Base64 encode
    const data = fs.readFileSync(localPath);
    const ext = path.extname(s3Key).toLowerCase();
    const mimes = { '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg',
      '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.gif':'image/gif', '.avif':'image/avif' };
    const mime = mimes[ext] || 'application/octet-stream';
    const dataUri = 'data:' + mime + ';base64,' + data.toString('base64');
    assetEntries[name] = dataUri;
    console.log('  ' + name + ': ' + (data.length / 1024).toFixed(0) + ' KB');
  });

  assetsJS = 'window.SKIN_ASSETS = ' + JSON.stringify(assetEntries) + ';';
}

// ─── Build the App shell JSX ───
// The skin file exports screen components to window (e.g. KNHomeScreen, etc.)
// We need to detect them and wire them into the DesignCanvas.
// If the skin has a SKIN_META export, use it. Otherwise, detect exported functions.
if (!appShellJSX) {
  appShellJSX = `
function Frame({ children, label }) {
  return (
    <DCArtboard label={label} width={402} height={874}>
      {children}
    </DCArtboard>
  );
}

function App() {
  // Auto-detect screen components from the skin
  var meta = window.SKIN_META || {};
  var title = meta.title || 'K&N Lifts Mockup — ${skinName}';
  var tag = meta.tag || '';
  var desc = meta.description || '';
  var specs = meta.specs || '';
  var sections = meta.sections || [];

  return (
    <DesignCanvas>
      <div style={{padding:'20px 60px 40px',fontFamily:'"Oswald",sans-serif'}}>
        {tag && <div style={{fontSize:11,letterSpacing:'0.3em',fontFamily:'"JetBrains Mono",monospace',color:'rgba(60,50,40,0.6)',marginBottom:8}}>{tag}</div>}
        <div style={{fontSize:64,fontWeight:600,letterSpacing:'-0.03em',textTransform:'uppercase',lineHeight:0.9,color:'rgba(40,30,20,0.9)'}} dangerouslySetInnerHTML={{__html:title}} />
        {desc && <div style={{marginTop:10,maxWidth:720,fontFamily:'"JetBrains Mono",monospace',fontSize:11,letterSpacing:'0.1em',lineHeight:1.7,color:'rgba(60,50,40,0.7)',textTransform:'uppercase'}}>{desc}</div>}
      </div>

      {sections.map(function(sec, si) {
        return (
          <DCSection key={si} title={sec.title} subtitle={sec.subtitle} gap={sec.gap || 56}>
            {sec.screens.map(function(scr, i) {
              var Comp = window[scr.component];
              return Comp ? <Frame key={i} label={scr.label}><Comp /></Frame> : null;
            })}
          </DCSection>
        );
      })}

      {specs && (
        <div style={{padding:'0 60px',maxWidth:900}}>
          <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,letterSpacing:'0.14em',lineHeight:1.9,color:'rgba(60,50,40,0.75)',textTransform:'uppercase',borderTop:'1px solid rgba(0,0,0,0.2)',borderBottom:'1px solid rgba(0,0,0,0.2)',padding:'14px 0'}}>{specs}</div>
        </div>
      )}
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`;
}

// ─── Assemble HTML ───
const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>K&N Lifts Mockup — ${skinName}</title>
<style>
html, body { margin: 0; padding: 0; background: #f0eee9; }
* { box-sizing: border-box; }
${fontCSS}
</style>
</head>
<body>
<div id="root"></div>
<script>${reactJS}</script>
<script>${reactDomJS}</script>
<script>${babelJS}</script>
<script>${assetsJS}</script>
<script type="text/babel">
${canvasJSX}
</script>
<script type="text/babel">
${skinJSX}
</script>
<script type="text/babel">
${appShellJSX}
</script>
</body>
</html>`;

// ─── Write output ───
fs.mkdirSync(DIST, { recursive: true });
const outPath = path.join(DIST, skinName + '.html');
fs.writeFileSync(outPath, html);

const sizeMB = (Buffer.byteLength(html) / (1024 * 1024)).toFixed(1);
console.log('  Built: ' + outPath + ' (' + sizeMB + ' MB)');

// ─── Optionally open ───
if (shouldOpen) {
  const { exec } = require('child_process');
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(cmd + ' "' + outPath + '"');
}
