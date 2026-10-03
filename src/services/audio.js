import { getJson, setJson } from './storage';

const AUDIO_KEY = 'cet4-audio-settings-v1';
const defaults = { auto: false, accent: 'us' };
let currentSettings = { ...defaults };

export async function initializeAudioSettings() {
  currentSettings = { ...defaults, ...await getJson(AUDIO_KEY, defaults) };
  return { ...currentSettings };
}

export function getAudioSettings() { return { ...currentSettings }; }
export function saveAudioSettings(value) {
  currentSettings = { ...defaults, ...value };
  return setJson(AUDIO_KEY, currentSettings);
}

export function playWord(word, accent = currentSettings.accent) {
  const safe = String(word).toLowerCase().replace(/[^a-z0-9'-]/g, '');
  const source = `./audio/${accent}/${safe}.mp3`;
  const audio = new Audio(source);
  audio.onerror = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };
  audio.play().catch(() => {});
}
