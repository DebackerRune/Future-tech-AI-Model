<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { nl } from '@/i18n/nl'
import type { Intent } from '@/lib/commands'
import { euroWords } from '@/lib/numberWords'
import { useScanner } from '@/composables/useScanner'
import { useRecognition } from '@/composables/useRecognition'
import { useEarcons } from '@/composables/useEarcons'
import BigAskButton from '@/components/BigAskButton.vue'
import ToggleButton from '@/components/ToggleButton.vue'
import ConfidenceBars from '@/components/ConfidenceBars.vue'
import AppIcon from '@/components/AppIcon.vue'

const big = ref<InstanceType<typeof BigAskButton> | null>(null)
const videoEl = computed(() => big.value?.video ?? null)
const scanner = useScanner(videoEl)
const earcons = useEarcons()

const recognition = useRecognition(onIntent)

async function onIntent(intent: Intent) {
  switch (intent) {
    case 'ask':
      return scanner.ask()
    case 'repeat':
      return scanner.repeat()
    case 'total':
      return scanner.sayTotal()
    case 'resetTotal':
      return scanner.resetTotal()
    case 'countingOn':
      return scanner.setCounting(true)
    case 'countingOff':
      return scanner.setCounting(false)
    case 'continuousOn':
      return scanner.setContinuous(true)
    case 'continuousOff':
      return scanner.setContinuous(false)
    case 'torchOn':
      return scanner.setTorch(true)
    case 'torchOff':
      return scanner.setTorch(false)
    case 'help':
      return scanner.say(nl.voiceHelp)
    case 'stop':
      if (scanner.continuous.value) await scanner.setContinuous(false)
      scanner.stopAll()
      return
  }
}

function toggleListening(on: boolean) {
  if (on) {
    recognition.start()
    earcons.play('listen')
    scanner.say(nl.toggles.listeningOn)
  } else {
    recognition.stop()
    scanner.say(nl.toggles.listeningOff)
  }
}

function pushToTalk() {
  if (!recognition.supported) {
    scanner.say(nl.errors.voiceUnsupported)
    return
  }
  earcons.play('listen')
  recognition.once()
}

const showTotal = computed(() => scanner.counting.value || scanner.total.value > 0)

onMounted(async () => {
  await nextTick()
  big.value?.button?.focus()
})
</script>

<template>
  <h1 id="page-title" tabindex="-1" class="sr-only">{{ nl.titles.scan }}</h1>

  <!-- Last answer, large; the same text is spoken and sent to the screen reader -->
  <div
    class="mb-3 flex items-start gap-3 rounded-3xl border border-line bg-surface p-4 sm:mb-4 sm:p-5 short:mb-2 short:p-3"
    :aria-busy="scanner.busy.value ? 'true' : 'false'"
  >
    <span class="mt-0.5 text-accent" aria-hidden="true"><AppIcon name="speaker" :size="24" /></span>
    <p class="text-lg leading-snug font-bold sm:text-2xl short:text-lg">{{ scanner.resultText.value }}</p>
  </div>

  <BigAskButton
    ref="big"
    :busy="scanner.busy.value"
    :camera-on="scanner.camera.active.value"
    :voice-supported="recognition.supported"
    @ask="scanner.ask()"
    @longpress="pushToTalk"
  />

  <div v-if="showTotal" class="card mt-4 flex items-center justify-between">
    <p class="eyebrow">{{ nl.scan.totalLabel }}</p>
    <p class="text-4xl font-bold tabular-nums">
      <span aria-hidden="true">€ {{ scanner.total.value }}</span>
      <span class="sr-only">{{ euroWords(scanner.total.value) }}</span>
    </p>
  </div>

  <section aria-labelledby="controls-title" class="mt-6">
    <h2 id="controls-title" class="eyebrow mb-3">{{ nl.scan.controls }}</h2>
    <div class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
      <button type="button" class="btn w-full justify-start" @click="scanner.repeat()">
        <AppIcon name="repeat" />
        {{ nl.scan.repeat }}
      </button>
      <ToggleButton
        v-if="recognition.supported"
        icon="mic"
        :label="nl.scan.listening"
        :pressed="recognition.listening.value || recognition.wantsListening()"
        @toggle="toggleListening"
      />
      <ToggleButton icon="plus" :label="nl.scan.counting" :pressed="scanner.counting.value" @toggle="scanner.setCounting" />
      <ToggleButton icon="auto" :label="nl.scan.continuous" :pressed="scanner.continuous.value" @toggle="scanner.setContinuous" />
      <ToggleButton
        v-if="scanner.camera.torchAvailable.value"
        icon="torch"
        :label="nl.scan.torch"
        :pressed="scanner.camera.torchOn.value"
        @toggle="scanner.setTorch"
      />
      <button v-if="showTotal" type="button" class="btn btn-danger w-full justify-start" @click="scanner.resetTotal()">
        <AppIcon name="trash" />
        {{ scanner.resetArmed.value ? nl.toggles.resetConfirm : nl.scan.resetTotal }}
      </button>
    </div>
    <p v-if="!recognition.supported" class="mt-3 text-base text-muted">{{ nl.errors.voiceUnsupported }}</p>
    <p v-else-if="recognition.error.value === 'denied'" role="alert" class="mt-3 font-bold text-danger">
      {{ nl.errors.voiceDenied }}
    </p>
  </section>

  <ConfidenceBars :predictions="scanner.perClass.value" />
</template>
