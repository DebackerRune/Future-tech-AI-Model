import type { ClassPrediction } from './aggregate'
import { valueFromLabel } from './labels'

export interface AutoScanOptions {
  /** A note class counts as "seen" in a frame from this probability. */
  detectProb?: number
  /** How many of the last `detectWindow` frames must show the same note to start a scan. */
  detectNeeded?: number
  detectWindow?: number
  /** How long a scan collects frames once a note is spotted. */
  scanMs?: number
  /** How long the note must be gone before the same note may be answered (and counted) again. */
  removalMs?: number
  /** "Ik zie geen biljet" only after this long without any note in view. */
  noNoteMs?: number
  /** After an unsure answer, wait this long before the one automatic retry. */
  retryAfterMs?: number
}

export type AnswerKind = 'note' | 'unsure' | 'unclear' | 'none'

export type AutoEvent =
  | { type: 'scanStart'; label: string }
  | { type: 'scanDone'; frames: ClassPrediction[][] }
  | { type: 'noNote' }

export type Phase = 'watching' | 'scanning' | 'holding'

/**
 * Automatic mode as a small state machine, fed one camera frame at a time:
 *
 *   watching ──(same note in 3 of 5 frames)──▶ scanning ──(2 s of frames)──▶ caller answers
 *       ▲                                                                       │
 *       └──(note away ≥ 1 s)── holding ◀──────────── markHandled(label, kind) ──┘
 *
 * While holding, the note that was just answered is ignored, so it is said (and counted) once.
 * A different note starts a new scan right away; an unsure answer gets one automatic retry.
 * "Ik zie geen biljet" is reported once after 10 s without any note, and again only after a
 * note has been seen in between.
 */
export class AutoScanner {
  private readonly o: Required<AutoScanOptions>
  phase: Phase = 'watching'
  private window: (string | null)[] = []
  private frames: ClassPrediction[][] = []
  private scanStart = 0
  private handledLabel: string | null = null
  private handledKind: AnswerKind = 'none'
  private handledAt = 0
  private retried = false
  private goneSince: number | null = null
  private lastNoteAt: number
  private noNoteReported = false

  constructor(now: number, opts: AutoScanOptions = {}) {
    this.o = {
      detectProb: 0.5,
      detectNeeded: 3,
      detectWindow: 5,
      scanMs: 2000,
      removalMs: 1000,
      noNoteMs: 10000,
      retryAfterMs: 1500,
      ...opts,
    }
    this.lastNoteAt = now
  }

  /** Start over (e.g. when automatic mode is switched on or the app comes back). */
  reset(now: number): void {
    this.phase = 'watching'
    this.window = []
    this.frames = []
    this.handledLabel = null
    this.handledKind = 'none'
    this.retried = false
    this.goneSince = null
    this.lastNoteAt = now
    this.noNoteReported = false
  }

  /** A manual scan (button) is starting: drop any automatic scan in progress. */
  cancelScan(): void {
    if (this.phase === 'scanning') this.phase = 'watching'
    this.frames = []
    this.window = []
  }

  /**
   * Tell the scanner what was answered for `label` (automatic or manual scan), so that note is
   * not answered again while it stays in view. `none` means no note won: keep watching.
   */
  markHandled(label: string, kind: AnswerKind, now: number): void {
    this.frames = []
    this.window = []
    if (kind === 'none' || valueFromLabel(label) === null) {
      this.phase = 'watching'
      return
    }
    if (this.handledLabel !== label) this.retried = false
    this.phase = 'holding'
    this.handledLabel = label
    this.handledKind = kind
    this.handledAt = now
    this.goneSince = null
  }

  /** Feed one frame. Returns an event for the caller to act on, or null. */
  push(frame: readonly ClassPrediction[], now: number): AutoEvent | null {
    if (frame.length === 0) return null
    const top = frame.reduce((a, b) => (b.probability > a.probability ? b : a))
    const note = valueFromLabel(top.className) !== null && top.probability >= this.o.detectProb ? top.className : null

    if (note) {
      this.lastNoteAt = now
      this.noNoteReported = false
    }

    if (this.phase === 'scanning') {
      this.frames.push([...frame])
      if (now - this.scanStart >= this.o.scanMs) {
        const frames = this.frames
        this.frames = []
        this.phase = 'holding' // caller answers, then calls markHandled()
        return { type: 'scanDone', frames }
      }
      return null
    }

    if (this.phase === 'holding') {
      if (note === null) {
        this.goneSince ??= now
        if (now - this.goneSince >= this.o.removalMs) {
          this.phase = 'watching'
          this.handledLabel = null
          this.retried = false
          this.window = []
        }
        return null
      }
      this.goneSince = null
      // The answered note is still there: ignore it, except for one retry after an unsure answer.
      if (note === this.handledLabel || this.handledLabel === null) {
        const unsure = this.handledKind === 'unsure' || this.handledKind === 'unclear'
        if (unsure && !this.retried && now - this.handledAt >= this.o.retryAfterMs) {
          this.retried = true
          return this.startScan(note, frame, now)
        }
        return null
      }
      // A different note appeared: scan it once it is stable.
      return this.detect(note, frame, now)
    }

    // watching
    const event = this.detect(note, frame, now)
    if (event) return event
    if (!this.noNoteReported && now - this.lastNoteAt >= this.o.noNoteMs) {
      this.noNoteReported = true
      return { type: 'noNote' }
    }
    return null
  }

  private detect(note: string | null, frame: readonly ClassPrediction[], now: number): AutoEvent | null {
    this.window.push(note)
    if (this.window.length > this.o.detectWindow) this.window.shift()
    if (note === null) return null
    const count = this.window.filter((l) => l === note).length
    return count >= this.o.detectNeeded ? this.startScan(note, frame, now) : null
  }

  private startScan(label: string, frame: readonly ClassPrediction[], now: number): AutoEvent {
    this.phase = 'scanning'
    this.scanStart = now
    this.frames = [[...frame]]
    this.window = []
    return { type: 'scanStart', label }
  }
}
