import { defineStore } from 'pinia'
import { reactive, toRefs, watch } from 'vue'
import { readJson, writeJson } from '@/lib/storage'

export type Theme = 'dark' | 'light'

export interface Settings {
  /** true: the app speaks (TTS); false: only aria-live for the user's own screen reader */
  appSpeech: boolean
  rate: number
  volume: number
  voiceURI: string
  sounds: boolean
  vibration: boolean
  theme: Theme
  onboardingDone: boolean
}

const KEY = 'geldscan.settings.v1'
export const DEFAULT_SETTINGS: Settings = {
  appSpeech: true,
  rate: 1,
  volume: 1,
  voiceURI: '',
  sounds: true,
  vibration: true,
  theme: 'dark',
  onboardingDone: false,
}

export const useSettings = defineStore('settings', () => {
  const state = reactive<Settings>(readJson(KEY, DEFAULT_SETTINGS))
  watch(state, (s) => writeJson(KEY, s), { deep: true })
  watch(
    () => state.theme,
    (t) => document.documentElement.setAttribute('data-theme', t),
    { immediate: true },
  )
  return { ...toRefs(state) }
})
