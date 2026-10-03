<script setup>
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { wrongWords, meta, speak, prepareCustom } = useLearningStore();
function review() { prepareCustom(wrongWords.value, '错词复习'); router.push({ name: 'setup' }); }
</script>

<template>
  <main class="shell"><section class="view active"><button class="back" @click="router.push({ name: 'home' })">← 返回45天</button><header class="hero"><p class="eyebrow">MISTAKE BOOK</p><h1>错词本</h1><p>连续正确复习 3 次后移出。</p></header><div class="word-list"><div v-for="word in wrongWords" :key="word.word" class="word-row"><div class="word-en"><b>{{ word.word }}</b><button class="speak-btn" @click="speak(word)">🔊</button><div class="review-note">正确复习 {{ meta(word).wrongReviewCount || 0 }}/3</div></div><div class="meaning-cover revealed">{{ word.meaning }}</div></div></div><p v-if="!wrongWords.length" class="card hint">错词本还是空的。</p><button v-if="wrongWords.length" class="primary full-button" @click="review">开始复习错词</button></section></main>
</template>
