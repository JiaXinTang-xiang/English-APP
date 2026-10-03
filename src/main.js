import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeLearningStore, useLearningStore } from './stores/learning';
import { identity, initializeIdentity } from './services/identity';
import './styles.css';

function loadDataScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

Promise.all([loadDataScript('./vocab-data.js'), loadDataScript('./articles-data.js')]).then(async () => {
  await Promise.all([initializeLearningStore(), initializeIdentity()]);
  createApp(App).use(router).mount('#app');
  if (identity.isAccount.value) void useLearningStore().syncWithCloud().catch(() => {});
}).catch(() => {
  document.querySelector('#app').innerHTML = '<main class="boot-screen"><div class="boot-mark">词</div><strong>资料加载失败</strong><small>请刷新页面重试</small></main>';
});

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
