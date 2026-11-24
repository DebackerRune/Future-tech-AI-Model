import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Feeds the visually hidden aria-live regions. Every spoken message also goes here,
 * so screen-reader users get it even when the app's own speech is off.
 */
export const useAnnouncer = defineStore('announcer', () => {
  const assertive = ref('')
  const polite = ref('')
  const last = ref('')

  function set(target: typeof assertive, text: string) {
    // Clear first so the same text is announced again when repeated.
    target.value = ''
    setTimeout(() => (target.value = text), 60)
  }

  function announce(text: string, politeness: 'assertive' | 'polite' = 'assertive') {
    last.value = text
    set(politeness === 'assertive' ? assertive : polite, text)
  }

  return { assertive, polite, last, announce }
})
