#!/usr/bin/env node
// Validates all demoUrl links in the LIBRARY by checking YouTube for valid video pages.
// Usage: node validate-demo-links.js

const fs = require("fs");
const https = require("https");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "workout-app.html"), "utf-8");

// Extract LIBRARY array entries with demoUrl
const entryRegex = /\{\s*id:"([^"]+)"[^}]*?name:"([^"]+)"[^}]*?demoUrl:"([^"]*)"/g;
const exercises = [];
let m;
while ((m = entryRegex.exec(html)) !== null) {
  exercises.push({ id: m[1], name: m[2], demoUrl: m[3] });
}

console.log(`Found ${exercises.length} exercises in LIBRARY.\n`);

const noUrl = exercises.filter(e => !e.demoUrl);
if (noUrl.length > 0) {
  console.log(`⚠ ${noUrl.length} exercise(s) with no demoUrl:`);
  noUrl.forEach(e => console.log(`  - ${e.name} (${e.id})`));
  console.log();
}

const withUrl = exercises.filter(e => e.demoUrl);
let passed = 0;
let failed = 0;
let checked = 0;

function checkUrl(exercise) {
  return new Promise((resolve) => {
    const url = exercise.demoUrl;

    // Extract video ID
    const vidMatch = url.match(/[?&]v=([^&]+)/);
    if (!vidMatch) {
      console.log(`✗ ${exercise.name} — bad URL format: ${url}`);
      failed++;
      resolve();
      return;
    }

    // Use oembed endpoint — returns 200 for valid videos, 404 for invalid
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidMatch[1]}&format=json`;

    https.get(oembedUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      // Consume response data to free up memory
      res.resume();
      checked++;
      if (res.statusCode === 200) {
        passed++;
        // Collect title from response for verification
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            console.log(`✓ ${exercise.name} — "${data.title}"`);
          } catch {
            console.log(`✓ ${exercise.name} — OK (status 200)`);
          }
          resolve();
        });
      } else {
        failed++;
        console.log(`✗ ${exercise.name} — HTTP ${res.statusCode}: ${url}`);
        resolve();
      }
    }).on("error", (err) => {
      checked++;
      failed++;
      console.log(`✗ ${exercise.name} — Network error: ${err.message}`);
      resolve();
    });
  });
}

// Run checks in batches of 5 to avoid hammering YouTube
async function run() {
  const batchSize = 5;
  for (let i = 0; i < withUrl.length; i += batchSize) {
    const batch = withUrl.slice(i, i + batchSize);
    await Promise.all(batch.map(checkUrl));
  }

  console.log(`\n===== RESULTS =====`);
  console.log(`Total exercises: ${exercises.length}`);
  console.log(`With demoUrl: ${withUrl.length}`);
  console.log(`No demoUrl: ${noUrl.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
