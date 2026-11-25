import { afterEach, describe, expect, it, vi } from 'vitest'
import { patternFor, vibrate } from '@/composables/useHaptics'

describe('vibrate', () => {
  afterEach(() => vi.useRealTimers())

  it('plays a pattern as separate single pulses (some Android phones ignore pattern arrays)', () => {
    vi.useFakeTimers()
    const calls: [number, number][] = []
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (ms: number) => (calls.push([Date.now(), ms]), true),
    })
    const start = Date.now()
    expect(vibrate(patternFor(20))).toBe(true) // three pulses
    vi.runAllTimers()
    expect(calls.map(([t, ms]) => [t - start, ms])).toEqual([
      [0, 300],
      [500, 300],
      [1000, 300],
    ])
  })
})
