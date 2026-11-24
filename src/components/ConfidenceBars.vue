<script setup lang="ts">
import { nl } from '@/i18n/nl'
import type { ClassPrediction } from '@/lib/aggregate'
import { ANSWER_THRESHOLD } from '@/lib/decide'

defineProps<{ predictions: ClassPrediction[] }>()
const pct = (p: number) => Math.round(p * 100)
</script>

<template>
  <details class="card mt-6">
    <summary class="flex min-h-11 cursor-pointer items-center font-bold">{{ nl.scan.confidenceTitle }}</summary>
    <p v-if="!predictions.length" class="mt-2 text-muted">—</p>
    <ul v-else class="mt-3 space-y-3">
      <li v-for="p in predictions" :key="p.className">
        <!-- Text for everyone; the bar itself is decorative. -->
        <span class="flex justify-between text-base">
          <span>{{ p.className }}</span>
          <span class="font-bold tabular-nums">{{ pct(p.probability) }}%</span>
        </span>
        <span class="mt-1 block h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <span
            class="block h-full rounded-full transition-[width]"
            :class="p.probability >= ANSWER_THRESHOLD ? 'bg-accent' : 'bg-muted'"
            :style="{ width: pct(p.probability) + '%' }"
          ></span>
        </span>
      </li>
    </ul>
  </details>
</template>
