<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { isArticleSpeaking, pauseArticle, resumeArticle, speakArticle, stopArticle } from '../services/articleAudio';

const props = defineProps({ paragraphs: { type: Array, default: () => [] } });
const playing = ref(false);
const paused = ref(false);
const index = ref(0);
const rate = ref(0.9);
const currentText = computed(() => props.paragraphs[index.value] || '');

function speakCurrent() {
  if (!currentText.value) return;
  const started = speakArticle(currentText.value, {
    rate: rate.value,
    onend: () => {
    if (index.value < props.paragraphs.length - 1) { index.value += 1; speakCurrent(); }
    else { playing.value = false; paused.value = false; }
    },
    onerror: () => { playing.value = false; paused.value = false; }
  });
  if (started) { playing.value = true; paused.value = false; }
}
function play() { if (paused.value && isArticleSpeaking()) { resumeArticle(); paused.value = false; playing.value = true; } else speakCurrent(); }
function pause() { if (!playing.value) return; pauseArticle(); paused.value = true; }
function stop() { stopArticle(); playing.value = false; paused.value = false; index.value = 0; }
function previous() { index.value = Math.max(0, index.value - 1); if (playing.value) speakCurrent(); }
function next() { index.value = Math.min(props.paragraphs.length - 1, index.value + 1); if (playing.value) speakCurrent(); }
onBeforeUnmount(stop);
</script>

<template>
  <div class="article-audio"><div class="article-audio-main"><button class="primary audio-control" @click="playing && !paused ? pause() : play()">{{ playing && !paused ? '暂停' : '播放文章' }}</button><button class="secondary audio-control" :disabled="!playing && index === 0" @click="previous">上一段</button><button class="secondary audio-control" :disabled="!playing && index >= paragraphs.length - 1" @click="next">下一段</button><button class="secondary audio-control" :disabled="!playing && index === 0" @click="stop">停止</button></div><div class="article-audio-meta"><span>第 {{ Math.min(index + 1, paragraphs.length) }}/{{ paragraphs.length }} 段</span><label>速度<select v-model="rate"><option :value="0.7">0.7×</option><option :value="0.9">0.9×</option><option :value="1">1×</option><option :value="1.2">1.2×</option></select></label></div><p class="hint">使用手机或浏览器英文语音朗读；可按段落播放。</p></div>
</template>
