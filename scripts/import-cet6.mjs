import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '../qwerty-learner/public/dicts/CET6_T.json');
const target = resolve(root, 'public/books/cet6.json');
const words = JSON.parse(await readFile(source, 'utf8'));
const chapterSize = 50;

function splitTranslation(values = []) {
  const meaning = values.join('；').replace(/\s+/g, ' ').trim();
  const posMatches = [...meaning.matchAll(/\(([^)]+)\)/g)].map(match => match[1]);
  return {
    pos: [...new Set(posMatches)].join('/') || '',
    meaning
  };
}

const normalized = words.map(item => {
  const translation = splitTranslation(item.trans);
  return {
    word: item.name,
    usIpa: item.usphone ? `/${item.usphone}/` : '',
    ukIpa: item.ukphone ? `/${item.ukphone}/` : '',
    ipa: item.usphone ? `/${item.usphone}/` : item.ukphone ? `/${item.ukphone}/` : '',
    pos: translation.pos,
    meaning: translation.meaning
  };
});

const chapters = Array.from({ length: Math.ceil(normalized.length / chapterSize) }, (_, index) => {
  const chapterWords = normalized.slice(index * chapterSize, (index + 1) * chapterSize);
  return { day: index + 1, count: chapterWords.length, words: chapterWords };
});

await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(chapters)}\n`, 'utf8');
console.log(`Imported ${normalized.length} CET-6 words into ${chapters.length} chapters.`);
