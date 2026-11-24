import { onBeforeUnmount, onMounted } from 'vue'
import { nl } from '@/i18n/nl'
import { useSettings } from '@/stores/settings'
import { useSpeech } from './useSpeech'
import { useHaptics } from './useHaptics'

const INTERACTIVE = 'button, a[href], summary, label, input[type="checkbox"], input[type="radio"]'
const CONFIRM_MS = 4000

function nameOf(el: HTMLElement): string {
  const raw = el.getAttribute('aria-label') ?? el.textContent ?? ''
  return raw.replace(/\s+/g, ' ').trim()
}

/** What to say when an element is tapped the first time. Exported for tests. */
export function describe(el: HTMLElement): string {
  if (el.tagName === 'LABEL') {
    const input = el.querySelector('input') as HTMLInputElement | null
    const name = nameOf(el)
    if (input?.type === 'radio') return nl.guide.choice(name, input.checked)
    if (input?.type === 'checkbox') return nl.guide.check(name, input.checked)
    return nl.guide.button(name)
  }
  if (el.tagName === 'A') return nl.guide.openLink(nameOf(el))
  if (el.tagName === 'SUMMARY') return nl.guide.expand(nameOf(el), (el.parentElement as HTMLDetailsElement)?.open)
  const pressed = el.getAttribute('aria-pressed')
  if (pressed !== null) return nl.guide.toggle(nameOf(el), pressed === 'true')
  return nl.guide.button(nameOf(el))
}

/**
 * Built-in "explore by touch" for people who do not use TalkBack or VoiceOver:
 * the first tap on a control reads what it is, a second tap on the same control uses it.
 * The main "Welk biljet is dit?" button and elements marked `data-direct` work on the first tap.
 * Keyboard and screen-reader activation (click with detail 0) is never intercepted, and the
 * guide is off when the user chose "Alleen mijn schermlezer".
 */
export function useVoiceGuide() {
  const settings = useSettings()
  const speech = useSpeech()
  const haptics = useHaptics()
  let pending: { el: Element; at: number } | null = null
  let allowUntil = 0

  function onClick(e: MouseEvent) {
    if (!settings.appSpeech || e.detail === 0) return
    if (performance.now() < allowUntil) return // the follow-up click a <label> sends to its input
    const target = e.target as Element | null
    const el = target?.closest(INTERACTIVE) as HTMLElement | null
    if (!el || el.closest('[data-direct], #ask-button')) return
    const input = el.tagName === 'INPUT' ? el : null
    const host = (input?.closest('label') as HTMLElement | null) ?? el

    if (pending && pending.el === host && Date.now() - pending.at < CONFIRM_MS) {
      pending = null
      allowUntil = performance.now() + 100
      return // second tap: let it through
    }
    e.preventDefault()
    e.stopImmediatePropagation()
    pending = { el: host, at: Date.now() }
    haptics.tick()
    speech.say(describe(host))
  }

  onMounted(() => document.addEventListener('click', onClick, true))
  onBeforeUnmount(() => document.removeEventListener('click', onClick, true))
}
