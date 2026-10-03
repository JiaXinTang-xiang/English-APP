import { computed, reactive, ref } from 'vue';
import { getJson, setJson } from '../services/storage';
import { initializeAudioSettings, playWord, saveAudioSettings } from '../services/audio';
import { cloudProgressToLocal, getCloudUser, pullProgress, pushProgress } from '../services/cloudSync';

const PROGRESS_KEY = 'cet4-progress-v1';
export const REVIEW_DAYS = [1, 2, 4, 7, 15, 30];
const progress = ref({ words: {}, days: {}, daySchedule: {} });
const audio = ref({ auto: false, accent: 'us' });
const session = reactive({ selectedDay: null, reviewGap: null, customWords: null, label: '', mode: 'mixed', count: 20, queue: [], index: 0, current: null, questionType: 'choice', answered: false, attempts: 0, right: 0, wrong: 0, mistakes: {}, typed: '', feedback: '' });
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
    session.queue = shuffle(source).slice(0, custom || session.customWords ? source.length : Number(session.count));
    session.index = session.right = session.wrong = session.attempts = 0;
    session.mistakes = {};
    return nextQuestion();
  }
  function nextQuestion() {
    if (session.index >= session.queue.length) return false;
    session.current = session.queue[session.index]; session.attempts = 0; session.answered = false; session.typed = ''; session.feedback = '';
    session.questionType = session.mode === 'mixed' ? (Math.random() < .5 ? 'spell' : 'choice') : session.mode;
    if (audio.value.auto) speak(session.current);
    return true;
  }
  function choices() {
    const source = session.selectedDay ? dayInfo.value?.words || [] : days.value.flatMap(day => day.words);
    return shuffle([session.current, ...shuffle(source.filter(word => word.word !== session.current.word && word.meaning !== session.current.meaning)).slice(0, 3)]);
  }
  function recordWrong() {
    const wordProgress = meta(session.current), key = session.current.word.toLowerCase();
    session.wrong++; wordProgress.wrong++; wordProgress.inWrongBook = true; wordProgress.wrongReviewCount = 0; wordProgress.lastWrong = today();
    if (session.selectedDay) wordProgress.wrongDay = session.selectedDay;
    session.mistakes[key] = (session.mistakes[key] || 0) + 1;
    void saveProgress();
  }
  function answer(ok) {
    if (session.answered) return;
    if (!ok) {
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

  return { days, progress, audio, session, dayInfo, wrongWords, sessionMistakes, nextNewDay, dueReviews, today, meta, speak, updateAudio, prepareDay, prepareCustom, sourceWords, start, choices, answer, finish, next, syncWithCloud };
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
