import { describe, expect, it } from 'vitest'
import { AutoScanner, type AutoEvent } from '@/lib/autoScan'

const LABELS = ['5 euro', '10 euro', '20 euro', '50 euro', 'geen biljet']
/** One frame where `label` has probability `p` and the rest share what is left. */
function frame(label: string, p = 0.95) {
  const rest = (1 - p) / (LABELS.length - 1)
  return LABELS.map((className) => ({ className, probability: className === label ? p : rest }))
}
const EMPTY = frame('geen biljet', 0.95)
const STEP = 250

/** Feed `count` frames of `label`, starting at `t`; returns the events and the end time. */
function feed(s: AutoScanner, label: string, t: number, count: number, p = 0.95) {
  const events: AutoEvent[] = []
  for (let i = 0; i < count; i++) {
    const e = s.push(label === 'geen biljet' ? EMPTY : frame(label, p), t)
    if (e) events.push(e)
    t += STEP
  }
  return { events, t }
}

/** Run a full automatic scan of `label` and mark it answered with `kind`. */
function scanAndAnswer(s: AutoScanner, label: string, t: number, kind: 'note' | 'unsure' = 'note') {
  const spot = feed(s, label, t, 3)
  expect(spot.events).toEqual([{ type: 'scanStart', label }])
  const scan = feed(s, label, spot.t, 9) // 2 s at 250 ms
  const done = scan.events.find((e) => e.type === 'scanDone')
  expect(done).toBeTruthy()
  s.markHandled(label, kind, scan.t)
  return scan.t
}

describe('AutoScanner', () => {
  it('starts a scan when the same note is seen in 3 of 5 frames, and scans for 2 seconds', () => {
    const s = new AutoScanner(0)
    const spot = feed(s, '20 euro', 0, 3)
    expect(spot.events).toEqual([{ type: 'scanStart', label: '20 euro' }])
    // not done before 2 s …
    const early = feed(s, '20 euro', spot.t, 7)
    expect(early.events).toEqual([])
    // … done right after
    const late = feed(s, '20 euro', early.t, 2)
    const done = late.events[0]
    expect(done.type).toBe('scanDone')
    if (done.type === 'scanDone') expect(done.frames.length).toBeGreaterThanOrEqual(8)
  })

  it('does not answer (or count) the same note again while it stays in view', () => {
    const s = new AutoScanner(0)
    const t = scanAndAnswer(s, '20 euro', 0)
    expect(feed(s, '20 euro', t, 40).events).toEqual([])
  })

  it('counts two identical notes when the first is taken away for about a second', () => {
    const s = new AutoScanner(0)
    let t = scanAndAnswer(s, '20 euro', 0)
    t = feed(s, 'geen biljet', t, 5).t // ≥ 1 s away
    scanAndAnswer(s, '20 euro', t)
  })

  it('a short glitch without the note is not enough to count it again', () => {
    const s = new AutoScanner(0)
    let t = scanAndAnswer(s, '20 euro', 0)
    t = feed(s, 'geen biljet', t, 2).t // only 0.5 s
    expect(feed(s, '20 euro', t, 10).events).toEqual([])
  })

  it('scans a different note right away, without waiting for removal', () => {
    const s = new AutoScanner(0)
    const t = scanAndAnswer(s, '20 euro', 0)
    expect(feed(s, '50 euro', t, 3).events).toEqual([{ type: 'scanStart', label: '50 euro' }])
  })

  it('retries once after an unsure answer, then waits', () => {
    const s = new AutoScanner(0)
    let t = scanAndAnswer(s, '10 euro', 0, 'unsure')
    const retry = feed(s, '10 euro', t, 8) // 2 s later
    expect(retry.events).toEqual([{ type: 'scanStart', label: '10 euro' }])
    t = feed(s, '10 euro', retry.t, 9).t
    s.markHandled('10 euro', 'unsure', t)
    expect(feed(s, '10 euro', t, 40).events).toEqual([])
  })

  it('says "geen biljet" only after 10 seconds without a note, and only once', () => {
    const s = new AutoScanner(0)
    const first = feed(s, 'geen biljet', 0, 39) // < 10 s
    expect(first.events).toEqual([])
    const second = feed(s, 'geen biljet', first.t, 2)
    expect(second.events).toEqual([{ type: 'noNote' }])
    expect(feed(s, 'geen biljet', second.t, 80).events).toEqual([])
  })

  it('says "geen biljet" again only after a note was seen in between', () => {
    const s = new AutoScanner(0)
    let t = feed(s, 'geen biljet', 0, 41).t // reported once
    t = feed(s, '20 euro', t, 1).t // a note flashes by
    expect(feed(s, 'geen biljet', t, 41).events).toEqual([{ type: 'noNote' }])
  })

  it('a manual scan shares the memory: a note answered by the button is not auto-counted again', () => {
    const s = new AutoScanner(0)
    s.cancelScan()
    s.markHandled('20 euro', 'note', 0)
    expect(feed(s, '20 euro', 0, 20).events).toEqual([])
  })

  it('ignores weak predictions below 50 %', () => {
    const s = new AutoScanner(0)
    expect(feed(s, '20 euro', 0, 10, 0.4).events).toEqual([])
  })
})
