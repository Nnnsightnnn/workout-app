#!/usr/bin/env node
// download-fonts.js — Download Google Fonts for offline mockup builds
// Usage: node mockups/download-fonts.js [font-url]
// Default: Plus Jakarta Sans 400-800 + JetBrains Mono 300-600 + Fraunces 300,500 italic

const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS_DIR = path.join(__dirname, 'fonts');
const DEFAULT_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&family=Fraunces:opsz,wght@9..144,300;9..144,500&display=swap';

function fetch(url) {
  return new Promise(function(resolve, reject) {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, opts, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks)); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const fontUrl = process.argv[2] || DEFAULT_URL;
  fs.mkdirSync(FONTS_DIR, { recursive: true });

  console.log('Fetching font CSS...');
  var cssBuffer = await fetch(fontUrl);
  var css = cssBuffer.toString('utf8');

  // Extract woff2 URLs
  var urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  var match, i = 0;
  var replacements = [];

  while ((match = urlRegex.exec(css)) !== null) {
    var url = match[1];
    i++;
    var localName = 'font-' + i + '.woff2';
    console.log('  [' + i + '] Downloading → ' + localName);
    var data = await fetch(url);
    fs.writeFileSync(path.join(FONTS_DIR, localName), data);
    replacements.push([url, localName]);
  }

  // Replace remote URLs with local filenames in CSS
  for (var r = 0; r < replacements.length; r++) {
    css = css.split(replacements[r][0]).join(replacements[r][1]);
  }

  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.css'), css);
  console.log('Done. ' + i + ' font files saved to mockups/fonts/');
}

main().catch(function(e) { console.error('Error:', e.message); process.exit(1); });
