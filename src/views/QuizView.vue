<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { session, speak, choices, answer, finish, next } = useLearningStore();
const choiceList = computed(() => session.current && session.questionType === 'choice' ? choices() : []);
onMounted(() => { if (!session.current) router.replace({ name: 'home' }); });
function submitSpell() { answer(session.typed.trim().toLowerCase() === session.current.word.toLowerCase()); }
function goNext() { if (!next()) { finish(); router.replace({ name: 'summary' }); } }
</script>

<template>
  <main class="shell"><section v-if="session.current" class="view active">
    <div class="quiz-top"><button class="back" @click="router.push({ name: 'setup', params: session.selectedDay ? { day: session.selectedDay } : {} })">× 退出</button><span>{{ session.label }}</span><span>{{ session.index + 1 }}/{{ session.queue.length }}</span></div>
    <div class="progress"><i :style="{ width: `${session.index / Math.max(1, session.queue.length) * 100}%` }"></i></div>
    <article class="card question-card"><p class="eyebrow">{{ session.questionType === 'spell' ? '中译英（3次机会）' : '英译中（3次机会）' }}</p><h2><span class="prompt-line">{{ session.questionType === 'spell' ? session.current.meaning : session.current.word }} <button class="speak-btn" @click="speak(session.current)">🔊</button></span></h2><p class="hint"><span class="quiz-ipa">{{ session.current.ipa }}</span><span class="quiz-pos">{{ session.current.pos }}</span></p>
      <form v-if="session.questionType === 'spell'" class="answer-area" @submit.prevent="submitSpell"><input v-model="session.typed" autofocus autocomplete="off" placeholder="输入英文单词"><button class="primary">确认</button></form>
      <div v-else class="choices"><button v-for="word in choiceList" :key="word.word" class="choice" :disabled="session.answered" @click="answer(word.word === session.current.word)">{{ word.meaning }}</button></div>
      <div v-if="session.feedback" class="feedback" :class="session.answered && session.feedback.startsWith('正确') ? 'good' : 'bad'">{{ session.feedback }}</div><button v-if="session.answered" class="primary" @click="goNext">下一题</button>
    </article>
  </section></main>
</template>
