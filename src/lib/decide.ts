import type { Aggregate } from './aggregate'

/** Points (and the stored scan) only from this confidence — the assignment's > 90 % rule. */
export const THRESHOLD = 0.9
/** The amount is said from this confidence ("vrij zeker"). */
export const ANSWER_THRESHOLD = 0.8
/** "Ik ben er zeker van" from this confidence. */
export const CERTAIN = 0.97
/** Between this and ANSWER_THRESHOLD: "Ik denk … maar ik ben niet zeker". */
export const UNSURE_MIN = 0.5
/** At least this share of the frames must agree before the amount is said. */
export const MIN_AGREEMENT = 0.5

export type Answer =
  /** amount is said; `rewarded` when it also counts for points (≥ 90 %) */
  | { kind: 'note'; value: number; confidence: number; certain: boolean; rewarded: boolean }
  /** a note is on top, but not sure which one */
  | { kind: 'unsure'; value: number; confidence: number }
  /** a note is on top, but the model can't read it */
  | { kind: 'unclear'; confidence: number }
  /** "geen biljet" is on top (or nothing was seen) */
  | { kind: 'none'; confidence: number }

/**
 * Turn the combined frames into what the app says.
 * "Ik zie geen biljet" is only said when the no-banknote class actually wins.
 */
export function decideAnswer(agg: Aggregate): Answer {
  if (agg.frames === 0 || agg.value === null) return { kind: 'none', confidence: agg.confidence }

  const agreed = agg.agreement >= MIN_AGREEMENT
  if (agreed && agg.confidence >= ANSWER_THRESHOLD) {
    return {
      kind: 'note',
      value: agg.value,
      confidence: agg.confidence,
      certain: agg.confidence >= CERTAIN,
      rewarded: agg.confidence >= THRESHOLD,
    }
  }
  if (agg.confidence >= UNSURE_MIN) return { kind: 'unsure', value: agg.value, confidence: agg.confidence }
  return { kind: 'unclear', confidence: agg.confidence }
}
