<script setup lang="ts">
import { nl } from '@/i18n/nl'
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <h1 id="page-title" tabindex="-1" class="mb-4 text-3xl font-bold">{{ nl.titles.help }}</h1>

  <section class="card" aria-labelledby="h-how">
    <h2 id="h-how" class="mb-4 text-xl font-bold">{{ nl.help.howTitle }}</h2>
    <ol class="space-y-4">
      <li v-for="(s, i) in nl.help.how" :key="s" class="flex gap-4">
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-fg" aria-hidden="true">
          {{ i + 1 }}
        </span>
        <span>{{ s }}</span>
      </li>
    </ol>
  </section>

  <section class="mt-4" aria-labelledby="h-voice">
    <h2 id="h-voice" class="mb-2 flex items-center gap-2 text-xl font-bold">
      <AppIcon name="mic" />
      {{ nl.help.voiceTitle }}
    </h2>
    <p class="mb-3">{{ nl.help.voiceIntro }}</p>
    <dl class="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
      <div v-for="[phrase, meaning] in nl.commandList" :key="phrase" class="px-5 py-3">
        <dt class="text-lg font-bold">“{{ phrase }}”</dt>
        <dd class="text-muted">{{ meaning }}</dd>
      </div>
    </dl>
  </section>

  <section class="card mt-4" aria-labelledby="h-privacy">
    <h2 id="h-privacy" class="mb-3 flex items-center gap-2 text-xl font-bold">
      <AppIcon name="shield" />
      {{ nl.help.privacyTitle }}
    </h2>
    <ul class="list-disc space-y-2 pl-6">
      <li v-for="p in nl.help.privacy" :key="p">{{ p }}</li>
    </ul>
  </section>

  <section class="mt-4 rounded-3xl border-2 border-danger p-5" aria-labelledby="h-warn">
    <h2 id="h-warn" class="mb-2 text-xl font-bold">{{ nl.help.disclaimerTitle }}</h2>
    <p>{{ nl.help.disclaimer }}</p>
  </section>
</template>
