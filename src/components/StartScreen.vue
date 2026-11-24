<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { nl } from '@/i18n/nl'
import { useSettings } from '@/stores/settings'
import { useSpeech } from '@/composables/useSpeech'
import { useAnnouncer } from '@/stores/announcer'

/**
 * Shown on every launch. Browsers do not allow a page to speak before the user has touched it,
 * so the whole screen is one button. How it is tapped decides who talks (see useVoiceGuide):
 * a finger → the app speaks itself; a TalkBack/VoiceOver double-tap → the screen reader does.
 */
const emit = defineEmits<{ done: [] }>()
const settings = useSettings()
const speech = useSpeech()
const announcer = useAnnouncer()
const startBtn = ref<HTMLButtonElement | null>(null)

onMounted(async () => {
  await nextTick()
  startBtn.value?.focus()
})

function start() {
  // settings.appSpeech was just set by the click detection in useVoiceGuide.
  if (settings.appSpeech) speech.say(settings.onboardingDone ? nl.intro.short : nl.intro.full)
  else announcer.announce(nl.intro.screenReader)
  settings.onboardingDone = true
  emit('done')
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex flex-col bg-bg p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
    <button
      ref="startBtn"
      type="button"
      data-start
      data-direct
      class="flex flex-1 flex-col items-center justify-center gap-6 rounded-[2rem] border-4 border-accent bg-accent p-6 text-center text-accent-fg"
      @click="start"
    >
      <span class="grid size-24 place-items-center rounded-3xl bg-accent-fg text-6xl font-bold text-accent" aria-hidden="true">€</span>
      <span class="text-4xl font-bold">{{ nl.start.title }}</span>
      <span class="text-2xl leading-snug font-bold">{{ nl.start.tap }}</span>
      <span class="text-lg">{{ nl.start.hint }}</span>
    </button>
  </div>
</template>
