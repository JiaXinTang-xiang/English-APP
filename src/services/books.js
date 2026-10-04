import { computed, ref } from 'vue';
import { getItem, setItem } from './storage';

const ACTIVE_BOOK_KEY = 'vocab-active-book-v1';
const datasets = new Map();
const activeBookId = ref('cet4');

export const BOOKS = [
  {
    id: 'cet4',
    name: 'CET-4',
    title: '大学英语四级',
    description: '45 天核心词汇与每日文章',
    chapterLabel: 'Day',
    articleEnabled: true
  },
  {
    id: 'cet6',
    name: 'CET-6',
    title: '大学英语六级',
    description: '2345 个六级词汇，按 50 词分章',
    chapterLabel: 'Chapter',
    articleEnabled: false
  }
];

export async function initializeBooks() {
  datasets.set('cet4', window.CET4_DAYS || []);
  const response = await fetch('./books/cet6.json');
  if (!response.ok) throw new Error('CET-6 词库加载失败');
  datasets.set('cet6', await response.json());
  const saved = await getItem(ACTIVE_BOOK_KEY);
  if (BOOKS.some(book => book.id === saved)) activeBookId.value = saved;
}

export const bookState = {
  activeBookId,
  activeBook: computed(() => BOOKS.find(book => book.id === activeBookId.value) || BOOKS[0])
};

export function getBook(bookId) {
  return BOOKS.find(book => book.id === bookId) || BOOKS[0];
}

export function getBookDays(bookId = activeBookId.value) {
  return datasets.get(bookId) || [];
}

export async function selectBook(bookId) {
  if (!BOOKS.some(book => book.id === bookId)) return false;
  activeBookId.value = bookId;
  await setItem(ACTIVE_BOOK_KEY, bookId);
  return true;
}
