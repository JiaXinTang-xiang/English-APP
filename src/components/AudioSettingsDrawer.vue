<script setup>
import { keyboardSoundOptions } from '../services/audio';
import { useLearningStore } from '../stores/learning';

defineProps({ open: Boolean });
const emit = defineEmits(['close']);
const { audio, updateAudio, previewKeySound, previewWordSound, previewAnswerSound } = useLearningStore();
</script>

<template>
  <div v-if="open" class="settings-backdrop" @click.self="emit('close')">
    <aside class="settings-drawer" aria-label="训练设置">
      <header><div><p class="eyebrow">TRAINING SETTINGS</p><h2>训练设置</h2></div><button class="icon-button" title="关闭" @click="emit('close')">×</button></header>

      <section class="drawer-section"><h3>单词发音</h3>
        <label class="setting-row"><span>启用单词发音<small>优先使用有道真实发音</small></span><input v-model="audio.wordAudio" type="checkbox" @change="updateAudio"></label>
        <label class="setting-row"><span>自动播放<small>切换单词时自动朗读</small></span><input v-model="audio.auto" type="checkbox" @change="updateAudio"></label>
        <label class="setting-row"><span>口音</span><select v-model="audio.accent" @change="updateAudio"><option value="us">美音</option><option value="uk">英音</option></select></label>
        <label class="setting-slider"><span>单词音量</span><input v-model.number="audio.wordVolume" type="range" min="0" max="100" step="5" @change="updateAudio"><output>{{ audio.wordVolume }}%</output></label>
        <label class="setting-slider"><span>发音速度</span><input v-model.number="audio.rate" type="range" min="0.5" max="4" step="0.1" @change="updateAudio"><output>{{ Number(audio.rate).toFixed(1) }}x</output></label>
        <label class="setting-row"><span>循环发音</span><input v-model="audio.loop" type="checkbox" @change="updateAudio"></label>
        <button class="drawer-preview" @click="previewWordSound">试听单词</button>
      </section>

      <section class="drawer-section"><h3>显示与释义</h3>
        <label class="setting-row"><span>显示音标</span><input v-model="audio.phonetic" type="checkbox" @change="updateAudio"></label>
        <label class="setting-row"><span>朗读中文释义<small>使用系统中文语音</small></span><input v-model="audio.translationSpeech" type="checkbox" @change="updateAudio"></label>
      </section>

      <section class="drawer-section"><h3>按键声音</h3>
        <label class="setting-row"><span>启用按键音</span><input v-model="audio.keyboard" type="checkbox" @change="updateAudio"></label>
        <label class="setting-row"><span>声音类型</span><select v-model="audio.keyboardSound" @change="updateAudio"><option v-for="name in keyboardSoundOptions" :key="name" :value="name">{{ name }}</option></select></label>
        <label class="setting-slider"><span>按键音量</span><input v-model.number="audio.keyboardVolume" type="range" min="0" max="100" step="5" @change="updateAudio"><output>{{ audio.keyboardVolume }}%</output></label>
        <button class="drawer-preview" @click="previewKeySound">试听键盘音</button>
      </section>

      <section class="drawer-section"><h3>答题反馈</h3>
        <label class="setting-row"><span>启用反馈音</span><input v-model="audio.feedback" type="checkbox" @change="updateAudio"></label>
        <label class="setting-slider"><span>效果音量</span><input v-model.number="audio.feedbackVolume" type="range" min="0" max="100" step="5" @change="updateAudio"><output>{{ audio.feedbackVolume }}%</output></label>
        <div class="drawer-preview-row"><button class="drawer-preview" @click="previewAnswerSound('correct')">试听答对</button><button class="drawer-preview" @click="previewAnswerSound('wrong')">试听答错</button></div>
      </section>
    </aside>
  </div>
</template>
