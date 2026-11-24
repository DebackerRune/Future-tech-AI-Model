<script setup lang="ts">
import { ref } from 'vue'
import { nl } from '@/i18n/nl'
import AppIcon from './AppIcon.vue'

defineProps<{ busy: boolean; cameraOn: boolean; voiceSupported: boolean }>()
const emit = defineEmits<{ ask: []; longpress: [] }>()

const button = ref<HTMLButtonElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
defineExpose({ button, video })

// Long press (≥ 600 ms) = push-to-talk; a normal tap = ask.
let timer: ReturnType<typeof setTimeout> | undefined
let longPressed = false

function onPointerDown() {
  longPressed = false
  timer = setTimeout(() => {
    longPressed = true
    emit('longpress')
  }, 600)
}
function cancel() {
  clearTimeout(timer)
}
function onClick() {
  cancel()
  if (longPressed) {
    longPressed = false
    return
  }
  emit('ask')
}
</script>

<template>
  <button
    id="ask-button"
    ref="button"
    type="button"
    :aria-label="busy ? nl.scan.asking : nl.scan.askButton"
    :aria-describedby="voiceSupported ? 'ask-hint' : undefined"
    :aria-busy="busy ? 'true' : 'false'"
    class="group relative flex min-h-[max(16rem,42dvh)] w-full short:min-h-[58dvh] touch-manipulation flex-col overflow-hidden rounded-[2rem] border-4 border-accent bg-surface text-left select-none [-webkit-touch-callout:none]"
    @click="onClick"
    @pointerdown="onPointerDown"
    @pointerup="cancel"
    @pointerleave="cancel"
    @pointercancel="cancel"
    @contextmenu.prevent
  >
    <!-- Camera preview for sighted helpers; hidden from screen readers. Frames stay in memory. -->
    <video
      ref="video"
      class="absolute inset-0 size-full object-cover transition-opacity"
      :class="cameraOn ? 'opacity-100' : 'opacity-0'"
      playsinline
      muted
      aria-hidden="true"
      tabindex="-1"
    ></video>

    <!-- Viewfinder corners: shows where to hold the note -->
    <span class="pointer-events-none absolute inset-x-0 top-0 bottom-24 grid place-items-center p-6 sm:bottom-28 short:bottom-16 short:p-3" aria-hidden="true">
      <span
        class="relative aspect-[2/1] w-[80%] max-w-80 rounded-3xl border-4 border-dashed transition-colors"
        :class="busy ? 'border-accent animate-pulse' : 'border-fg/50'"
      ></span>
    </span>

    <span
      v-if="!cameraOn"
      class="pointer-events-none absolute inset-x-0 top-0 bottom-24 grid place-items-center text-muted sm:bottom-28 short:bottom-16"
      aria-hidden="true"
    >
      <AppIcon name="scan" :size="40" />
    </span>

    <span
      class="relative mt-auto flex items-center gap-3 bg-accent px-5 py-4 text-2xl leading-tight font-bold text-accent-fg group-hover:bg-accent-strong sm:px-6 sm:py-5 sm:text-3xl short:py-3 short:text-2xl"
    >
      <AppIcon :name="busy ? 'auto' : 'speaker'" :size="28" />
      {{ busy ? nl.scan.asking : nl.scan.askButton }}
    </span>
  </button>
  <p v-if="voiceSupported" id="ask-hint" class="mt-2 flex items-center gap-2 text-base text-muted">
    <AppIcon name="mic" :size="18" />
    {{ nl.scan.askHint }}
  </p>
</template>
