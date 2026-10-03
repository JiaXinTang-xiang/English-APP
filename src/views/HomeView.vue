<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { days, progress, audio, wrongWords, updateAudio, prepareDay } = useLearningStore();
const installPrompt = ref(null);
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
    <header class="hero"><p class="eyebrow">CET-4 · 45天词汇</p><h1>今天背哪一天？</h1><p>把今天的 20 个词，变成明天的底气。</p></header>
    <div class="home-actions"><button class="primary" @click="router.push({ name: 'daily' })">领取今日任务</button><button class="secondary" @click="router.push({ name: 'wrongbook' })">错词本 {{ wrongWords.length }}</button></div><button class="secondary full-button" @click="router.push({ name: 'auth' })">登录 / 多设备同步</button>
    <div class="audio-setting"><label><input v-model="audio.auto" type="checkbox" @change="updateAudio"> 自动播放</label><label>声音<select v-model="audio.accent" @change="updateAudio"><option value="us">美式</option><option value="uk">英式</option></select></label><span>固定音频缺失时使用手机发音</span></div>
    <div class="day-grid"><button v-for="day in days" :key="day.day" class="day" :class="{ done: progress.days[day.day] }" @click="openDay(day.day)">Day {{ day.day }}<small>{{ day.count }}词</small></button></div>
  </section></main>
</template>
