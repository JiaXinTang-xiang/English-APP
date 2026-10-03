<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { identity } from '../services/identity';

const route = useRoute();
const router = useRouter();
const navItems = [
  { name: 'home', label: '首页', icon: '⌂' },
  { name: 'words', label: '学单词', icon: '词' },
  { name: 'articles', label: '文章', icon: '文' },
  { name: 'account', label: '我的', icon: '我' }
];
const immersive = computed(() => ['quiz', 'auth'].includes(String(route.name)));
const currentTitle = computed(() => ({ home: '首页', words: '学单词', articles: '文章', wrongbook: '错词本', account: '我的', statistics: '学习统计', settings: '设置' }[route.name] || '四级背词'));
function go(name) { router.push({ name }); }
</script>

<template>
  <div class="app-shell" :class="{ immersive }">
    <template v-if="!immersive">
      <header class="desktop-topbar">
        <button class="brand-button" @click="go('home')"><span class="brand-mark">词</span><span>四级背词</span></button>
        <nav class="desktop-nav" aria-label="主导航"><button v-for="item in navItems" :key="item.name" :class="{ active: route.name === item.name || (item.name === 'words' && ['setup','daily'].includes(route.name)) }" @click="go(item.name)">{{ item.label }}</button></nav>
        <button class="desktop-account" @click="go('account')"><span>{{ identity.isGuest.value ? '游' : '云' }}</span>{{ identity.label.value }}</button>
      </header>
      <header class="mobile-pagebar"><button class="mobile-brand" @click="go('home')"><span class="brand-mark">词</span><strong>{{ currentTitle }}</strong></button><button class="mobile-user" @click="go('account')">{{ identity.isGuest.value ? '游' : '云' }}</button></header>
    </template>

    <main class="app-content"><RouterView /></main>

    <nav v-if="!immersive" class="mobile-bottom-nav" aria-label="底部导航">
      <button v-for="item in navItems" :key="item.name" :class="{ active: route.name === item.name || (item.name === 'words' && ['setup','daily'].includes(route.name)) }" @click="go(item.name)"><span class="nav-icon">{{ item.icon }}</span><small>{{ item.label }}</small></button>
    </nav>
  </div>
</template>
