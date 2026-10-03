const AUDIO_KEY = 'cet4-audio-settings-v1';

function settings() {
  try { return JSON.parse(localStorage.getItem(AUDIO_KEY)) || { auto: false, accent: 'us' }; }
  catch { return { auto: false, accent: 'us' }; }
}

export function getAudioSettings() { return settings(); }
export function saveAudioSettings(value) { localStorage.setItem(AUDIO_KEY, JSON.stringify(value)); }

export function playWord(word, accent = settings().accent) {
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
