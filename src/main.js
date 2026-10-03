import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

const dataScript = document.createElement('script');
dataScript.src = './vocab-data.js';
dataScript.onload = () => createApp(App).mount('#app');
document.head.appendChild(dataScript);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
