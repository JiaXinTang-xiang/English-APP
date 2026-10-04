<script setup>
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { currentBook, days, today, nextNewDay, dueReviews, wrongWords, prepareDay, prepareCustom } = useLearningStore();
function openDay(day, gap = null) { prepareDay(day, gap); router.push({ name: 'setup', params: { day }, query: gap ? { gap } : {} }); }
function openWrongWords() { prepareCustom(wrongWords.value, '今日错词'); router.push({ name: 'setup' }); }
</script>

<template>
  <main class="shell"><section class="view active">
    <button class="back" @click="router.push({ name: 'home' })">← 返回首页</button>
    <header class="hero"><p class="eyebrow">{{ currentBook.name }} · EBBINGHAUS REVIEW</p><h1>今日任务</h1><p>{{ today() }}</p></header>
    <div class="card"><div class="task-block"><h3 class="task-title">今日要背的单词</h3><div class="day-grid"><button v-if="nextNewDay" class="day" @click="openDay(nextNewDay.day)">{{ currentBook.chapterLabel }} {{ nextNewDay.day }}<small>{{ nextNewDay.count }}词</small></button></div><p v-if="!nextNewDay" class="hint">{{ days.length }} 章新词已经全部完成。</p></div>
    <div class="task-block"><h3 class="task-title">要复习的单词</h3><div class="day-grid"><button v-for="item in dueReviews" :key="item.day" class="day" @click="openDay(item.day, item.gap)">{{ currentBook.chapterLabel }} {{ item.day }}<small>{{ item.overdue ? '补第' : '第' }}{{ item.gap }}天</small></button><button v-if="wrongWords.length" class="day" @click="openWrongWords">错词<small>{{ wrongWords.length }}词</small></button></div><p v-if="!dueReviews.length && !wrongWords.length" class="hint">今天暂无到期复习。</p></div></div>
  </section></main>
</template>
