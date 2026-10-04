import { computed, reactive, ref } from 'vue';
import { getJson, removeItem, setJson } from '../services/storage';
import { initializeAudioSettings, playFeedback, playKeyboardSound, playWord, preloadWord, previewFeedback, previewKeyboardSound, previewWord, saveAudioSettings, speakTranslation } from '../services/audio';
import { cloudProgressToLocal, getCloudUser, mergeProgress, pullProgress, pushProgress } from '../services/cloudSync';
import { BOOKS, bookState, getBook, getBookDays, selectBook } from '../services/books';

const PROGRESS_KEY = 'vocab-progress-v2';
const LEGACY_PROGRESS_KEY = 'cet4-progress-v1';
export const REVIEW_DAYS = [1, 2, 4, 7, 15, 30];
const emptyProgress = () => ({ words: {}, days: {}, daySchedule: {} });
const allProgress = ref({ cet4: emptyProgress(), cet6: emptyProgress() });
const progress = computed(() => allProgress.value[session.selectedBook] || emptyProgress());
const audio = ref({ auto: false, accent: 'us' });
const cloudSync = reactive({ status: 'idle', lastSyncedAt: null, error: '' });
const session = reactive({ selectedBook: 'cet4', selectedDay: null, reviewGap: null, customWords: null, label: '', mode: 'typing', count: 20, random: true, queue: [], index: 0, current: null, questionType: 'typing', choiceOptions: [], answered: false, attempts: 0, right: 0, wrong: 0, mistakes: {}, requeueCounts: {}, requeuedCurrent: false, typed: '', spellingDiff: [], feedback: '', startedAt: null, finishedAt: null, correctKeys: 0, wrongKeys: 0, letterMistakes: {}, currentWordErrors: 0, typingErrorIndex: -1, typingErrorChar: '', typingLocked: false });
let initialized = false;

export async function initializeLearningStore() {
  if (initialized) return;
  const stored = await getJson(PROGRESS_KEY, null);
  if (stored?.cet4 || stored?.cet6) {
    allProgress.value = { cet4: normalizeProgress(stored.cet4), cet6: normalizeProgress(stored.cet6) };
  } else {
    const legacy = await getJson(LEGACY_PROGRESS_KEY, null);
    allProgress.value = { cet4: normalizeProgress(legacy), cet6: emptyProgress() };
    if (legacy) {
      await setJson(PROGRESS_KEY, allProgress.value);
      await removeItem(LEGACY_PROGRESS_KEY);
    }
  }
  session.selectedBook = bookState.activeBookId.value;
  audio.value = await initializeAudioSettings();
  initialized = true;
}

