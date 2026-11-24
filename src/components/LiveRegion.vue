<script setup lang="ts">
import { useAnnouncer } from '@/stores/announcer'

const announcer = useAnnouncer()
</script>

<template>
  <!-- Every spoken message also lands here so screen readers announce it. -->
  <div class="sr-only" role="status" aria-live="assertive" aria-atomic="true">{{ announcer.assertive }}</div>
  <div class="sr-only" aria-live="polite" aria-atomic="true">{{ announcer.polite }}</div>
</template>
