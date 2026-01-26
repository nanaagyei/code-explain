const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../frontend/public');
const dest = path.join(__dirname, 'public');

const files = [
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'codexplain-logo.png',
  'codexplain-white-bg.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico',
  'login.png',
];

if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
for (const f of files) {
  fs.copyFileSync(path.join(src, f), path.join(dest, f));
}
console.log('Copied', files.length, 'files to docs/public');
