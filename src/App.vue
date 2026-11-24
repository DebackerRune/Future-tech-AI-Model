<script setup lang="ts">
import { onMounted } from 'vue'
import { nl } from '@/i18n/nl'
import { useSettings } from '@/stores/settings'
import { usePoints } from '@/stores/points'
import LiveRegion from '@/components/LiveRegion.vue'
import BottomNav from '@/components/BottomNav.vue'
import OnboardingDialog from '@/components/OnboardingDialog.vue'

const settings = useSettings()
const points = usePoints()

onMounted(() => {
  void points.init()
})
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      class="absolute -top-40 left-4 z-50 rounded-xl bg-accent px-4 py-3 font-bold text-accent-fg no-underline focus:top-4"
      href="#main"
    >
      {{ nl.skipLink }}
    </a>

    <header class="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] short:hidden">
      <span class="grid size-9 place-items-center rounded-xl bg-accent text-xl font-bold text-accent-fg" aria-hidden="true">€</span>
      <p class="text-xl font-bold tracking-tight">{{ nl.appName }}</p>
    </header>

    <main id="main" tabindex="-1" class="mx-auto w-full max-w-xl flex-1 px-4 pt-3 pb-32 sm:pt-4 short:max-w-3xl short:px-[max(1rem,env(safe-area-inset-left))] short:pt-2 short:pb-20">
      <RouterView />
    </main>

    <BottomNav />
    <LiveRegion />
    <OnboardingDialog v-if="!settings.onboardingDone" @done="settings.onboardingDone = true" />
  </div>
</template>
