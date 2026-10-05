let currentUtterance = null;
let articleSpeaking = false;
let articlePaused = false;

export function speakArticle(text, { rate = 0.9, onend, onerror } = {}) {
  if (!('speechSynthesis' in window) || !String(text || '').trim()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = 'en-US';
  utterance.rate = Number(rate) || 0.9;
  currentUtterance = utterance;
  articleSpeaking = true;
  articlePaused = false;
  utterance.onend = () => {
    if (currentUtterance !== utterance) return;
    currentUtterance = null; articleSpeaking = false; articlePaused = false; onend?.();
  };
  utterance.onerror = () => {
    if (currentUtterance !== utterance) return;
    currentUtterance = null; articleSpeaking = false; articlePaused = false; onerror?.();
  };
  window.speechSynthesis.speak(utterance);
  return true;
}
export function pauseArticle() { if (articleSpeaking) { window.speechSynthesis.pause(); articlePaused = true; } }
export function resumeArticle() { if (articleSpeaking) { window.speechSynthesis.resume(); articlePaused = false; } }
export function stopArticle() { window.speechSynthesis?.cancel(); currentUtterance = null; articleSpeaking = false; articlePaused = false; }
export function isArticleSpeaking() { return articleSpeaking; }
export function isArticlePaused() { return articlePaused; }
