<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { wrongWords, meta, speak, prepareCustom } = useLearningStore();
const openMeanings = ref(new Set());
const allOpen = ref(false);
function review() { prepareCustom(wrongWords.value, '错词复习'); router.push({ name: 'setup' }); }
function toggleMeaning(word) {
  const key = word.word.toLowerCase(), next = new Set(openMeanings.value);
  if (next.has(key)) next.delete(key); else next.add(key);
  openMeanings.value = next;
  allOpen.value = wrongWords.value.length > 0 && wrongWords.value.every(item => next.has(item.word.toLowerCase()));
}
function toggleAll() {
  allOpen.value = !allOpen.value;
  openMeanings.value = allOpen.value ? new Set(wrongWords.value.map(word => word.word.toLowerCase())) : new Set();
}
</script>

<template>
  <main class="shell"><section class="view active"><button class="back" @click="router.push({ name: 'home' })">← 返回45天</button><header class="hero"><p class="eyebrow">MISTAKE BOOK</p><h1>错词本</h1><div class="wrongbook-heading"><p>点击右侧遮罩查看释义，连续正确复习 3 次后移出。</p><button v-if="wrongWords.length" class="secondary meaning-toggle-all" @click="toggleAll">{{ allOpen ? '🙈 隐藏全部' : '👁 显示全部' }}</button></div></header><div class="word-list"><div v-for="word in wrongWords" :key="word.word" class="word-row"><div class="word-en"><b>{{ word.word }}</b><button class="speak-btn" @click="speak(word)">🔊</button><div class="review-note">正确复习 {{ meta(word).wrongReviewCount || 0 }}/3</div></div><button class="meaning-cover" :class="{ revealed: openMeanings.has(word.word.toLowerCase()) }" @click="toggleMeaning(word)">{{ openMeanings.has(word.word.toLowerCase()) ? word.meaning : '点击查看' }}</button></div></div><p v-if="!wrongWords.length" class="card hint">错词本还是空的。</p><button v-if="wrongWords.length" class="primary full-button" @click="review">开始复习错词</button></section></main>
</template>
