<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';
import ArticleAudioPlayer from '../components/ArticleAudioPlayer.vue';

const route = useRoute(), router = useRouter();
const { session, speak, prepareDay, sourceWords, start } = useLearningStore();
const article = computed(() => window.CET4_ARTICLES?.find(item => item.day === Number(session.selectedDay)) || null);
const showTranslation = ref(false);
onMounted(() => {
  if (route.params.day && (session.selectedDay !== Number(route.params.day) || !session.label)) prepareDay(route.params.day, route.query.gap ?? null);
  if (!route.params.day && !session.customWords) router.replace({ name: 'home' });
});
function begin(mode) { if (start(mode)) router.push({ name: 'quiz' }); }
function toggleTranslation() { showTranslation.value = !showTranslation.value; }
</script>

<template>
  <main class="shell"><section class="view active">
    <button class="back" @click="router.push({ name: 'home' })">← 返回45天</button>
    <div class="card setup-card"><p class="eyebrow">{{ session.label }} · {{ sourceWords().length }}词</p><h2>选择抽背方式</h2>
      <button class="mode" @click="begin('choice')"><b>英译中</b><span>看英文，选择中文释义</span></button><button class="mode" @click="begin('spell')"><b>中译英</b><span>看中文，输入英文拼写</span></button><button class="mode" @click="begin('mixed')"><b>混合训练</b><span>两种题型随机出现</span></button>
      <label v-if="!session.customWords" class="count-label">本轮题数<select v-model="session.count"><option>10</option><option>20</option><option>30</option><option>50</option></select></label>
      <article v-if="article" class="article-card"><div class="article-heading"><div><p class="eyebrow">语境短文 · {{ article.wordCount ? article.wordCount + '词' : 'CET-4' }}</p><h3>{{ article.title }}</h3><p class="article-theme">主题：{{ article.theme }}</p></div><button class="secondary article-toggle" @click="toggleTranslation">{{ showTranslation ? '隐藏译文' : '查看译文' }}</button></div><div class="article-body"><p v-for="(paragraph, index) in (showTranslation ? article.translation : article.english)" :key="index">{{ paragraph }}</p></div><ArticleAudioPlayer :paragraphs="article.english" /><p class="article-tip">先读英文，再打开译文核对；今日目标词已经融入文章语境。</p></article>
      <div class="task-block"><h3 class="task-title">本组单词</h3><div class="word-list"><div v-for="(word, index) in sourceWords()" :key="word.word + index" class="word-row"><div class="word-en"><b>{{ index + 1 }}. {{ word.word }}</b><button class="speak-btn" @click="speak(word)">🔊</button><div class="review-note">{{ word.pos }} · {{ word.ipa }}</div></div><div class="meaning-cover revealed">{{ word.meaning }}</div></div></div></div>
    </div>
  </section></main>
</template>
