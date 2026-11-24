import { valueFromLabel } from './labels'

export interface ClassPrediction {
  className: string
  probability: number
}

export interface Aggregate {
  /** Class that was the top prediction in the most frames */
  label: string
  /** Euro value of that class, or null for the "no banknote" class */
  value: number | null
  /** Average probability of that class over the frames where it was on top (0..1) */
  confidence: number
  /** Share of frames in which that class was on top (0..1) */
  agreement: number
  /** Average probability per class over all frames, highest first (for the helper bars) */
  perClass: ClassPrediction[]
  frames: number
}

/**
 * Combine several frames into one answer.
 *
 * Every frame votes for its top class; the class with the most votes wins (ties: higher average).
 * Its confidence is the average over the frames it won, so a few blurry frames or a moving hand
 * don't drag a clear recognition down. `agreement` says how many frames agreed.
 */
export function aggregatePredictions(frames: readonly (readonly ClassPrediction[])[]): Aggregate {
  const valid = frames.filter((f) => f.length > 0)
  if (valid.length === 0) {
    return { label: '', value: null, confidence: 0, agreement: 0, perClass: [], frames: 0 }
  }

  const sums = new Map<string, number>()
  const wins = new Map<string, { count: number; sum: number }>()
  for (const frame of valid) {
    let top = frame[0]
    for (const p of frame) {
      const prob = Number.isFinite(p.probability) ? p.probability : 0
      sums.set(p.className, (sums.get(p.className) ?? 0) + prob)
      if (prob > top.probability) top = p
    }
    const w = wins.get(top.className) ?? { count: 0, sum: 0 }
    w.count += 1
    w.sum += Number.isFinite(top.probability) ? top.probability : 0
    wins.set(top.className, w)
  }

  const perClass = [...sums.entries()]
    .map(([className, sum]) => ({ className, probability: sum / valid.length }))
    .sort((a, b) => b.probability - a.probability)
  const mean = (c: string) => perClass.find((p) => p.className === c)?.probability ?? 0

  const [label, w] = [...wins.entries()].sort(
    ([a, x], [b, y]) => y.count - x.count || mean(b) - mean(a),
  )[0]

  return {
    label,
    value: valueFromLabel(label),
    confidence: w.sum / w.count,
    agreement: w.count / valid.length,
    perClass,
    frames: valid.length,
  }
}
