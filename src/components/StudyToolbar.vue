<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { appearance, toggleTheme } from '../services/appearance';
import { identity } from '../services/identity';
import { useLearningStore } from '../stores/learning';

const emit = defineEmits(['settings']);
const router = useRouter();
const { books, currentBook, days, session, audio, selectLearningBook, prepareDay, start, updateAudio } = useLearningStore();
const selectedChapter = computed({
  get: () => session.selectedDay || 1,
  set: value => prepareDay(Number(value))
});

async function changeBook(event) {
  await selectLearningBook(event.target.value);
  prepareDay(1);
}
function openBookCenter() { router.push({ name: 'words' }); }
function begin() {
  prepareDay(selectedChapter.value);
  if (start('typing')) router.push({ name: 'quiz' });
}
function setPronunciation(event) {
  const value = event.target.value;
  audio.value.wordAudio = value !== 'off';
  if (value !== 'off') audio.value.accent = value;
  updateAudio();
}
</script>

<template>
  <header class="study-toolbar">
    <button class="toolbar-brand" title="返回首页" @click="router.push({ name: 'home' })"><span class="brand-mark">词</span><strong>词境</strong></button>
    <div class="toolbar-console">
      <select class="toolbar-select desktop-book-select" :value="session.selectedBook" aria-label="当前词书" @change="changeBook"><option v-for="book in books" :key="book.id" :value="book.id">{{ book.name }}</option></select>
      <button class="mobile-book-button" @click="openBookCenter">{{ currentBook.name }}</button>
      <select v-model="selectedChapter" class="toolbar-select" aria-label="当前章节"><option v-for="day in days" :key="day.day" :value="day.day">{{ currentBook.chapterLabel }} {{ day.day }}</option></select>
      <select class="toolbar-select desktop-tool" :value="audio.wordAudio ? audio.accent : 'off'" aria-label="发音选择" @change="setPronunciation"><option value="us">美音</option><option value="uk">英音</option><option value="off">关闭发音</option></select>
      <button class="toolbar-tool desktop-tool" :class="{ active: audio.phonetic }" title="显示或隐藏音标" @click="audio.phonetic = !audio.phonetic; updateAudio()">音标</button>
      <button class="toolbar-tool desktop-tool" :class="{ active: audio.wordAudio }" title="开关单词发音" @click="audio.wordAudio = !audio.wordAudio; updateAudio()">发音</button>
      <button class="toolbar-tool desktop-tool" :class="{ active: audio.translationSpeech }" title="开关释义朗读" @click="audio.translationSpeech = !audio.translationSpeech; updateAudio()">释义音</button>
      <button class="toolbar-icon desktop-tool" title="音效设置" @click="emit('settings')">♪</button>
      <button class="toolbar-icon desktop-tool" title="切换明暗主题" @click="toggleTheme">{{ appearance.dark.value ? '☾' : '☀' }}</button>
      <button class="toolbar-start" @click="begin">开始</button>
    </div>
    <button class="toolbar-account desktop-tool" title="账号与同步" @click="router.push({ name: 'account' })"><span>{{ identity.isGuest.value ? '游' : '云' }}</span></button>
  </header>
</template>
