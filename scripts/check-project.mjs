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
for (const file of ['src/main.js', 'src/App.vue', 'src/services/audio.js', 'src/services/storage.js', 'src/services/dailyQuote.js', 'src/services/supabase.js', 'src/services/cloudSync.js', 'src/services/identity.js', 'src/stores/learning.js', 'src/router/index.js', 'src/views/AuthView.vue', 'src/views/AccountView.vue', 'supabase/schema.sql', '.env.example', 'vite.config.js', 'public/vocab-data.js', 'public/repair.html']) await access(file);

console.log(`Project check passed: ${required.length + 5} files, ${dayCount} days`);
