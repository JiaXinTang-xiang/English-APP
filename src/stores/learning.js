import { computed, reactive, ref } from 'vue';
import { getJson, setJson } from '../services/storage';
import { initializeAudioSettings, playWord, saveAudioSettings } from '../services/audio';
import { cloudProgressToLocal, getCloudUser, pullProgress, pushProgress } from '../services/cloudSync';

const PROGRESS_KEY = 'cet4-progress-v1';
export const REVIEW_DAYS = [1, 2, 4, 7, 15, 30];
const progress = ref({ words: {}, days: {}, daySchedule: {} });
const audio = ref({ auto: false, accent: 'us' });
const session = reactive({ selectedDay: null, reviewGap: null, customWords: null, label: '', mode: 'mixed', count: 20, queue: [], index: 0, current: null, questionType: 'choice', choiceOptions: [], answered: false, attempts: 0, right: 0, wrong: 0, mistakes: {}, requeueCounts: {}, requeuedCurrent: false, typed: '', spellingDiff: [], feedback: '' });
let initialized = false;

export async function initializeLearningStore() {
  if (initialized) return;
  const stored = await getJson(PROGRESS_KEY, progress.value);
  progress.value = { words: stored?.words || {}, days: stored?.days || {}, daySchedule: stored?.daySchedule || {} };
  audio.value = await initializeAudioSettings();
  initialized = true;
}

export function useLearningStore() {
  const days = computed(() => window.CET4_DAYS || []);
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

  function saveProgress() {
    const saved = setJson(PROGRESS_KEY, progress.value);
    void pushProgress(progress.value, audio.value).catch(() => {});
    return saved;
  }
  function meta(word) {
    const key = word.word.toLowerCase();
    progress.value.words[key] ||= { right: 0, wrong: 0 };
    return progress.value.words[key];
  }
  function speak(word) { playWord(word.word, audio.value.accent); }
  function updateAudio() {
    const saved = saveAudioSettings(audio.value);
    void pushProgress(progress.value, audio.value).catch(() => {});
    return saved;
  }
  function prepareDay(day, gap = null) {
    session.selectedDay = Number(day); session.reviewGap = gap === null ? null : Number(gap); session.customWords = null; session.label = `Day ${day}`;
  }
  function prepareCustom(words, label) {
    session.selectedDay = null; session.reviewGap = null; session.customWords = words; session.label = label;
  }
  function sourceWords() { return session.customWords || dayInfo.value?.words || []; }
  function start(nextMode = session.mode, custom = null) {
    session.mode = nextMode;
    const source = custom || sourceWords();
    session.queue = custom || session.customWords
      ? shuffle(source)
      : weightedSample(source, Number(session.count), word => wordWeight(meta(word)));
    session.index = session.right = session.wrong = session.attempts = 0;
    session.mistakes = {};
    session.requeueCounts = {};
    return nextQuestion();
  }
  function nextQuestion() {
    if (session.index >= session.queue.length) return false;
    session.current = session.queue[session.index]; session.attempts = 0; session.answered = false; session.requeuedCurrent = false; session.typed = ''; session.spellingDiff = []; session.feedback = '';
    session.questionType = session.mode === 'mixed' ? (Math.random() < .5 ? 'spell' : 'choice') : session.mode;
    session.choiceOptions = session.questionType === 'choice' ? buildChoices(session.current) : [];
    if (audio.value.auto) speak(session.current);
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
    if (session.selectedDay) {
      const schedule = progress.value.daySchedule[session.selectedDay] ||= { learnedDate: today(), reviewed: [] };
      if (session.reviewGap) schedule.reviewed = [...new Set([...(schedule.reviewed || []), ...REVIEW_DAYS.filter(value => value <= session.reviewGap)])];
      else progress.value.days[session.selectedDay] = (progress.value.days[session.selectedDay] || 0) + 1;
    }
    void saveProgress();
  }
  function next() { session.index++; return nextQuestion(); }

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
    const user = await getCloudUser();
    if (!user) return { synced: false, reason: 'signed-out' };
    const cloud = await pullProgress();
    const hasCloudData = Boolean(cloud?.words?.length || cloud?.days?.length || cloud?.settings);
    if (hasCloudData) {
      progress.value = cloudProgressToLocal(cloud);
      if (cloud.settings) audio.value = { auto: Boolean(cloud.settings.auto_play), accent: cloud.settings.accent || 'us' };
      await saveProgress();
      await saveAudioSettings(audio.value);
    } else {
      await pushProgress(progress.value, audio.value);
    }
    return { synced: true, user };
  }

  return { days, progress, audio, session, dayInfo, wrongWords, sessionMistakes, nextNewDay, dueReviews, today, meta, speak, updateAudio, prepareDay, prepareCustom, sourceWords, start, answer, finish, next, syncWithCloud };
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
