import { onBeforeUnmount, ref } from 'vue'
import { parseCommand, type Intent } from '@/lib/commands'

const Ctor = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined

/**
 * Voice commands via the Web Speech API (nl-BE). Opt-in: nothing listens until `start()` or `once()`.
 * Note: in Chrome the audio is processed by Google's speech service (disclosed in the app).
 */
export function useRecognition(onIntent: (intent: Intent, transcript: string) => void) {
  const supported = Boolean(Ctor)
  const listening = ref(false)
  const error = ref<string | null>(null)
  let rec: SpeechRecognition | null = null
  let continuous = false
  let restartTimer: ReturnType<typeof setTimeout> | undefined

  function create(): SpeechRecognition | null {
    if (!Ctor) return null
    const r = new Ctor()
    r.lang = 'nl-BE'
    r.continuous = true
    r.interimResults = false
    r.maxAlternatives = 3
    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i]
        if (!result.isFinal) continue
        // try every alternative; the first one that is a command wins
        for (let a = 0; a < result.length; a++) {
          const intent = parseCommand(result[a].transcript)
          if (intent) {
            onIntent(intent, result[a].transcript)
            if (!continuous) r.stop()
            return
          }
        }
      }
    }
    r.onerror = (ev) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        error.value = 'denied'
        continuous = false
      } else if (ev.error !== 'no-speech' && ev.error !== 'aborted') {
        error.value = ev.error
      }
    }
    r.onend = () => {
      listening.value = false
      // Browsers end recognition after silence; restart while the user wants to keep listening.
      if (continuous && document.visibilityState === 'visible') {
        restartTimer = setTimeout(() => begin(), 300)
      }
    }
    return r
  }

  function begin() {
    rec ??= create()
    if (!rec) return
    try {
      rec.start()
      listening.value = true
      error.value = null
    } catch {
      /* already started */
    }
  }

  /** Keep listening for commands until `stop()`. */
  function start() {
    continuous = true
    begin()
  }

  /** Push-to-talk: listen for one command. */
  function once() {
    continuous = false
    begin()
  }

  function stop() {
    continuous = false
    clearTimeout(restartTimer)
    try {
      rec?.abort()
    } catch {
      /* not running */
    }
    listening.value = false
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      clearTimeout(restartTimer)
      try {
        rec?.abort()
      } catch {
        /* ignore */
      }
    } else if (continuous && !listening.value) {
      begin()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stop()
  })

  return { supported, listening, error, start, once, stop, wantsListening: () => continuous }
}
