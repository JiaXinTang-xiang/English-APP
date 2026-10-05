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
const appFiles = [
  'src/main.js',
  'src/App.vue',
  'src/components/AudioSettingsDrawer.vue',
  'src/components/StudyToolbar.vue',
  'src/services/appearance.js',
  'src/services/audio.js',
  'src/services/articleAudio.js',
  'src/services/books.js',
  'src/services/storage.js',
  'src/services/dailyQuote.js',
  'src/services/supabase.js',
  'src/services/cloudSync.js',
  'src/services/identity.js',
  'src/stores/learning.js',
  'src/router/index.js',
  'src/views/AuthView.vue',
  'src/views/AccountView.vue',
  'src/views/QuizView.vue',
  'supabase/schema.sql',
  'supabase/audio-settings-migration.sql',
  'supabase/profile-migration.sql',
  '.env.example',
  'vite.config.js',
  'public/vocab-data.js',
  'public/articles-data.js',
  'public/books/cet6.json',
  'public/repair.html'
];
for (const file of appFiles) await access(file);

const cet6 = JSON.parse(await readFile('public/books/cet6.json', 'utf8'));
const cet6WordCount = cet6.reduce((total, chapter) => total + (chapter.words?.length || 0), 0);
if (cet6.length !== 47) throw new Error(`CET-6 章节数异常：${cet6.length}`);
if (cet6WordCount !== 2345) throw new Error(`CET-6 单词数异常：${cet6WordCount}`);

console.log(`Project check passed: CET-4 ${dayCount} days, CET-6 ${cet6.length} chapters / ${cet6WordCount} words`);
