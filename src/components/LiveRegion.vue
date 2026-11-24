<script setup lang="ts">
import { useAnnouncer } from '@/stores/announcer'

const announcer = useAnnouncer()
</script>

<template>
  <!--
    Every spoken message also lands here so screen readers (TalkBack, VoiceOver) announce it.
    Both regions exist from page load (screen readers ignore regions that appear later) and
    have no conflicting role, so TalkBack treats "assertive" as assertive.
  -->
  <div class="sr-only" aria-live="assertive" aria-atomic="true">{{ announcer.assertive }}</div>
  <div class="sr-only" aria-live="polite" aria-atomic="true">{{ announcer.polite }}</div>
</template>
