import { useSettings } from '@/stores/settings'

const ORDER = [5, 10, 20, 50, 100, 200, 500]

/** Vibration pattern for a note: €5 = 1 long pulse, €10 = 2, €20 = 3, €50 = 4 … */
export function patternFor(value: number): number[] {
  const count = Math.max(1, ORDER.indexOf(value) + 1)
  const pattern: number[] = []
  for (let i = 0; i < count; i++) pattern.push(300, 200)
  pattern.pop()
  return pattern
}

/** iPhone/iPad (Safari and every other iOS browser) has no vibration API at all. */
export function vibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

let timers: ReturnType<typeof setTimeout>[] = []

function pulse(ms: number): boolean {
  try {
    return navigator.vibrate(ms)
  } catch {
    return false
  }
}

/**
 * Vibrate, ignoring the setting. Returns false when the browser refused (no support or no tap yet).
 * Patterns are played as separate single pulses: several Android phones ignore pattern arrays
 * from the browser but do play a single `vibrate(ms)`.
 */
export function vibrate(pattern: number | number[]): boolean {
  if (!vibrationSupported()) return false
  timers.forEach(clearTimeout)
  timers = []
  const steps = typeof pattern === 'number' ? [pattern] : pattern
  const ok = pulse(steps[0] ?? 0)
  let at = 0
  for (let i = 2; i < steps.length; i += 2) {
    at += steps[i - 2] + steps[i - 1]
    const ms = steps[i]
    timers.push(setTimeout(() => pulse(ms), at))
  }
  return ok
}

export function useHaptics() {
  const settings = useSettings()
  const buzz = (pattern: number | number[]) => {
    if (settings.vibration) vibrate(pattern)
  }

  return {
    note(value: number) {
      buzz(patternFor(value))
    },
    // Very short pulses (< ~50 ms) are not felt on many phones.
    tick() {
      buzz(80)
    },
    error() {
      buzz([150, 100, 150])
    },
  }
}
