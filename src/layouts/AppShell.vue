<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AudioSettingsDrawer from '../components/AudioSettingsDrawer.vue';
import StudyToolbar from '../components/StudyToolbar.vue';

const route = useRoute();
const router = useRouter();
const settingsOpen = ref(false);
const navItems = [
  { name: 'home', label: '首页', icon: '⌂' },
  { name: 'words', label: '学单词', icon: '词' },
  { name: 'articles', label: '文章', icon: '文' },
  { name: 'account', label: '我的', icon: '我' }
];
const immersive = computed(() => ['quiz', 'auth'].includes(String(route.name)));
function go(name) { router.push({ name }); }
</script>

<template>
  <div class="app-shell" :class="{ immersive }">
    <template v-if="!immersive">
      <StudyToolbar @settings="settingsOpen = true" />
    </template>

    <main class="app-content"><RouterView /></main>

    <nav v-if="!immersive" class="mobile-bottom-nav" aria-label="底部导航">
      <button v-for="item in navItems" :key="item.name" :class="{ active: route.name === item.name || (item.name === 'words' && ['setup','daily'].includes(route.name)) }" @click="go(item.name)"><span class="nav-icon">{{ item.icon }}</span><small>{{ item.label }}</small></button>
    </nav>
    <AudioSettingsDrawer :open="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>
