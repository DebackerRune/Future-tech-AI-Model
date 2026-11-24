import { useSettings } from '@/stores/settings'

export type Earcon = 'start' | 'found' | 'unsure' | 'none' | 'error' | 'listen'

// [frequency Hz, duration s] per tone; generated with Web Audio, so no sound files are needed.
const TONES: Record<Earcon, [number, number][]> = {
  start: [[660, 0.08]],
  listen: [[880, 0.07], [1175, 0.07]],
  found: [[784, 0.09], [1047, 0.14]],
  unsure: [[587, 0.12], [523, 0.12]],
  none: [[392, 0.18]],
  error: [[330, 0.12], [262, 0.2]],
}

let ctx: AudioContext | null = null

export function useEarcons() {
  const settings = useSettings()

  function play(kind: Earcon) {
    if (!settings.sounds) return
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx ??= new Ctor()
      if (ctx.state === 'suspended') void ctx.resume()
      let t = ctx.currentTime
      for (const [freq, dur] of TONES[kind]) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.25 * settings.volume + 0.0001, t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + dur + 0.02)
        t += dur + 0.03
      }
    } catch {
      /* audio not available */
    }
  }

  return { play }
}
