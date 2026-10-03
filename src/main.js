import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeLearningStore } from './stores/learning';
import './styles.css';

const dataScript = document.createElement('script');
dataScript.src = './vocab-data.js';
dataScript.onload = async () => {
  await initializeLearningStore();
  createApp(App).use(router).mount('#app');
};
document.head.appendChild(dataScript);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
