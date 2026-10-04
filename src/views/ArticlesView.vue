<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { currentBook, selectLearningBook } = useLearningStore();
const articles = computed(() => (window.CET4_ARTICLES || []).slice(0, 45));
function openArticle(article) { router.push({ name: 'setup', params: { day: article.day }, query: { article: '1' } }); }
async function useCet4() { await selectLearningBook('cet4'); }
</script>

<template>
  <main class="shell module-shell"><header class="module-heading"><div><p class="eyebrow">READING & CONTEXT</p><h1>每日文章</h1><p>在语境中复习四级词汇。</p></div><div class="module-badge article-badge">45<br><small>篇</small></div></header><section v-if="currentBook.id !== 'cet4'" class="card article-book-notice"><h2>每日文章目前属于 CET-4</h2><p>切换回四级后，文章会和对应 Day 的词汇一起学习。</p><button class="primary" @click="useCet4">切换到 CET-4</button></section><section v-else class="article-list"><button v-for="article in articles" :key="article.day" class="article-list-item" @click="openArticle(article)"><span class="article-day">{{ String(article.day).padStart(2, '0') }}</span><span class="article-list-copy"><strong>{{ article.title }}</strong><small>{{ article.theme }}</small></span><span class="article-arrow">→</span></button></section></main>
</template>
