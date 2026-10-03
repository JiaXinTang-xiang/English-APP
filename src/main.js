import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeLearningStore, useLearningStore } from './stores/learning';
import { identity, initializeIdentity } from './services/identity';
import './styles.css';

const dataScript = document.createElement('script');
dataScript.src = './vocab-data.js';
dataScript.onload = async () => {
  await Promise.all([initializeLearningStore(), initializeIdentity()]);
  createApp(App).use(router).mount('#app');
  if (identity.isAccount.value) void useLearningStore().syncWithCloud().catch(() => {});
};
document.head.appendChild(dataScript);

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
