<script setup>
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { days, progress, prepareDay } = useLearningStore();
function openDay(day) { prepareDay(day); router.push({ name: 'setup', params: { day } }); }
</script>

<template>
  <main class="shell module-shell"><header class="module-heading"><div><p class="eyebrow">VOCABULARY PLAN</p><h1>学单词</h1><p>按照 45 天节奏，每天学一组。</p></div><div class="module-badge">CET-4<br><small>45 天</small></div></header><section class="card"><div class="section-title"><h2>四级核心词</h2><span>{{ Object.values(progress.days).filter(Boolean).length }} / 45 天</span></div><div class="day-grid"><button v-for="day in days" :key="day.day" class="day" :class="{ done: progress.days[day.day] }" @click="openDay(day.day)">Day {{ day.day }}<small>{{ day.count }}词</small></button></div></section></main>
</template>
