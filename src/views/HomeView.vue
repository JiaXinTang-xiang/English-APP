<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
import { getDailyQuote } from '../services/dailyQuote';
import { identity } from '../services/identity';

const router = useRouter();
const { currentBook, days, wrongWords, nextNewDay, progressSummary, prepareDay } = useLearningStore();
const installPrompt = ref(null);
const dailyQuote = ref('把今天的 20 个词，变成明天的底气。');
const installVisible = computed(() => !!installPrompt.value && !window.matchMedia?.('(display-mode: standalone)').matches);
const onInstallPrompt = event => { event.preventDefault(); installPrompt.value = event; };
const onInstalled = () => { installPrompt.value = null; };

function openDay(day) { prepareDay(day); router.push({ name: 'setup', params: { day } }); }
async function install() {
  if (!installPrompt.value) return;
  installPrompt.value.prompt();
  await installPrompt.value.userChoice;
  installPrompt.value = null;
}
onMounted(() => {
  void getDailyQuote().then(value => { dailyQuote.value = value; });
  window.addEventListener('beforeinstallprompt', onInstallPrompt);
  window.addEventListener('appinstalled', onInstalled);
});
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onInstallPrompt);
  window.removeEventListener('appinstalled', onInstalled);
});
</script>

<template>
  <main class="shell"><section class="view active">
    <button v-if="installVisible" class="install-app" @click="install">⬇ 安装到手机</button>
    <button class="account-pill" @click="router.push({ name: 'account' })"><span>{{ identity.isGuest.value ? '游' : '云' }}</span>{{ identity.label.value }}</button>
    <header class="hero"><p class="eyebrow">{{ currentBook.name }} · {{ days.length }} 章词汇</p><h1>今天继续学习</h1><p>{{ dailyQuote }}</p></header>
    <section class="dashboard-grid"><div class="card today-card"><p class="eyebrow">TODAY'S PLAN</p><h2>{{ nextNewDay ? `${currentBook.chapterLabel} ${nextNewDay.day}` : `${days.length} 章已完成` }}</h2><p>{{ nextNewDay ? `${nextNewDay.count} 个新词${currentBook.articleEnabled ? '和一篇语境文章' : ''}` : '可以去错词本继续复习。' }}</p><button class="primary full-button" @click="router.push({ name: nextNewDay ? 'setup' : 'wrongbook', params: nextNewDay ? { day: nextNewDay.day } : {} })">{{ nextNewDay ? '开始今日学习' : '复习错词' }}</button></div><div class="card progress-card"><p class="eyebrow">YOUR PROGRESS</p><div class="dashboard-stats"><div><b>{{ progressSummary.learnedDays }}</b><span>/ {{ days.length }} 章</span></div><div><b>{{ progressSummary.practicedWords }}</b><span>已练单词</span></div><div><b>{{ wrongWords.length }}</b><span>错词</span></div></div><button class="secondary full-button" @click="router.push({ name: 'words' })">打开词书中心</button></div></section>
    <div class="quick-actions"><button v-if="currentBook.articleEnabled" class="secondary" @click="router.push({ name: 'articles' })">每日文章</button><button class="secondary" @click="router.push({ name: 'wrongbook' })">错词本 {{ wrongWords.length }}</button><button class="secondary" @click="router.push({ name: 'account' })">我的设置</button></div>
  </section></main>
</template>
