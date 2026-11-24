<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { nl } from '@/i18n/nl'
import { useSettings } from '@/stores/settings'
import { usePoints } from '@/stores/points'
import { useVoiceGuide } from '@/composables/useVoiceGuide'
import LiveRegion from '@/components/LiveRegion.vue'
import BottomNav from '@/components/BottomNav.vue'
import StartScreen from '@/components/StartScreen.vue'

const settings = useSettings()
const points = usePoints()

// Start screen on every launch for people who let the app speak (speech needs one tap first),
// and once for everyone so screen-reader users can choose their mode.
const showStart = ref(settings.appSpeech || !settings.onboardingDone)

useVoiceGuide()

onMounted(() => {
  void points.init()
})

async function started() {
  showStart.value = false
  await nextTick()
  const target = document.getElementById('ask-button') ?? document.getElementById('page-title')
  target?.focus()
}
</script>

<template>
  <div class="flex min-h-dvh flex-col" :inert="showStart || undefined">
    <a
      class="absolute -top-40 left-4 z-50 rounded-xl bg-accent px-4 py-3 font-bold text-accent-fg no-underline focus:top-4"
      href="#main"
    >
      {{ nl.skipLink }}
    </a>

    <header
      class="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] short:hidden"
    >
      <span class="grid size-9 place-items-center rounded-xl bg-accent text-xl font-bold text-accent-fg" aria-hidden="true">€</span>
      <p class="text-xl font-bold tracking-tight">{{ nl.appName }}</p>
    </header>

    <main
      id="main"
      tabindex="-1"
      class="mx-auto w-full max-w-xl flex-1 px-4 pt-3 pb-32 sm:pt-4 short:max-w-3xl short:px-[max(1rem,env(safe-area-inset-left))] short:pt-2 short:pb-20"
    >
      <RouterView />
    </main>

    <BottomNav />
  </div>
  <LiveRegion />
  <StartScreen v-if="showStart" @done="started" />
</template>
