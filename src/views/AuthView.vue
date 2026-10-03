<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCloudUser, signIn, signUp } from '../services/cloudSync';
import { supabaseEnabled } from '../services/supabase';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { syncWithCloud } = useLearningStore();
const email = ref('');
const password = ref('');
const mode = ref('signin');
const busy = ref(false);
const message = ref('');

async function submit() {
  message.value = '';
  busy.value = true;
  try {
    if (!supabaseEnabled) throw new Error('还未配置 Supabase，请先在 Vercel 环境变量中添加 URL 和 anon key。');
    if (mode.value === 'signin') await signIn(email.value.trim(), password.value);
    else await signUp(email.value.trim(), password.value);
    const user = await getCloudUser();
    if (user) await syncWithCloud();
    message.value = user ? `已登录：${user.email}` : '注册成功，请检查邮箱确认后登录。';
    if (user) router.push({ name: 'home' });
  } catch (error) {
    message.value = error.message || '操作失败，请检查邮箱和密码。';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="shell"><section class="view active"><button class="back" @click="router.push({ name: 'home' })">← 返回首页</button><div class="card auth-card"><p class="eyebrow">SUPABASE CLOUD</p><h1>{{ mode === 'signin' ? '登录同步' : '创建账号' }}</h1><p class="hint">登录后可在不同手机同步学习进度；不登录仍可离线使用。</p><form class="auth-form" @submit.prevent="submit"><input v-model="email" type="email" autocomplete="email" placeholder="邮箱" required><input v-model="password" type="password" autocomplete="current-password" placeholder="密码（至少6位）" minlength="6" required><button class="primary" :disabled="busy">{{ busy ? '处理中…' : mode === 'signin' ? '登录' : '注册' }}</button></form><p v-if="message" class="feedback" :class="message.startsWith('已登录') ? 'good' : 'bad'">{{ message }}</p><button class="secondary full-button" @click="mode = mode === 'signin' ? 'signup' : 'signin'">{{ mode === 'signin' ? '没有账号？注册' : '已有账号？登录' }}</button></div></section></main>
</template>
