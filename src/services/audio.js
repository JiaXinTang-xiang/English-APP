import { getJson, setJson } from './storage';

const AUDIO_KEY = 'cet4-audio-settings-v1';
const defaults = { auto: false, wordAudio: true, accent: 'us', wordVolume: 85, rate: 1, loop: false, phonetic: true, translationSpeech: false, keyboard: false, keyboardSound: '机械键盘2', keyboardVolume: 55, feedback: true, feedbackVolume: 55 };
let currentSettings = { ...defaults };
let keyboardPool = [];
let keyboardIndex = 0;
let currentWordAudio = null;
const wordPreloadCache = new Map();

export async function initializeAudioSettings() {
  currentSettings = { ...defaults, ...await getJson(AUDIO_KEY, defaults) };
  return { ...currentSettings };
}

export function getAudioSettings() { return { ...currentSettings }; }
export function saveAudioSettings(value) {
  currentSettings = { ...defaults, ...value };
  keyboardPool = [];
  keyboardIndex = 0;
  return setJson(AUDIO_KEY, currentSettings);
}

export const keyboardSources = {
  '机械键盘': ['jixie/机械0.mp3', 'jixie/机械1.mp3', 'jixie/机械2.mp3', 'jixie/机械3.mp3'],
  '机械键盘1': ['机械键盘1.mp3'],
  '机械键盘2': ['机械键盘2.mp3'],
  '老式机械键盘': ['老式机械键盘.mp3'],
  '笔记本键盘': ['笔记本键盘.mp3'],
  'Alpacas': ['Alpacas.mp3'],
  'Buckling Spring': ['Buckling Spring.mp3'],
  'Cherry MX Blacks': ['Cherry MX Blacks.mp3'],
  'Cherry MX Blues': ['Cherry MX Blues.mp3'],
  'Cherry MX Browns': ['Cherry MX Browns.mp3'],
  'Default': ['Default.wav'],
  'Gateron Black Inks': ['Gateron Black Inks.mp3'],
  'Gateron Red Inks': ['Gateron Red Inks.mp3'],
  'Holy Pandas': ['Holy Pandas.mp3'],
  'Kailh Box Navies': ['Kailh Box Navies.mp3'],
  'NovelKeys Creams': ['NovelKeys Creams.mp3'],
  'SKCM Blue Alps': ['SKCM Blue Alps.mp3'],
  'Topre': ['Topre.mp3'],
  'Turquoise Tealios': ['Turquoise Tealios.mp3']
};

export const keyboardSoundOptions = Object.keys(keyboardSources);

function prepareKeyboardAudio() {
  const files = keyboardSources[currentSettings.keyboardSound] || keyboardSources['机械键盘2'];
  keyboardPool = files.flatMap(file => Array.from({ length: files.length === 1 ? 4 : 1 }, () => {
    const audio = new Audio(`/audio/key-sounds/${file}`);
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, Number(currentSettings.keyboardVolume) / 100));
    return audio;
  }));
  keyboardIndex = 0;
}

export function playKeyboardSound() {
  if (!currentSettings.keyboard || typeof Audio === 'undefined') return;
  if (!keyboardPool.length) prepareKeyboardAudio();
  const audio = keyboardPool[keyboardIndex++ % keyboardPool.length];
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, Number(currentSettings.keyboardVolume) / 100));
  void audio.play().catch(() => {});
}

export function previewKeyboardSound() {
  const wasEnabled = currentSettings.keyboard;
  currentSettings.keyboard = true;
  playKeyboardSound();
  currentSettings.keyboard = wasEnabled;
}

export function playWord(word, accent = currentSettings.accent) {
  const text = String(word).trim();
  if (!text || !currentSettings.wordAudio || typeof Audio === 'undefined') return;
  currentWordAudio?.pause();
  const remote = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === 'uk' ? 1 : 2}`;
  const safe = text.toLowerCase().replace(/[^a-z0-9'-]/g, '');
  const local = `/audio/${accent}/${safe}.mp3`;
  const audio = new Audio();
  currentWordAudio = audio;
  let localTried = false;
  audio.preload = 'auto';
  audio.onerror = () => {
    if (!localTried) {
      localTried = true;
      audio.src = local;
      void audio.play().catch(() => fallbackSpeech(text, accent));
      return;
    }
    fallbackSpeech(text, accent);
  };
  audio.volume = Math.max(0, Math.min(1, Number(currentSettings.wordVolume) / 100));
  audio.playbackRate = Math.max(.5, Math.min(4, Number(currentSettings.rate) || 1));
  audio.loop = Boolean(currentSettings.loop);
  audio.src = remote;
  void audio.play().catch(() => { audio.src = local; void audio.play().catch(() => fallbackSpeech(text, accent)); });
}

function fallbackSpeech(text, accent) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  utterance.rate = Math.max(.5, Math.min(4, Number(currentSettings.rate) || 1));
  utterance.volume = Math.max(0, Math.min(1, Number(currentSettings.wordVolume) / 100));
  window.speechSynthesis.speak(utterance);
}

export function preloadWord(word, accent = currentSettings.accent) {
  const text = String(word || '').trim();
  if (!text || !currentSettings.wordAudio || typeof Audio === 'undefined') return;
  const key = `${accent}:${text}`;
  if (wordPreloadCache.has(key)) return;
  const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === 'uk' ? 1 : 2}`);
  audio.preload = 'auto';
  wordPreloadCache.set(key, audio);
  if (wordPreloadCache.size > 4) wordPreloadCache.delete(wordPreloadCache.keys().next().value);
}

export function speakTranslation(text) {
  if (!currentSettings.translationSpeech || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = 'zh-CN';
  utterance.rate = 1;
  utterance.volume = Math.max(0, Math.min(1, Number(currentSettings.wordVolume) / 100));
  window.speechSynthesis.speak(utterance);
}

export function previewWord() {
  const wasEnabled = currentSettings.wordAudio;
  const wasLooping = currentSettings.loop;
  currentSettings.wordAudio = true;
  currentSettings.loop = false;
  playWord('example', currentSettings.accent);
  currentSettings.wordAudio = wasEnabled;
  currentSettings.loop = wasLooping;
}

export function playFeedback(type) {
  if (!currentSettings.feedback || typeof Audio === 'undefined') return;
  const filename = type === 'wrong' ? 'wrong' : type === 'complete' ? 'click' : 'correct';
  const audio = new Audio(`/audio/effects/${filename}.wav`);
  audio.volume = Math.max(0, Math.min(1, Number(currentSettings.feedbackVolume) / 100));
  void audio.play().catch(() => {});
}

export function previewFeedback(type = 'correct') {
  const wasEnabled = currentSettings.feedback;
  currentSettings.feedback = true;
  playFeedback(type);
  currentSettings.feedback = wasEnabled;
}
