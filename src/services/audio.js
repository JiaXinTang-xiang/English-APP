import { getJson, setJson } from './storage';

const AUDIO_KEY = 'cet4-audio-settings-v1';
const defaults = { auto: false, accent: 'us', wordVolume: 85, keyboard: false, keyboardSound: '机械键盘2', keyboardVolume: 55, feedback: true, feedbackVolume: 55 };
let currentSettings = { ...defaults };
let keyboardPool = [];
let keyboardIndex = 0;

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

const keyboardSources = {
  '机械键盘': ['jixie/机械0.mp3', 'jixie/机械1.mp3', 'jixie/机械2.mp3', 'jixie/机械3.mp3'],
  '机械键盘1': ['机械键盘1.mp3'],
  '机械键盘2': ['机械键盘2.mp3'],
  '老式机械键盘': ['老式机械键盘.mp3'],
  '笔记本键盘': ['笔记本键盘.mp3']
};

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
  if (!text || typeof Audio === 'undefined') return;
  const remote = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === 'uk' ? 1 : 2}`;
  const safe = text.toLowerCase().replace(/[^a-z0-9'-]/g, '');
  const local = `/audio/${accent}/${safe}.mp3`;
  const audio = new Audio();
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
  audio.src = remote;
  void audio.play().catch(() => { audio.src = local; void audio.play().catch(() => fallbackSpeech(text, accent)); });
}

function fallbackSpeech(text, accent) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

export function previewWord() { playWord('example', currentSettings.accent); }

export function playFeedback(type) {
  if (!currentSettings.feedback || typeof Audio === 'undefined') return;
  const audio = new Audio(`/audio/effects/${type === 'correct' ? 'correct' : 'wrong'}.wav`);
  audio.volume = Math.max(0, Math.min(1, Number(currentSettings.feedbackVolume) / 100));
  void audio.play().catch(() => {});
}

export function previewFeedback(type = 'correct') {
  const wasEnabled = currentSettings.feedback;
  currentSettings.feedback = true;
  playFeedback(type);
  currentSettings.feedback = wasEnabled;
}
