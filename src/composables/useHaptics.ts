import { useSettings } from '@/stores/settings'

const ORDER = [5, 10, 20, 50, 100, 200, 500]

/** Vibration pattern for a note: €5 = 1 long pulse, €10 = 2, €20 = 3, €50 = 4 … */
export function patternFor(value: number): number[] {
  const count = Math.max(1, ORDER.indexOf(value) + 1)
  const pattern: number[] = []
  for (let i = 0; i < count; i++) pattern.push(250, 150)
  pattern.pop()
  return pattern
}

export function useHaptics() {
  const settings = useSettings()
  const can = () => settings.vibration && typeof navigator !== 'undefined' && 'vibrate' in navigator

  return {
    note(value: number) {
      if (can()) navigator.vibrate(patternFor(value))
    },
    tick() {
      if (can()) navigator.vibrate(30)
    },
    error() {
      if (can()) navigator.vibrate([80, 60, 80])
    },
  }
}
