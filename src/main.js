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

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then(registration => {
      void registration.update();
    })
    .catch(() => {});
}
