import { valueFromLabel } from './labels'
import { THRESHOLD } from './decide'

export interface StabilityOptions {
  threshold?: number
  stableFrames?: number
  minGapMs?: number
}

export interface StableNote {
  label: string
  value: number
  confidence: number
}

/**
 * Continuous mode: announce a note once the same class stays above the threshold for N frames in a row.
 * The same note is not repeated until "no banknote" has been seen (the note was taken away),
 * and announcements are at least `minGapMs` apart.
 */
export class StabilityTracker {
  private readonly threshold: number
  private readonly stableFrames: number
  private readonly minGapMs: number
  private history: (string | null)[] = []
  private lastLabel: string | null = null
  private lastAt = -Infinity
  private clearedSinceLast = true

  constructor(opts: StabilityOptions = {}) {
    this.threshold = opts.threshold ?? THRESHOLD
    this.stableFrames = opts.stableFrames ?? 5
    this.minGapMs = opts.minGapMs ?? 1500
  }

  reset(): void {
    this.history = []
    this.lastLabel = null
    this.lastAt = -Infinity
    this.clearedSinceLast = true
  }

  /** Feed the top prediction of one frame. Returns a note to announce, or null. */
  push(label: string, probability: number, now: number): StableNote | null {
    const confident = probability >= this.threshold
    this.history.push(confident ? label : null)
    if (this.history.length > this.stableFrames) this.history.shift()

    const stable = this.history.length === this.stableFrames && this.history.every((l) => l === label)
    if (!stable) return null

    const value = valueFromLabel(label)
    if (value === null) {
      this.clearedSinceLast = true
      return null
    }
    const isNew = label !== this.lastLabel || this.clearedSinceLast
    if (!isNew || now - this.lastAt < this.minGapMs) return null

    this.lastLabel = label
    this.lastAt = now
    this.clearedSinceLast = false
    this.history = []
    return { label, value, confidence: probability }
  }
}
