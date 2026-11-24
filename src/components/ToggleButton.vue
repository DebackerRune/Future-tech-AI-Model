<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

defineProps<{ label: string; pressed: boolean; icon?: IconName; disabled?: boolean }>()
defineEmits<{ toggle: [value: boolean] }>()
</script>

<template>
  <!-- aria-pressed tells screen readers whether the option is on ("ingedrukt"). -->
  <button
    type="button"
    class="btn w-full justify-start text-left"
    :aria-label="label"
    :aria-pressed="pressed ? 'true' : 'false'"
    :disabled="disabled"
    @click="$emit('toggle', !pressed)"
  >
    <AppIcon v-if="icon" :name="icon" />
    <span class="flex-1">{{ label }}</span>
    <span
      class="rounded-full px-2 py-0.5 text-sm font-bold"
      :class="pressed ? 'bg-accent-fg text-accent' : 'bg-surface-2 text-muted'"
      aria-hidden="true"
    >
      {{ pressed ? 'aan' : 'uit' }}
    </span>
  </button>
</template>
