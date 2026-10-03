<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { session, sessionMistakes, start } = useLearningStore();
onMounted(() => { if (!session.queue.length) router.replace({ name: 'home' }); });
function retryMistakes() { if (start('mixed', sessionMistakes.value)) router.replace({ name: 'quiz' }); }
</script>

<template>
  <main class="shell"><section class="view active"><div class="card summary-card"><p class="eyebrow">本轮完成</p><h2>{{ session.label }} 训练总结</h2><div class="stats"><div><b>{{ session.right }}</b><span>答对</span></div><div><b>{{ session.wrong }}</b><span>答错</span></div><div><b>{{ Math.round(session.right / Math.max(1, session.right + session.wrong) * 100) }}%</b><span>正确率</span></div></div><h3>本轮错词</h3><div class="mistakes"><div v-for="word in sessionMistakes" :key="word.word" class="mistake"><b>{{ word.word }}</b><span>{{ word.meaning }} · 错{{ session.mistakes[word.word.toLowerCase()] }}次</span></div><p v-if="!sessionMistakes.length">本轮全对，很稳！</p></div><button v-if="sessionMistakes.length" class="primary" @click="retryMistakes">只练本轮错词</button><button class="secondary" @click="router.push({ name: 'home' })">返回首页</button></div></section></main>
</template>
