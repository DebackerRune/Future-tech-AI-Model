<script setup lang="ts">
import { ref } from 'vue'
import { nl } from '@/i18n/nl'
import { ANSWER_THRESHOLD } from '@/lib/decide'
import { useSettings } from '@/stores/settings'
import { usePoints } from '@/stores/points'
import { useSpeech } from '@/composables/useSpeech'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettings()
const points = usePoints()
const speech = useSpeech()
const deleteArmed = ref(false)
const deleting = ref(false)

async function deleteData() {
  if (!deleteArmed.value) {
    deleteArmed.value = true
    speech.say(nl.settings.deleteConfirm)
    setTimeout(() => (deleteArmed.value = false), 8000)
    return
  }
  deleting.value = true
  try {
    await points.deleteAll()
    speech.say(nl.settings.deleteDone)
  } finally {
    deleting.value = false
    deleteArmed.value = false
  }
}

function restartOnboarding() {
  speech.say(nl.intro.full)
}

/** Sliders are not tapped twice; just say the new value. */
function sayValue(text: string) {
  if (settings.appSpeech) speech.say(text)
}

const choice =
  'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-line px-4 text-lg has-[:checked]:border-accent has-[:checked]:bg-surface-2'
</script>

<template>
  <h1 id="page-title" tabindex="-1" class="mb-4 text-3xl font-bold">{{ nl.titles.settings }}</h1>

  <div class="space-y-4">
    <section class="card" aria-labelledby="s-speech">
      <h2 id="s-speech" class="mb-4 text-xl font-bold">{{ nl.settings.speechSection }}</h2>

      <div>
        <label class="flex justify-between font-bold" for="rate">
          <span>{{ nl.settings.rate }}</span>
          <span class="tabular-nums">{{ settings.rate.toFixed(1) }}×</span>
        </label>
        <input
          id="rate"
          v-model.number="settings.rate"
          type="range"
          min="0.7"
          max="1.5"
          step="0.1"
          :aria-valuetext="settings.rate.toFixed(1)"
          class="mt-2 h-12 w-full accent-accent"
          @change="sayValue(`${nl.settings.rate} ${settings.rate.toFixed(1)}`)"
        />
      </div>

      <div class="mt-4">
        <label class="flex justify-between font-bold" for="volume">
          <span>{{ nl.settings.volume }}</span>
          <span class="tabular-nums">{{ Math.round(settings.volume * 100) }}%</span>
        </label>
        <input
          id="volume"
          v-model.number="settings.volume"
          type="range"
          min="0.2"
          max="1"
          step="0.1"
          :aria-valuetext="`${Math.round(settings.volume * 100)} procent`"
          class="mt-2 h-12 w-full accent-accent"
          @change="sayValue(`${nl.settings.volume} ${Math.round(settings.volume * 100)} procent`)"
        />
      </div>
    </section>

    <section class="card" aria-labelledby="s-feedback">
      <h2 id="s-feedback" class="mb-4 text-xl font-bold">{{ nl.settings.feedbackSection }}</h2>
      <div class="space-y-2">
        <label :class="choice">
          <input v-model="settings.sounds" type="checkbox" class="size-6 accent-accent" />
          {{ nl.settings.sounds }}
        </label>
        <label :class="choice">
          <input v-model="settings.vibration" type="checkbox" aria-describedby="vib-hint" class="size-6 accent-accent" />
          {{ nl.settings.vibration }}
        </label>
      </div>
      <p id="vib-hint" class="mt-3 text-base text-muted">{{ nl.settings.vibrationHint }}</p>
    </section>

    <section class="card" aria-labelledby="s-display">
      <h2 id="s-display" class="mb-4 text-xl font-bold">{{ nl.settings.displaySection }}</h2>
      <fieldset class="min-w-0 space-y-2">
        <legend class="mb-2 font-bold">{{ nl.settings.theme }}</legend>
        <label :class="choice">
          <input v-model="settings.theme" type="radio" name="theme" value="dark" class="size-6 accent-accent" />
          {{ nl.settings.themeDark }}
        </label>
        <label :class="choice">
          <input v-model="settings.theme" type="radio" name="theme" value="light" class="size-6 accent-accent" />
          {{ nl.settings.themeLight }}
        </label>
      </fieldset>
    </section>

    <section class="card" aria-labelledby="s-recog">
      <h2 id="s-recog" class="mb-2 text-xl font-bold">{{ nl.settings.recognitionSection }}</h2>
      <p>{{ nl.settings.threshold(Math.round(ANSWER_THRESHOLD * 100)) }}</p>
      <button type="button" data-direct class="btn mt-4 w-full" @click="restartOnboarding">{{ nl.settings.onboarding }}</button>
    </section>

    <section class="card" aria-labelledby="s-data">
      <h2 id="s-data" class="mb-2 text-xl font-bold">{{ nl.settings.dataSection }}</h2>
      <p class="flex items-center gap-2 text-base text-muted">
        <AppIcon name="shield" :size="18" />
        {{ points.cloud ? nl.settings.storedCloud : nl.settings.storedLocal }}
      </p>
      <button type="button" data-direct class="btn btn-danger mt-4 w-full" :disabled="deleting" @click="deleteData">
        <AppIcon name="trash" />
        {{ deleteArmed ? nl.settings.deleteConfirm : nl.settings.deleteData }}
      </button>
    </section>
  </div>
</template>
