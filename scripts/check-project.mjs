import { access, readFile } from 'node:fs/promises';

const required = [
  'index.html',
  'styles.css',
  'app.js',
  'vocab-data.js',
  'capacitor.config.json',
  'android/settings.gradle',
  'android/app/src/main/AndroidManifest.xml'
];

for (const file of required) {
  await access(file);
}

const vocab = await readFile('vocab-data.js', 'utf8');
const dayCount = (vocab.match(/"day":/g) || []).length;
if (dayCount !== 45) throw new Error(`词库 Day 数量异常：${dayCount}`);

console.log(`Project check passed: ${required.length} files, ${dayCount} days`);
