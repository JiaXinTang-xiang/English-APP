<script setup>
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { sendEmailCode, verifyEmailCode } from '../services/cloudSync';
import { chooseAccount, chooseGuest } from '../services/identity';
import { supabaseEnabled } from '../services/supabase';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { syncWithCloud } = useLearningStore();
const email = ref('');
const formMode = ref(null);
const otpStep = ref('email');
const otp = ref('');
const cooldown = ref(0);
const busy = ref(false);
const message = ref('');
let cooldownTimer = null;

function openForm(nextMode) {
  formMode.value = nextMode;
  otpStep.value = 'email';
  otp.value = '';
  message.value = '';
}

async function sendCode() {
  message.value = '';
  busy.value = true;
  try {
    if (!supabaseEnabled) throw new Error('云端账号服务尚未配置，可先使用游客模式。');
    await sendEmailCode(email.value.trim());
    otpStep.value = 'code';
    cooldown.value = 60;
    clearInterval(cooldownTimer);
    cooldownTimer = setInterval(() => {
      cooldown.value -= 1;
      if (cooldown.value <= 0) clearInterval(cooldownTimer);
    }, 1000);
    message.value = '验证码已发送，请查收邮件。';
  } catch (error) {
    message.value = friendlyError(error);
  } finally {
    busy.value = false;
  }
}

async function verifyCode() {
  message.value = '';
  busy.value = true;
  try {
    const token = otp.value.replace(/\D/g, '');
    if (token.length < 6 || token.length > 8) throw new Error('请输入邮件中的完整验证码。');
    const data = await verifyEmailCode(email.value.trim(), token);
    await chooseAccount(data.user);
    await syncWithCloud();
    await router.replace({ name: 'home' });
  } catch (error) {
    message.value = friendlyError(error);
  } finally {
    busy.value = false;
  }
}

async function enterAsGuest() {
  busy.value = true;
  await chooseGuest();
  await router.replace({ name: 'home' });
  busy.value = false;
}

function friendlyError(error) {
  const value = error?.message || '';
  if (value.toLowerCase().includes('otp') || value.toLowerCase().includes('token')) return '验证码无效或已过期，请重新发送。';
  return value || '操作失败，请检查网络后重试。';
}

onUnmounted(() => clearInterval(cooldownTimer));
</script>

<template>
  <main class="welcome-shell"><section class="welcome-card">
    <div class="welcome-mark">词</div>
    <p class="eyebrow">CET VOCABULARY</p>
    <h1>词境</h1>
    <p class="welcome-copy">每天进步一点点，学习记录由你自己掌握。</p>

    <div v-if="!formMode" class="welcome-actions">
      <button class="primary" @click="openForm('otp')">邮箱验证码登录</button>
      <button class="guest-button" :disabled="busy" @click="enterAsGuest">以游客身份使用</button>
    </div>

    <form v-else-if="formMode === 'otp'" class="auth-form" @submit.prevent="otpStep === 'email' ? sendCode() : verifyCode()">
      <div class="form-heading"><button type="button" class="back-inline" @click="formMode = null">←</button><strong>邮箱验证码登录</strong></div>
      <input v-model="email" type="email" autocomplete="email" placeholder="邮箱地址" required :disabled="otpStep === 'code'">
      <template v-if="otpStep === 'email'">
        <p class="hint auth-help">我们会发送一次性验证码到你的邮箱，无需记密码。</p>
        <button class="primary" :disabled="busy">{{ busy ? '发送中…' : '发送验证码' }}</button>
      </template>
      <template v-else>
        <input v-model="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="输入邮件中的验证码" maxlength="8" pattern="[0-9]{6,8}" required>
        <button class="primary" :disabled="busy">{{ busy ? '验证中…' : '验证码登录并同步' }}</button>
        <button type="button" class="text-button" :disabled="cooldown > 0 || busy" @click="sendCode">{{ cooldown > 0 ? `${cooldown}s 后重新发送` : '重新发送验证码' }}</button>
        <button type="button" class="text-button" @click="otpStep = 'email'; otp = ''">更换邮箱</button>
      </template>
      <p v-if="message" class="feedback" :class="message.includes('已发送') ? 'good' : 'bad'">{{ message }}</p>
    </form>

    <div class="identity-notes"><span>📱 游客记录保存在当前设备</span><span>☁️ 账号登录可跨手机同步</span></div>
  </section></main>
</template>
