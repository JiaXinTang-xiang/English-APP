<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn, signUp } from '../services/cloudSync';
import { chooseAccount, chooseGuest } from '../services/identity';
import { supabaseEnabled } from '../services/supabase';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { syncWithCloud } = useLearningStore();
const email = ref('');
const password = ref('');
const formMode = ref(null);
const busy = ref(false);
const message = ref('');

function openForm(nextMode) {
  formMode.value = nextMode;
  message.value = '';
}

async function enterAsGuest() {
  busy.value = true;
  await chooseGuest();
  await router.replace({ name: 'home' });
  busy.value = false;
}

async function submit() {
  message.value = '';
  busy.value = true;
  try {
    if (!supabaseEnabled) throw new Error('云端账号服务尚未配置，可先使用游客模式。');
    const data = formMode.value === 'signin'
      ? await signIn(email.value.trim(), password.value)
      : await signUp(email.value.trim(), password.value);
    if (!data.session) {
      message.value = '注册成功！请打开邮箱完成确认，再回来登录。';
      formMode.value = 'signin';
      return;
    }
    await chooseAccount(data.user);
    await syncWithCloud();
    await router.replace({ name: 'home' });
  } catch (error) {
    message.value = friendlyError(error);
  } finally {
    busy.value = false;
  }
}

function friendlyError(error) {
  const value = error?.message || '';
  if (value.includes('Invalid login credentials')) return '邮箱或密码不正确。';
  if (value.includes('already registered')) return '这个邮箱已注册，请直接登录。';
  if (value.includes('Password')) return '密码至少需要 6 位。';
  return value || '操作失败，请检查网络后重试。';
}
</script>

<template>
  <main class="welcome-shell"><section class="welcome-card">
    <div class="welcome-mark">词</div>
    <p class="eyebrow">CET-4 VOCABULARY</p>
    <h1>四级背词</h1>
    <p class="welcome-copy">每天进步一点点，学习记录由你自己掌握。</p>

    <div v-if="!formMode" class="welcome-actions">
      <button class="primary" @click="openForm('signin')">邮箱登录</button>
      <button class="secondary" @click="openForm('signup')">创建账号</button>
      <button class="guest-button" :disabled="busy" @click="enterAsGuest">以游客身份使用</button>
    </div>

    <form v-else class="auth-form" @submit.prevent="submit">
      <div class="form-heading"><button type="button" class="back-inline" @click="formMode = null">←</button><strong>{{ formMode === 'signin' ? '邮箱登录' : '创建账号' }}</strong></div>
      <input v-model="email" type="email" autocomplete="email" placeholder="邮箱地址" required>
      <input v-model="password" type="password" :autocomplete="formMode === 'signin' ? 'current-password' : 'new-password'" placeholder="密码（至少6位）" minlength="6" required>
      <button class="primary" :disabled="busy">{{ busy ? '处理中…' : formMode === 'signin' ? '登录并合并进度' : '注册并保存进度' }}</button>
      <p v-if="message" class="feedback" :class="message.startsWith('注册成功') ? 'good' : 'bad'">{{ message }}</p>
      <button type="button" class="text-button" @click="openForm(formMode === 'signin' ? 'signup' : 'signin')">{{ formMode === 'signin' ? '没有账号？立即注册' : '已有账号？直接登录' }}</button>
    </form>

    <div class="identity-notes"><span>📱 游客记录保存在当前设备</span><span>☁️ 账号登录可跨手机同步</span></div>
  </section></main>
</template>
