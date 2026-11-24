import type { Aggregate } from './aggregate'

export const THRESHOLD = 0.9
export const UNSURE_MIN = 0.6
export const CERTAIN = 0.97

export type Answer =
  | { kind: 'note'; value: number; confidence: number; certain: boolean }
  | { kind: 'unsure'; value: number; confidence: number }
  | { kind: 'none'; confidence: number }

/** Turn an aggregated prediction into what the app should say. Only `kind: 'note'` earns points. */
export function decideAnswer(agg: Aggregate, threshold = THRESHOLD, unsureMin = UNSURE_MIN): Answer {
  if (agg.value === null || agg.frames === 0) return { kind: 'none', confidence: agg.confidence }
  if (agg.confidence >= threshold) {
    return { kind: 'note', value: agg.value, confidence: agg.confidence, certain: agg.confidence >= CERTAIN }
  }
  if (agg.confidence >= unsureMin) return { kind: 'unsure', value: agg.value, confidence: agg.confidence }
  return { kind: 'none', confidence: agg.confidence }
}
