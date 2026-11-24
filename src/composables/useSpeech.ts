import { ref } from 'vue'
import { useSettings } from '@/stores/settings'
import { useAnnouncer } from '@/stores/announcer'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
const voices = ref<SpeechSynthesisVoice[]>([])
let currentPriority: 'high' | 'normal' | null = null

function loadVoices() {
  if (!supported) return
  voices.value = speechSynthesis
    .getVoices()
    .filter((v) => v.lang?.toLowerCase().startsWith('nl'))
    .sort((a, b) => Number(b.lang.toLowerCase() === 'nl-be') - Number(a.lang.toLowerCase() === 'nl-be'))
}
if (supported) {
  loadVoices()
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

export type Priority = 'high' | 'normal'

/**
 * Text-to-speech + aria-live. `say` always updates the live region; the app's own voice is used
 * only when "De app praat zelf" is on (otherwise the user's screen reader reads the live region).
 * A new message interrupts the current one, except that normal messages (hints) never cut off
 * an important one (the answer).
 */
export function useSpeech() {
  const settings = useSettings()
  const announcer = useAnnouncer()

  function pickVoice(): SpeechSynthesisVoice | null {
    if (!voices.value.length) loadVoices()
    return voices.value.find((v) => v.voiceURI === settings.voiceURI) ?? voices.value[0] ?? null
  }

  function speakOnly(text: string, priority: Priority = 'high') {
    if (!supported || !settings.appSpeech) return
    if (priority === 'normal' && currentPriority === 'high' && speechSynthesis.speaking) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice()
    u.lang = voice?.lang ?? 'nl-BE'
    if (voice) u.voice = voice
    u.rate = settings.rate
    u.volume = settings.volume
    currentPriority = priority
    u.onend = u.onerror = () => {
      if (currentPriority === priority) currentPriority = null
    }
    speechSynthesis.speak(u)
  }

  function say(text: string, priority: Priority = 'high') {
    announcer.announce(text, priority === 'high' ? 'assertive' : 'polite')
    speakOnly(text, priority)
  }

  function stop() {
    if (supported) speechSynthesis.cancel()
    currentPriority = null
  }

  return { supported, voices, say, speakOnly, stop }
}
