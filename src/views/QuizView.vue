<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const { session, speak, answer, finish, next, playKeySound, playAnswerSound } = useLearningStore();
onMounted(() => { if (!session.current) router.replace({ name: 'home' }); });
function onKeydown(event) { if (session.questionType !== 'spell' || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return; const expected = session.current?.word?.[session.typed.length]; if (expected && event.key.toLowerCase() === expected.toLowerCase()) playKeySound(); }
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
function submitSpell() {
  const typed = session.typed.trim();
  const correct = typed.toLowerCase() === session.current.word.toLowerCase();
  answer(correct, typed);
  playAnswerSound(correct ? 'correct' : 'wrong');
  if (!session.answered) session.typed = '';
}
function handleTypingKeydown(event) {
  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
  const expected = session.current.word[session.typed.length];
  const correct = expected && event.key.toLowerCase() === expected.toLowerCase();
  if (!correct) {
    event.preventDefault();
    answer(false, `${session.typed}${event.key}`);
    playAnswerSound('wrong');
    session.typed = '';
    return;
  }
  playKeySound();
}
function handleTypingInput() {
  if (session.typed.length >= session.current.word.length) {
    answer(true, session.typed);
    playAnswerSound('correct');
  }
}
function answerChoice(correct) { answer(correct); playAnswerSound(correct ? 'correct' : 'wrong'); }
function goNext() { if (!next()) { finish(); router.replace({ name: 'summary' }); } }
</script>

<template>
  <main class="shell"><section v-if="session.current" class="view active">
    <div class="quiz-top"><button class="back" @click="router.push({ name: 'setup', params: session.selectedDay ? { day: session.selectedDay } : {} })">× 退出</button><span>{{ session.label }}</span><span>{{ session.index + 1 }}/{{ session.queue.length }}</span></div>
    <div class="progress"><i :style="{ width: `${session.index / Math.max(1, session.queue.length) * 100}%` }"></i></div>
    <article class="card question-card"><p class="eyebrow">{{ session.questionType === 'spell' ? '中译英（3次机会）' : session.questionType === 'typing' ? '敲单词模式' : '英译中（3次机会）' }}</p><h2><span class="prompt-line">{{ session.questionType === 'spell' || session.questionType === 'typing' ? session.current.meaning : session.current.word }} <button class="speak-btn" @click="speak(session.current)">🔊</button></span></h2><p class="hint"><span class="quiz-ipa">{{ session.current.ipa }}</span><span class="quiz-pos">{{ session.current.pos }}</span></p>
      <form v-if="session.questionType === 'spell'" class="answer-area" @submit.prevent="submitSpell"><input v-model="session.typed" autofocus autocomplete="off" placeholder="输入英文单词"><button class="primary">确认</button></form>
      <form v-else-if="session.questionType === 'typing'" class="typing-answer-area" @submit.prevent><div class="typing-target"><span v-for="(letter, index) in session.current.word" :key="`${letter}-${index}`" :class="index < session.typed.length ? 'typed-letter' : ''">{{ index < session.typed.length ? letter : '·' }}</span></div><input v-model="session.typed" autofocus autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="按键输入单词" @keydown="handleTypingKeydown" @input="handleTypingInput"><small>输入错误会清空本词，重新建立正确的肌肉记忆</small></form>
      <div v-else class="choices"><button v-for="word in session.choiceOptions" :key="word.word" class="choice" :disabled="session.answered" @click="answerChoice(word.word === session.current.word)">{{ word.meaning }}</button></div>
      <div v-if="session.spellingDiff.length && session.questionType === 'spell'" class="spelling-diff" aria-live="polite"><span v-for="(item, index) in session.spellingDiff" :key="index" :class="item.correct ? 'letter-correct' : 'letter-wrong'" :title="item.correct ? '位置正确' : item.expected ? `这里应为 ${item.expected}` : '多余字母'">{{ item.char }}</span><small>绿色正确；红色表示错误位置，− 表示遗漏字母</small></div>
      <div v-if="session.feedback" class="feedback" :class="session.answered && session.feedback.startsWith('正确') ? 'good' : 'bad'">{{ session.feedback }}</div><button v-if="session.answered" class="primary" @click="goNext">下一题</button>
    </article>
  </section></main>
</template>
