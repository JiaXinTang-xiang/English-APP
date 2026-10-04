<script setup>
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { books, currentBook, days, progress, session, selectLearningBook, prepareDay } = useLearningStore();
function openDay(day) { prepareDay(day); router.push({ name: 'setup', params: { day } }); }
async function chooseBook(bookId) { await selectLearningBook(bookId); }
</script>

<template>
  <main class="shell module-shell"><header class="module-heading"><div><p class="eyebrow">VOCABULARY LIBRARY</p><h1>词书中心</h1><p>四级和六级独立记录，切换词书不会覆盖进度。</p></div><div class="module-badge">{{ currentBook.name }}<br><small>{{ days.length }} 章</small></div></header>
    <section class="book-grid"><button v-for="book in books" :key="book.id" class="book-card" :class="{ active: session.selectedBook === book.id }" @click="chooseBook(book.id)"><span class="book-code">{{ book.name }}</span><strong>{{ book.title }}</strong><small>{{ book.description }}</small><i>{{ session.selectedBook === book.id ? '当前词书' : '选择词书' }}</i></button></section>
    <section class="card chapter-section"><div class="section-title"><div><p class="eyebrow">{{ currentBook.name }} PLAN</p><h2>{{ currentBook.title }}</h2></div><span>{{ Object.values(progress.days).filter(Boolean).length }} / {{ days.length }} 章</span></div><div class="day-grid"><button v-for="day in days" :key="day.day" class="day" :class="{ done: progress.days[day.day] }" @click="openDay(day.day)">{{ currentBook.chapterLabel }} {{ day.day }}<small>{{ day.count }}词</small></button></div></section>
  </main>
</template>