export function useLearningStore() {
  const books = BOOKS;
  const currentBook = computed(() => getBook(session.selectedBook));
  const days = computed(() => getBookDays(session.selectedBook));
  const dayInfo = computed(() => days.value.find(day => day.day === session.selectedDay));
  const wrongWords = computed(() => {
    const map = new Map();
    days.value.forEach(day => day.words.forEach(word => {
      const wordProgress = progress.value.words[word.word.toLowerCase()];
      if (wordProgress?.inWrongBook && !map.has(word.word.toLowerCase())) map.set(word.word.toLowerCase(), word);
    }));
    return [...map.values()];
  });
  const sessionMistakes = computed(() => [...new Map(session.queue.filter(word => session.mistakes[word.word.toLowerCase()]).map(word => [word.word.toLowerCase(), word])).values()]);
  const nextNewDay = computed(() => days.value.find(day => !progress.value.daySchedule[day.day]));
  const dueReviews = computed(() => {
    const now = today();
    return days.value.flatMap(day => {
      const schedule = progress.value.daySchedule[day.day];
      if (!schedule) return [];
      schedule.reviewed ||= [];
      const elapsed = daysBetween(schedule.learnedDate, now);
      const gap = REVIEW_DAYS.find(value => value <= elapsed && !schedule.reviewed.includes(value));
      return gap ? [{ day: day.day, gap, overdue: elapsed > gap }] : [];
    });
  });
  const progressSummary = computed(() => ({
    learnedDays: Object.values(progress.value.days || {}).filter(Boolean).length,
    practicedWords: Object.keys(progress.value.words || {}).length,
    wrongWords: wrongWords.value.length
  }));
  const sessionStats = computed(() => {
    const end = session.finishedAt || Date.now();
    const seconds = session.startedAt ? Math.max(1, Math.round((end - session.startedAt) / 1000)) : 0;
    const totalKeys = session.correctKeys + session.wrongKeys;
    return {
      seconds,
      wordsPerMinute: seconds ? Math.round((session.right / seconds) * 60) : 0,
      keyAccuracy: totalKeys ? Math.round((session.correctKeys / totalKeys) * 100) : 0,
      hardestLetters: Object.entries(session.letterMistakes).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };
  });

  function saveProgress() {
    const saved = setJson(PROGRESS_KEY, allProgress.value);
    void pushProgress(progress.value, audio.value, session.selectedBook).catch(() => {});
    return saved;
  }
  function meta(word) {
    const key = word.word.toLowerCase();
    progress.value.words[key] ||= { right: 0, wrong: 0 };
    return progress.value.words[key];
  }
  function speak(word) { playWord(word.word, audio.value.accent); }
  function speakMeaning(word) { speakTranslation(word.meaning); }
  function playKeySound() { playKeyboardSound(); }
  function previewKeySound() { previewKeyboardSound(); }
  function previewWordSound() { previewWord(); }
  function playAnswerSound(type) { playFeedback(type); }
  function previewAnswerSound(type) { previewFeedback(type); }
  function updateAudio() {
    const saved = saveAudioSettings(audio.value);
    void pushProgress(progress.value, audio.value, session.selectedBook).catch(() => {});
    return saved;
  }
  async function selectLearningBook(bookId) {
    await selectBook(bookId);
    session.selectedBook = bookId;
    session.selectedDay = null;
    session.customWords = null;
    session.current = null;
    return currentBook.value;
  }
  function prepareDay(day, gap = null) {
    session.selectedDay = Number(day); session.reviewGap = gap === null ? null : Number(gap); session.customWords = null; session.label = `${currentBook.value.chapterLabel} ${day}`;
  }
  function prepareCustom(words, label) {
    session.selectedDay = null; session.reviewGap = null; session.customWords = words; session.label = label;
  }
  function sourceWords() { return session.customWords || dayInfo.value?.words || []; }
  function start(nextMode = session.mode, custom = null) {
    session.mode = nextMode;
    const source = custom || sourceWords();
    session.queue = custom || session.customWords
      ? (session.random ? shuffle(source) : [...source])
      : (session.random ? weightedSample(source, Number(session.count), word => wordWeight(meta(word))) : source.slice(0, Number(session.count)));
    session.index = session.right = session.wrong = session.attempts = 0;
    session.mistakes = {};
    session.requeueCounts = {};
    session.startedAt = Date.now(); session.finishedAt = null; session.correctKeys = 0; session.wrongKeys = 0; session.letterMistakes = {};
    return nextQuestion();
  }
  function nextQuestion() {
    if (session.index >= session.queue.length) return false;
    session.current = session.queue[session.index]; session.attempts = 0; session.answered = false; session.requeuedCurrent = false; session.typed = ''; session.spellingDiff = []; session.feedback = ''; session.currentWordErrors = 0; session.typingErrorIndex = -1; session.typingErrorChar = ''; session.typingLocked = false;
    session.questionType = session.mode === 'mixed' ? ['spell', 'choice', 'typing'][Math.floor(Math.random() * 3)] : session.mode;
    session.choiceOptions = session.questionType === 'choice' ? buildChoices(session.current) : [];
    if (audio.value.auto) speak(session.current);
    const nextWord = session.queue[session.index + 1];
    if (nextWord) preloadWord(nextWord.word, audio.value.accent);
    return true;
  }
  function buildChoices(current) {
    const source = session.selectedDay ? dayInfo.value?.words || [] : days.value.flatMap(day => day.words);
    const distractors = source
      .filter(word => word.word !== current.word && word.meaning !== current.meaning)
      .map(word => ({ word, score: similarity(current, word) + Math.random() * .08 }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map(item => item.word);
    return shuffle([current, ...distractors]);
  }
  function recordWrong() {
    const wordProgress = meta(session.current), key = session.current.word.toLowerCase();
    session.wrong++; wordProgress.wrong++; wordProgress.inWrongBook = true; wordProgress.wrongReviewCount = 0; wordProgress.lastWrong = today();
    if (session.selectedDay) wordProgress.wrongDay = session.selectedDay;
    session.mistakes[key] = (session.mistakes[key] || 0) + 1;
    requeueCurrentWord(key);
    void saveProgress();
  }
  function answer(ok, typedAnswer = '') {
    if (session.answered) return;
    if (!ok) {
      if (session.questionType === 'spell') session.spellingDiff = spellingDifference(typedAnswer, session.current.word);
      session.attempts++; recordWrong();
      if (session.questionType === 'typing') { session.currentWordErrors++; session.attempts = 0; session.feedback = '输入有误，请重新敲这个单词。'; return; }
      if (session.attempts < 3) { session.feedback = `回答不对，还可以尝试 ${3 - session.attempts} 次。`; return; }
    } else {
      session.right++;
      const wordProgress = meta(session.current);
      wordProgress.right++; wordProgress.lastRight = today();
      if (session.customWords && wordProgress.inWrongBook && session.attempts === 0) {
        wordProgress.wrongReviewCount = (wordProgress.wrongReviewCount || 0) + 1;
        if (wordProgress.wrongReviewCount >= 3) wordProgress.inWrongBook = false;
      }
      void saveProgress();
    }
    session.answered = true;
    session.feedback = ok ? `正确：${session.current.word}` : `正确答案：${session.current.word} · ${session.current.meaning}`;
  }
  function finish() {
    session.finishedAt = Date.now();
    if (session.selectedDay) {
      const schedule = progress.value.daySchedule[session.selectedDay] ||= { learnedDate: today(), reviewed: [] };
      if (session.reviewGap) schedule.reviewed = [...new Set([...(schedule.reviewed || []), ...REVIEW_DAYS.filter(value => value <= session.reviewGap)])];
      else progress.value.days[session.selectedDay] = (progress.value.days[session.selectedDay] || 0) + 1;
    }
    void saveProgress();
  }
  function next() { session.index++; return nextQuestion(); }
  function restart() { return start(session.mode); }
  function skip() { session.index++; return nextQuestion(); }
  function recordTypingKey(correct, expected, entered) {
    if (correct) { session.correctKeys++; return; }
    session.wrongKeys++;
    const key = String(expected || entered || '?').toLowerCase();
    session.letterMistakes[key] = (session.letterMistakes[key] || 0) + 1;
  }

  function requeueCurrentWord(key) {
    if (session.requeuedCurrent || (session.requeueCounts[key] || 0) >= 2) return;
    const remaining = session.queue.length - session.index - 1;
    if (remaining < 2) return;
    const offset = Math.min(remaining, 3 + Math.floor(Math.random() * 4));
    session.queue.splice(session.index + offset, 0, session.current);
    session.requeueCounts[key] = (session.requeueCounts[key] || 0) + 1;
    session.requeuedCurrent = true;
  }

  async function syncWithCloud() {
    cloudSync.status = 'syncing'; cloudSync.error = '';
    try {
      const user = await getCloudUser();
      if (!user) { cloudSync.status = 'idle'; return { synced: false, reason: 'signed-out' }; }
      let settings = null;
      for (const book of BOOKS) {
        const cloud = await pullProgress(book.id);
        allProgress.value[book.id] = mergeProgress(allProgress.value[book.id], cloudProgressToLocal(cloud));
        settings ||= cloud?.settings || null;
      }
      if (settings) {
        audio.value = { ...audio.value, auto: Boolean(settings.auto_play ?? audio.value.auto), wordAudio: settings.word_audio ?? audio.value.wordAudio, accent: settings.accent || audio.value.accent, wordVolume: Number(settings.word_volume ?? audio.value.wordVolume ?? 85), rate: Number(settings.playback_rate ?? audio.value.rate ?? 1), loop: settings.loop_audio ?? audio.value.loop, phonetic: settings.show_phonetic ?? audio.value.phonetic, translationSpeech: settings.translation_speech ?? audio.value.translationSpeech, keyboard: Boolean(settings.keyboard_sound ?? audio.value.keyboard), keyboardSound: settings.keyboard_sound_file || audio.value.keyboardSound, keyboardVolume: Number(settings.keyboard_volume ?? audio.value.keyboardVolume ?? 55), feedback: settings.feedback_sound ?? audio.value.feedback, feedbackVolume: Number(settings.feedback_volume ?? audio.value.feedbackVolume ?? 55) };
        await saveAudioSettings(audio.value);
      }
      await setJson(PROGRESS_KEY, allProgress.value);
      await Promise.all(BOOKS.map(book => pushProgress(allProgress.value[book.id], audio.value, book.id)));
      cloudSync.status = 'synced'; cloudSync.lastSyncedAt = new Date().toISOString();
      return { synced: true, user };
    } catch (error) {
      cloudSync.status = navigator.onLine ? 'error' : 'offline';
      cloudSync.error = error.message || '同步失败';
      throw error;
    }
  }

  async function clearLocalProgress() {
    allProgress.value = { cet4: emptyProgress(), cet6: emptyProgress() };
    await removeItem(PROGRESS_KEY);
  }

  return { books, currentBook, days, progress, allProgress, audio, cloudSync, progressSummary, sessionStats, session, dayInfo, wrongWords, sessionMistakes, nextNewDay, dueReviews, today, meta, speak, speakMeaning, playKeySound, playAnswerSound, previewKeySound, previewWordSound, previewAnswerSound, updateAudio, selectLearningBook, prepareDay, prepareCustom, sourceWords, start, restart, skip, recordTypingKey, answer, finish, next, syncWithCloud, clearLocalProgress };
}

function normalizeProgress(value) {
  return { words: value?.words || {}, days: value?.days || {}, daySchedule: value?.daySchedule || {} };
}

function today() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function daysBetween(a, b) { return Math.floor((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000); }
function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function weightedSample(list, count, weightFor) {
  const pool = [...list];
  const result = [];
  while (pool.length && result.length < count) {
    const weights = pool.map(item => Math.max(1, weightFor(item)));
    let ticket = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    let selected = 0;
    for (; selected < weights.length - 1; selected++) {
      ticket -= weights[selected];
      if (ticket <= 0) break;
    }
    result.push(pool.splice(selected, 1)[0]);
  }
  return result;
}

function wordWeight(wordProgress) {
  return 1 + Math.min(4, Math.max(0, (wordProgress.wrong || 0) - (wordProgress.right || 0)));
}

function similarity(first, second) {
  const firstTokens = meaningTokens(first.meaning), secondTokens = meaningTokens(second.meaning);
  let common = 0;
  firstTokens.forEach(token => { if (secondTokens.has(token)) common++; });
  const unionSize = new Set([...firstTokens, ...secondTokens]).size;
  const semantic = common / Math.max(1, unionSize);
  const spelling = 1 - editDistance(first.word, second.word) / Math.max(first.word.length, second.word.length, 1);
  return semantic * 2 + spelling + (first.pos === second.pos ? .25 : 0);
}

function meaningTokens(value) {
  return new Set(String(value).replace(/[；，、,.]/g, ' ').split(/\s+/).filter(token => token.length > 1));
}

function editDistance(first, second) {
  const a = first.toLowerCase(), b = second.toLowerCase();
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let row = 0; row <= a.length; row++) matrix[row][0] = row;
  for (let column = 0; column <= b.length; column++) matrix[0][column] = column;
  for (let row = 1; row <= a.length; row++) for (let column = 1; column <= b.length; column++) {
    matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1));
  }
  return matrix[a.length][b.length];
}

function spellingDifference(typed, target) {
  const entered = String(typed).trim();
  const first = entered.toLowerCase(), second = target.toLowerCase();
  const matrix = Array.from({ length: first.length + 1 }, () => Array(second.length + 1).fill(0));
  for (let row = 0; row <= first.length; row++) matrix[row][0] = row;
  for (let column = 0; column <= second.length; column++) matrix[0][column] = column;
  for (let row = 1; row <= first.length; row++) for (let column = 1; column <= second.length; column++) {
    matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1));
  }
  const result = [];
  let row = first.length, column = second.length;
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && first[row - 1] === second[column - 1]) {
      result.push({ char: entered[row - 1], expected: target[column - 1], correct: true }); row--; column--;
    } else if (column > 0 && matrix[row][column] === matrix[row][column - 1] + 1) {
      result.push({ char: '−', expected: target[column - 1], correct: false }); column--;
    } else if (row > 0 && matrix[row][column] === matrix[row - 1][column] + 1) {
      result.push({ char: entered[row - 1], expected: '', correct: false }); row--;
    } else {
      result.push({ char: entered[row - 1], expected: target[column - 1], correct: false }); row--; column--;
    }
  }
  return result.reverse();
}
