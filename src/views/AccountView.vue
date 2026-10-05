<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AudioSettingsDrawer from '../components/AudioSettingsDrawer.vue';
import { signOut } from '../services/cloudSync';
import { chooseGuest, clearIdentity, identity, saveProfile } from '../services/identity';
import { useLearningStore } from '../stores/learning';
const router = useRouter();
const { currentBook, cloudSync, progressSummary, syncWithCloud, clearLocalProgress } = useLearningStore();
const busy = ref(false); const message = ref(''); const settingsOpen = ref(false);
const profileBusy = ref(false); const profileMessage = ref('');
const profileForm = reactive({ ...identity.profile.value });
const syncLabel = computed(() => ({ idle: '等待同步', syncing: '正在同步…', synced: '已同步', offline: '离线，记录已保存在本机', error: '同步失败' }[cloudSync.status]));
const lastSync = computed(() => cloudSync.lastSyncedAt ? new Date(cloudSync.lastSyncedAt).toLocaleString('zh-CN') : '暂无');
async function syncNow() { busy.value = true; message.value = ''; try { await syncWithCloud(); message.value = '本机和云端进度已合并。'; } catch (error) { message.value = error.message || '同步失败'; } finally { busy.value = false; } }
async function logOut(keepLocal) { busy.value = true; try { if (identity.isAccount.value) await signOut(); if (keepLocal) { await chooseGuest(); await router.replace({ name: 'home' }); } else { await clearLocalProgress(); await clearIdentity(); await router.replace({ name: 'auth' }); } } finally { busy.value = false; } }
async function openLogin() { await clearIdentity(); await router.push({ name: 'auth' }); }
async function savePersonalProfile() {
  profileBusy.value = true; profileMessage.value = '';
  try {
    await saveProfile(profileForm);
    profileMessage.value = identity.isAccount.value ? '个人资料已保存并同步到云端。' : '个人资料已保存在本机。';
  } catch (error) {
    profileMessage.value = error.message || '资料保存失败，请稍后重试。';
  } finally { profileBusy.value = false; }
}
function confirmClear() { if (window.confirm('确定清除这台设备上的学习记录吗？云端记录不会删除。')) void clearLocalProgress(); }
</script>
<template>
  <main class="shell"><section class="view active">
    <header class="hero account-heading"><p class="eyebrow">MY SPACE</p><h1>我的</h1><p>学习记录、偏好和账号，都在这里。</p></header>
    <div class="card account-card"><div class="account-identity"><span class="avatar">{{ identity.isGuest.value ? '游' : (identity.user.value?.email?.[0] || '用').toUpperCase() }}</span><div><strong>{{ identity.label.value }}</strong><small>{{ identity.isGuest.value ? '记录仅保存在这台设备' : '已连接 Supabase 云端' }}</small></div></div><div class="account-stats"><div><b>{{ progressSummary.learnedDays }}</b><span>已学天数</span></div><div><b>{{ progressSummary.practicedWords }}</b><span>练习单词</span></div><div><b>{{ progressSummary.wrongWords }}</b><span>错词</span></div></div><template v-if="identity.isGuest.value"><div class="sync-panel"><strong>换手机也保留进度</strong><p>登录后当前游客记录会自动合并到云端。</p><button class="primary full-button" @click="openLogin">登录 / 创建账号</button></div></template><template v-else><div class="sync-panel"><div class="sync-row"><span>同步状态</span><strong :class="`status-${cloudSync.status}`">{{ syncLabel }}</strong></div><div class="sync-row"><span>最后同步</span><strong>{{ lastSync }}</strong></div><button class="primary full-button" :disabled="busy || cloudSync.status === 'syncing'" @click="syncNow">立即同步</button><p v-if="message" class="hint">{{ message }}</p></div></template></div>
    <section class="settings-section"><h2>个人资料</h2><div class="card profile-card"><div class="profile-form"><label><span>显示名称</span><input v-model="profileForm.displayName" maxlength="40" placeholder="例如：小明"></label><label><span>昵称</span><input v-model="profileForm.nickname" maxlength="40" placeholder="例如：坚持背词"></label><label><span>性别</span><select v-model="profileForm.gender"><option value="secret">不公开</option><option value="male">男</option><option value="female">女</option></select></label><p class="hint">邮箱账号：{{ identity.user.value?.email || '游客模式，本机保存' }}</p><button class="primary full-button" :disabled="profileBusy" @click="savePersonalProfile">{{ profileBusy ? '保存中…' : '保存个人资料' }}</button><p v-if="profileMessage" class="hint">{{ profileMessage }}</p></div></div></section>
    <section class="settings-section"><h2>学习工具</h2><div class="menu-list"><button class="menu-item" @click="router.push({ name: 'wrongbook' })"><span>错词本<small>复习答错过的单词</small></span><b>›</b></button><button class="menu-item" @click="router.push({ name: 'statistics' })"><span>学习统计<small>查看进度、正确率和累计练习</small></span><b>›</b></button></div></section>
    <section class="settings-section"><h2>当前学习</h2><div class="menu-list"><button class="menu-item" @click="router.push({ name: 'words' })"><span>{{ currentBook.name }} · {{ currentBook.title }}<small>切换词书和章节</small></span><b>›</b></button><button class="menu-item" @click="settingsOpen = true"><span>训练与声音设置<small>发音、音标、语速、键盘音和反馈音</small></span><b>›</b></button></div></section>
    <section class="settings-section"><h2>应用</h2><div class="menu-list"><button class="menu-item" @click="router.push({ name: 'home' })"><span>安装到手机<small>从浏览器添加到主屏幕</small></span><b>›</b></button><button class="menu-item" @click="confirmClear"><span>清理本机数据<small>只清理当前设备，不影响云端</small></span><b class="danger-text">清理</b></button></div></section>
    <div v-if="!identity.isGuest.value" class="logout-actions"><button class="secondary" :disabled="busy" @click="logOut(true)">退出账号，保留本机记录</button><button class="danger-button" :disabled="busy" @click="logOut(false)">退出并清除本机记录</button></div>
    <AudioSettingsDrawer :open="settingsOpen" @close="settingsOpen = false" />
  </section></main>
</template>
