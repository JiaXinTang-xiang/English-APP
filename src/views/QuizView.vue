<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AudioSettingsDrawer from '../components/AudioSettingsDrawer.vue';
import { useLearningStore } from '../stores/learning';

const router = useRouter();
const input = ref(null);
const settingsOpen = ref(false);
let resetTimer = null;
let nextTimer = null;
const { currentBook, audio, session, speak, speakMeaning, answer, finish, next, restart, skip, recordTypingKey, playKeySound, playAnswerSound } = useLearningStore();
const progressWidth = computed(() => `${Math.round(session.index / Math.max(1, session.queue.length) * 100)}%`);

onMounted(() => {
  if (!session.current) router.replace({ name: 'home' });
  else focusInput();
});
onUnmounted(() => { clearTimeout(resetTimer); clearTimeout(nextTimer); });

function focusInput() { void nextTick(() => input.value?.focus()); }
function submitSpell() {
  const typed = session.typed.trim();
  const correct = typed.toLowerCase() === session.current.word.toLowerCase();
  answer(correct, typed);
  playAnswerSound(correct ? 'correct' : 'wrong');
  if (!session.answered) session.typed = '';
}
function handleTypingBeforeInput(event) {
  if (session.typingLocked || !event.data || event.data.length !== 1) { if (event.data) event.preventDefault(); return; }
  const expected = session.current.word[session.typed.length];
  const entered = event.data;
  const correct = expected && entered.toLowerCase() === expected.toLowerCase();
  recordTypingKey(correct, expected, entered);
  if (correct) { playKeySound(); return; }
  event.preventDefault();
  failTyping(entered);
}
function handleTypingInput() {
  const target = session.current.word;
  const mismatch = [...session.typed].findIndex((letter, index) => letter.toLowerCase() !== target[index]?.toLowerCase());
  if (mismatch >= 0) { failTyping(session.typed[mismatch], mismatch); return; }
  if (session.typed.length >= target.length) {
    answer(true, session.typed);
    playAnswerSound('correct');
    nextTimer = setTimeout(goNext, 320);
  }
}
function failTyping(entered, index = session.typed.length) {
  if (session.typingLocked) return;
  session.typingLocked = true;
  session.typingErrorIndex = index;
  session.typingErrorChar = entered;
  answer(false, `${session.typed}${entered}`);
  playAnswerSound('wrong');
  resetTimer = setTimeout(() => {
    session.typed = '';
    session.typingErrorIndex = -1;
    session.typingErrorChar = '';
    session.typingLocked = false;
    focusInput();
  }, 300);
}
function displayLetter(letter, index) { return index === session.typingErrorIndex ? session.typingErrorChar : letter; }
function letterState(index) { return { correct: index < session.typed.length && index !== session.typingErrorIndex, wrong: index === session.typingErrorIndex }; }
function answerChoice(correct) { answer(correct); playAnswerSound(correct ? 'correct' : 'wrong'); }
function goNext() {
  clearTimeout(nextTimer);
  if (!next()) {
    finish();
    playAnswerSound('complete');
    router.replace({ name: 'summary' });
    return;
  }
  focusInput();
}
function restartSession() { restart(); focusInput(); }
function skipWord() {
  if (!skip()) { finish(); router.replace({ name: 'summary' }); return; }
  focusInput();
}
</script>

<template>
  <main v-if="session.current" class="training-page">
    <header class="training-topbar">
      <button class="training-exit" title="退出训练" @click="router.push({ name: 'setup', params: session.selectedDay ? { day: session.selectedDay } : {} })">×</button>
      <div class="training-location"><strong>{{ currentBook.name }}</strong><span>{{ session.label }} · {{ session.index + 1 }}/{{ session.queue.length }}</span></div>
      <div class="training-actions"><button title="重新开始当前训练" @click="restartSession">↻</button><button title="训练设置" @click="settingsOpen = true">⚙</button></div>
    </header>
    <div class="training-progress"><i :style="{ width: progressWidth }"></i></div>

    <section class="training-stage">
      <article class="training-word-card" :class="{ 'is-typing': session.questionType === 'typing' }">
        <p class="eyebrow">{{ session.questionType === 'spell' ? '中译英 · 3 次机会' : session.questionType === 'typing' ? '看着单词照着敲' : '英译中 · 3 次机会' }}</p>

        <template v-if="session.questionType === 'typing'">
          <button class="typing-word-display" title="播放单词发音" @click="speak(session.current)"><span v-for="(letter, index) in session.current.word" :key="`${letter}-${index}`" :class="letterState(index)">{{ displayLetter(letter, index) }}</span></button>
          <div class="word-meta"><span v-if="audio.phonetic">{{ audio.accent === 'uk' ? (session.current.ukIpa || session.current.ipa) : (session.current.usIpa || session.current.ipa) }}</span><button v-if="audio.translationSpeech" title="朗读中文释义" @click="speakMeaning(session.current)">{{ session.current.meaning }} 🔊</button><span v-else>{{ session.current.meaning }}</span></div>
          <form class="typing-answer-area" @submit.prevent><div class="typing-progress-letters" aria-label="当前输入进度"><span v-for="(letter, index) in session.current.word" :key="`progress-${letter}-${index}`" :class="letterState(index)">{{ index < session.typed.length ? letter : index === session.typingErrorIndex ? session.typingErrorChar : '·' }}</span></div><input ref="input" v-model="session.typed" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="照着上面的单词输入" :disabled="session.typingLocked || session.answered" @beforeinput="handleTypingBeforeInput" @input="handleTypingInput"><small>输错的字母会标红，随后清空当前单词重新输入</small></form>
          <button v-if="session.currentWordErrors >= 3 && !session.answered" class="training-skip" @click="skipWord">跳过这个单词</button>
        </template>

        <template v-else>
          <h2><span class="prompt-line">{{ session.questionType === 'spell' ? session.current.meaning : session.current.word }} <button class="speak-btn" title="播放发音" @click="speak(session.current)">🔊</button></span></h2>
          <p v-if="audio.phonetic" class="hint"><span class="quiz-ipa">{{ audio.accent === 'uk' ? (session.current.ukIpa || session.current.ipa) : (session.current.usIpa || session.current.ipa) }}</span><span class="quiz-pos">{{ session.current.pos }}</span></p>
          <form v-if="session.questionType === 'spell'" class="answer-area" @submit.prevent="submitSpell"><input ref="input" v-model="session.typed" autofocus autocomplete="off" placeholder="输入英文单词"><button class="primary">确认</button></form>
          <div v-else class="choices"><button v-for="word in session.choiceOptions" :key="word.word" class="choice" :disabled="session.answered" @click="answerChoice(word.word === session.current.word)">{{ word.meaning }}</button></div>
          <div v-if="session.spellingDiff.length && session.questionType === 'spell'" class="spelling-diff" aria-live="polite"><span v-for="(item, index) in session.spellingDiff" :key="index" :class="item.correct ? 'letter-correct' : 'letter-wrong'">{{ item.char }}</span><small>绿色正确；红色表示错误位置，− 表示遗漏字母</small></div>
          <div v-if="session.feedback" class="feedback" :class="session.answered && session.feedback.startsWith('正确') ? 'good' : 'bad'">{{ session.feedback }}</div><button v-if="session.answered" class="primary" @click="goNext">下一题</button>
        </template>
      </article>
    </section>
    <AudioSettingsDrawer :open="settingsOpen" @close="settingsOpen = false; focusInput()" />
  </main>
</template>
