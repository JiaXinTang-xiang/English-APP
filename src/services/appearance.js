import { ref } from 'vue';
import { getItem, setItem } from './storage';

const THEME_KEY = 'vocab-theme-v1';
const dark = ref(false);

export const appearance = { dark };

export async function initializeAppearance() {
  const saved = await getItem(THEME_KEY);
  dark.value = saved === null ? window.matchMedia?.('(prefers-color-scheme: dark)').matches : saved === 'dark';
  applyTheme();
}

export function toggleTheme() {
  dark.value = !dark.value;
  applyTheme();
  return setItem(THEME_KEY, dark.value ? 'dark' : 'light');
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', dark.value);
  document.documentElement.style.colorScheme = dark.value ? 'dark' : 'light';
}
