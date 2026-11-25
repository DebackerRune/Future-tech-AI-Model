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

/** Vibrate, ignoring the setting. Returns false when the browser refused (no support or no tap yet). */
export function vibrate(pattern: number | number[]): boolean {
  if (!vibrationSupported()) return false
  try {
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
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
