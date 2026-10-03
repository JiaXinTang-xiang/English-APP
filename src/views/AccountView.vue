<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from '../services/cloudSync';
import { chooseGuest, clearIdentity, identity } from '../services/identity';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { cloudSync, progressSummary, syncWithCloud, clearLocalProgress } = useLearningStore();
const busy = ref(false);
const message = ref('');
const syncLabel = computed(() => ({ idle: '等待同步', syncing: '正在同步…', synced: '已同步', offline: '离线，记录已保存在本机', error: '同步失败' }[cloudSync.status]));
const lastSync = computed(() => cloudSync.lastSyncedAt ? new Date(cloudSync.lastSyncedAt).toLocaleString('zh-CN') : '暂无');

async function syncNow() {
  busy.value = true; message.value = '';
  try { await syncWithCloud(); message.value = '本机和云端进度已合并。'; }
  catch (error) { message.value = error.message || '同步失败'; }
  finally { busy.value = false; }
}

async function logOut(keepLocal) {
  busy.value = true;
  try {
    if (identity.isAccount.value) await signOut();
    if (keepLocal) {
      await chooseGuest();
      await router.replace({ name: 'home' });
    } else {
      await clearLocalProgress();
      await clearIdentity();
      await router.replace({ name: 'auth' });
    }
  } finally { busy.value = false; }
}

async function openLogin() {
  await clearIdentity();
  await router.push({ name: 'auth' });
}
</script>

<template>
  <main class="shell"><section class="view active">
    <button class="back" @click="router.push({ name: 'home' })">← 返回首页</button>
    <div class="card account-card">
      <p class="eyebrow">ACCOUNT & SYNC</p><h1>{{ identity.isGuest.value ? '游客模式' : '账号与同步' }}</h1>
      <div class="account-identity"><span class="avatar">{{ identity.isGuest.value ? '游' : (identity.user.value?.email?.[0] || '用').toUpperCase() }}</span><div><strong>{{ identity.label.value }}</strong><small>{{ identity.isGuest.value ? '记录仅保存在这台设备' : '已连接 Supabase 云端' }}</small></div></div>
      <div class="account-stats"><div><b>{{ progressSummary.learnedDays }}</b><span>已学天数</span></div><div><b>{{ progressSummary.practicedWords }}</b><span>练习单词</span></div><div><b>{{ progressSummary.wrongWords }}</b><span>错词</span></div></div>

      <template v-if="identity.isGuest.value">
        <div class="sync-panel"><strong>换手机也保留进度</strong><p>登录或创建账号后，当前游客记录会自动合并到云端。</p><button class="primary full-button" @click="openLogin">登录 / 创建账号</button></div>
      </template>
      <template v-else>
        <div class="sync-panel"><div class="sync-row"><span>同步状态</span><strong :class="`status-${cloudSync.status}`">{{ syncLabel }}</strong></div><div class="sync-row"><span>最后同步</span><strong>{{ lastSync }}</strong></div><button class="primary full-button" :disabled="busy || cloudSync.status === 'syncing'" @click="syncNow">立即同步</button><p v-if="message" class="hint">{{ message }}</p></div>
        <div class="logout-actions"><button class="secondary" :disabled="busy" @click="logOut(true)">退出账号，保留本机记录</button><button class="danger-button" :disabled="busy" @click="logOut(false)">退出并清除本机记录</button></div>
      </template>
    </div>
  </section></main>
</template>
