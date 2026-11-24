import { valueFromLabel } from './labels'

export interface ClassPrediction {
  className: string
  probability: number
}

export interface Aggregate {
  /** Class with the highest average probability */
  label: string
  /** Euro value of that class, or null for the "no banknote" class */
  value: number | null
  /** Average probability of that class over all frames (0..1) */
  confidence: number
  /** Average probability per class, highest first */
  perClass: ClassPrediction[]
  frames: number
}

/**
 * Average the per-class probabilities over several frames and pick the most confident class.
 * Averaging over ~10 frames smooths out single blurry or badly lit frames.
 */
export function aggregatePredictions(frames: readonly (readonly ClassPrediction[])[]): Aggregate {
  const valid = frames.filter((f) => f.length > 0)
  if (valid.length === 0) {
    return { label: '', value: null, confidence: 0, perClass: [], frames: 0 }
  }
  const sums = new Map<string, number>()
  for (const frame of valid) {
    for (const p of frame) {
      const prob = Number.isFinite(p.probability) ? p.probability : 0
      sums.set(p.className, (sums.get(p.className) ?? 0) + prob)
    }
  }
  const perClass = [...sums.entries()]
    .map(([className, sum]) => ({ className, probability: sum / valid.length }))
    .sort((a, b) => b.probability - a.probability)
  const top = perClass[0]
  return {
    label: top.className,
    value: valueFromLabel(top.className),
    confidence: top.probability,
    perClass,
    frames: valid.length,
  }
}
