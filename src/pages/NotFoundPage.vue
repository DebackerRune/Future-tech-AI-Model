<script setup lang="ts">
import { nl } from '@/i18n/nl'
</script>

<template>
  <h1 id="page-title" tabindex="-1" class="mb-4 text-3xl font-bold">{{ nl.titles.notFound }}</h1>
  <p class="mb-6">{{ nl.notFound }}</p>
  <RouterLink to="/" class="btn btn-primary w-full">{{ nl.backHome }}</RouterLink>
</template>
