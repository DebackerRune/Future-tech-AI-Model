import { onBeforeUnmount, onMounted } from 'vue'
import { nl } from '@/i18n/nl'
import { useSettings } from '@/stores/settings'
import { useAnnouncer } from '@/stores/announcer'
import { isRealTouch, isScreenReaderClick, isVirtualPointerEvent } from '@/lib/virtualClick'
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
 * Decides who does the talking, and offers "explore by touch" when the app talks itself.
 *
 * - Screen reader detection: a tap on the start screen sets the mode for this session — a finger
 *   means the app speaks; a TalkBack/VoiceOver double-tap means the app stays quiet and leaves
 *   everything to the screen reader. Any screen-reader click later in the session also switches
 *   the app's own voice off.
 * - Explore by touch (only when the app speaks): the first tap on a control reads what it is,
 *   a second tap on the same control uses it. The main button and `data-direct` elements act at once.
 */
export function useVoiceGuide() {
  const settings = useSettings()
  const announcer = useAnnouncer()
  const speech = useSpeech()
  const haptics = useHaptics()
  let pending: { el: Element; at: number } | null = null
  let allowUntil = 0
  let lastPointerVirtual = false
  let lastPointerTouch = false

  function onPointerDown(e: PointerEvent) {
    lastPointerTouch = isRealTouch(e)
    lastPointerVirtual = !lastPointerTouch && isVirtualPointerEvent(e)
  }

  function onClick(e: MouseEvent) {
    const target = e.target as Element | null
    const screenReader = isScreenReaderClick(e, lastPointerVirtual, lastPointerTouch)
    lastPointerVirtual = false
    lastPointerTouch = false

    // The start screen decides the mode for this session.
    if (target?.closest('[data-start]')) {
      settings.appSpeech = !screenReader
      return
    }
    // Safety net: a screen-reader click later on switches the app's own voice off.
    if (screenReader) {
      if (settings.appSpeech) {
        settings.appSpeech = false
        speech.stop()
        announcer.announce(nl.start.screenReaderOn)
      }
      return
    }

    if (!settings.appSpeech || e.detail === 0) return
    if (performance.now() < allowUntil) return // the follow-up click a <label> sends to its input
    const el = target?.closest(INTERACTIVE) as HTMLElement | null
    if (!el) return
    // Buttons that act at once still get a short buzz (the main button buzzes on its own).
    if (el.closest('[data-direct]')) haptics.tick()
    if (el.closest('[data-direct], #ask-button')) return
    const input = el.tagName === 'INPUT' ? el : null
    const host = (input?.closest('label') as HTMLElement | null) ?? el

    if (pending && pending.el === host && Date.now() - pending.at < CONFIRM_MS) {
      pending = null
      allowUntil = performance.now() + 100
      haptics.tick() // second tap: buzz and let it through
    }
    e.preventDefault()
    e.stopImmediatePropagation()
    pending = { el: host, at: Date.now() }
    haptics.tick()
    speech.say(describe(host))
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('click', onClick, true)
  })
}
