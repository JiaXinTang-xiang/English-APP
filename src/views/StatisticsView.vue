<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { progress, progressSummary, nextNewDay } = useLearningStore();
const totalRight = computed(() => Object.values(progress.value.words || {}).reduce((sum, item) => sum + (item.right || 0), 0));
const totalWrong = computed(() => Object.values(progress.value.words || {}).reduce((sum, item) => sum + (item.wrong || 0), 0));
const completionRate = computed(() => Math.round(progressSummary.value.learnedDays / 45 * 100));
</script>
<template>
  <main class="shell"><section class="view active">
    <button class="back" @click="router.push({ name: 'account' })">← 返回我的</button>
    <header class="hero"><p class="eyebrow">LEARNING STATS</p><h1>学习统计</h1><p>把每天的小进步，变成看得见的轨迹。</p></header>
    <section class="card statistics-card"><div class="stats large-stats"><div><b>{{ progressSummary.learnedDays }}</b><span>已学天数</span></div><div><b>{{ progressSummary.practicedWords }}</b><span>练习单词</span></div><div><b>{{ progressSummary.wrongWords }}</b><span>错词数量</span></div></div><div class="stat-progress"><div class="sync-row"><span>45 天计划</span><strong>{{ completionRate }}%</strong></div><div class="progress"><i :style="{ width: `${completionRate}%` }"></i></div><p class="hint">{{ nextNewDay ? `下一步：Day ${nextNewDay.day}` : '45 天计划已完成，可以继续复习错词。' }}</p></div><div class="stats"><div><b>{{ totalRight }}</b><span>累计答对</span></div><div><b>{{ totalWrong }}</b><span>累计答错</span></div><div><b>{{ totalRight + totalWrong ? Math.round(totalRight / (totalRight + totalWrong) * 100) : 0 }}%</b><span>正确率</span></div></div></section>
  </section></main>
</template>
