#!/usr/bin/env node
// manage-assets.js — Upload, list, and download mockup assets via AWS CLI
// Usage:
//   node mockups/manage-assets.js upload <local-file> [s3-path]
//   node mockups/manage-assets.js ls [prefix]
//   node mockups/manage-assets.js sync
//
// Requires: AWS CLI configured with credentials, mockups/config.json
// Zero npm dependencies — uses child_process + AWS CLI.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MOCKUPS = __dirname;
const ASSETS  = path.join(MOCKUPS, 'assets');
const CONFIG  = path.join(MOCKUPS, 'config.json');

// ─── Load config ───
function loadConfig() {
  if (!fs.existsSync(CONFIG)) {
    console.error('Missing mockups/config.json — copy config.json.example and fill in your bucket name.');
    console.error('Deploy the stack first: cd mockups/infra && sam build && sam deploy');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
}

function s3Uri(config, key) {
  return 's3://' + config.bucket + '/' + key;
}

function awsCmd(args, config) {
  var cmd = 'aws s3 ' + args + ' --region ' + config.region;
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    console.error('AWS CLI error:', e.stderr || e.message);
    process.exit(1);
  }
}

// ─── Content type detection ───
function contentType(file) {
  var ext = path.extname(file).toLowerCase();
  var types = {
    '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif',
    '.avif': 'image/avif',
  };
  return types[ext] || 'application/octet-stream';
}

// ─── Commands ───

function upload(localFile, s3Path) {
  var config = loadConfig();
  if (!fs.existsSync(localFile)) {
    console.error('File not found: ' + localFile);
    process.exit(1);
  }

  // Default s3 path: shared/<filename>
  if (!s3Path) s3Path = 'shared/' + path.basename(localFile);

  var ct = contentType(localFile);
  console.log('Uploading: ' + localFile + ' → ' + s3Path);
  console.log('  Content-Type: ' + ct);

  awsCmd('cp "' + localFile + '" "' + s3Uri(config, s3Path) + '" --content-type ' + ct, config);

  console.log('  Done: ' + s3Path);
  console.log('  Use in asset manifest as: "' + s3Path + '"');
}

function list(prefix) {
  var config = loadConfig();
  var uri = s3Uri(config, prefix || '');
  console.log('Assets in ' + config.bucket + ':');
  var out = awsCmd('ls "' + uri + '" --recursive --human-readable', config);
  console.log(out || '  (empty)');
}

function sync() {
  var config = loadConfig();
  fs.mkdirSync(ASSETS, { recursive: true });
  console.log('Syncing s3://' + config.bucket + ' → mockups/assets/');
  awsCmd('sync "' + s3Uri(config, '') + '" "' + ASSETS + '/"', config);
  console.log('  Done.');
}

function download(s3Path, localPath) {
  var config = loadConfig();
  localPath = localPath || path.join(ASSETS, s3Path);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  awsCmd('cp "' + s3Uri(config, s3Path) + '" "' + localPath + '"', config);
  return localPath;
}

// ─── CLI ───
var args = process.argv.slice(2);
var cmd = args[0];

if (cmd === 'upload') {
  upload(args[1], args[2]);
} else if (cmd === 'ls' || cmd === 'list') {
  list(args[1]);
} else if (cmd === 'sync') {
  sync();
} else if (cmd === 'download') {
  download(args[1], args[2]);
} else {
  console.log('Usage:');
  console.log('  node mockups/manage-assets.js upload <file> [s3-path]  Upload a file');
  console.log('  node mockups/manage-assets.js ls [prefix]              List assets');
  console.log('  node mockups/manage-assets.js sync                     Download all to local cache');
  console.log('  node mockups/manage-assets.js download <s3-path>       Download one file');
}

// Export for use by build script
module.exports = { loadConfig, download, sync };
