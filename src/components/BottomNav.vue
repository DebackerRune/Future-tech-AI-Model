<script setup lang="ts">
import { nl } from '@/i18n/nl'
import AppIcon, { type IconName } from './AppIcon.vue'

const links: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: nl.nav.scan, icon: 'scan' },
  { to: '/instellingen', label: nl.nav.settings, icon: 'settings' },
  { to: '/hulp', label: nl.nav.help, icon: 'help' },
]
</script>

<template>
  <nav
    :aria-label="nl.nav.label"
    class="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur short:pt-1 short:pb-[max(0.25rem,env(safe-area-inset-bottom))]"
  >
    <ul class="mx-auto grid max-w-xl grid-cols-3 gap-1.5">
      <li v-for="l in links" :key="l.to">
        <RouterLink
          :to="l.to"
          active-class=""
          exact-active-class="!bg-accent !text-accent-fg"
          class="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-sm leading-tight font-bold short:min-h-12 short:flex-row short:gap-2 text-fg no-underline hover:bg-surface-2"
        >
          <AppIcon :name="l.icon" :size="22" />
          {{ l.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
