import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const webDir = join(root, 'www');

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'vocab-data.js',
  'manifest.webmanifest',
  'sw.js',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png'
];

await Promise.all(files.map((file) => cp(join(root, file), join(webDir, file))));
console.log(`Prepared ${files.length} web assets in ${webDir}`);
