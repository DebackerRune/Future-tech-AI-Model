<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { nl } from '@/i18n/nl'
import { useSettings } from '@/stores/settings'
import { useSpeech } from '@/composables/useSpeech'
import AppIcon from './AppIcon.vue'

const emit = defineEmits<{ done: [] }>()
const settings = useSettings()
const speech = useSpeech()

const dialog = ref<HTMLDialogElement | null>(null)
const heading = ref<HTMLHeadingElement | null>(null)
const step = ref(0)
const steps = nl.onboarding.steps
const last = computed(() => step.value === steps.length - 1)

onMounted(async () => {
  dialog.value?.showModal?.()
  await nextTick()
  heading.value?.focus()
})

async function show(i: number) {
  step.value = i
  await nextTick()
  heading.value?.focus()
  // A button press counts as user activation, so speech is allowed here.
  speech.speakOnly(steps[i])
}

function finish(appSpeech?: boolean) {
  if (appSpeech !== undefined) settings.appSpeech = appSpeech
  speech.stop()
  dialog.value?.close?.()
  emit('done')
}
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="onb-title"
    aria-describedby="onb-text"
    class="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-auto rounded-[2rem] border-2 border-accent bg-bg p-6 text-fg backdrop:bg-black/85"
    @cancel.prevent="finish()"
  >
    <div class="mb-4 flex items-center gap-3">
      <span class="grid size-12 place-items-center rounded-2xl bg-accent text-2xl font-bold text-accent-fg" aria-hidden="true">€</span>
      <h2 id="onb-title" ref="heading" tabindex="-1" class="text-2xl font-bold">{{ nl.onboarding.title }}</h2>
    </div>

    <p class="eyebrow">{{ nl.onboarding.step(step + 1, steps.length) }}</p>
    <!-- Progress dots (decorative; the step text above says the same) -->
    <div class="mt-2 flex gap-1.5" aria-hidden="true">
      <span
        v-for="(_, i) in steps"
        :key="i"
        class="h-2 flex-1 rounded-full"
        :class="i <= step ? 'bg-accent' : 'bg-surface-2'"
      ></span>
    </div>

    <p id="onb-text" class="mt-5 text-xl leading-relaxed">{{ steps[step] }}</p>

    <div v-if="!last" class="mt-6 grid gap-3">
      <button type="button" class="btn btn-primary" @click="show(step + 1)">{{ nl.onboarding.next }}</button>
      <button type="button" class="btn" @click="finish()">{{ nl.onboarding.skip }}</button>
    </div>
    <div v-else class="mt-6 grid gap-3">
      <button type="button" class="btn btn-primary" @click="finish(true)">
        <AppIcon name="speaker" />
        {{ nl.settings.speechApp }}
      </button>
      <button type="button" class="btn" @click="finish(false)">{{ nl.settings.speechReader }}</button>
    </div>
  </dialog>
</template>
