import { describe, expect, it } from 'vitest'
import { isNoteLabel, noteValues, valueFromLabel } from '@/lib/labels'
import { dutchNumber, euroWords } from '@/lib/numberWords'
import { aggregatePredictions } from '@/lib/aggregate'
import { decideAnswer } from '@/lib/decide'
import { StabilityTracker } from '@/lib/stability'

const LABELS = ['5 euro', '10 euro', '20 euro', '50 euro', 'geen biljet']
const frame = (probs: number[]) => LABELS.map((className, i) => ({ className, probability: probs[i] }))

describe('labels', () => {
  it('reads the euro value from the class name', () => {
    expect(valueFromLabel('20 euro')).toBe(20)
    expect(valueFromLabel('biljet_50')).toBe(50)
    expect(valueFromLabel('geen biljet')).toBeNull()
    expect(isNoteLabel('geen biljet')).toBe(false)
  })
  it('lists the note values of a model', () => {
    expect(noteValues(LABELS)).toEqual([5, 10, 20, 50])
    expect(noteValues([...LABELS, '100 euro'])).toEqual([5, 10, 20, 50, 100])
  })
})

describe('dutchNumber', () => {
  it.each([
    [0, 'nul'],
    [5, 'vijf'],
    [13, 'dertien'],
    [20, 'twintig'],
    [21, 'eenentwintig'],
    [22, 'tweeëntwintig'],
    [23, 'drieëntwintig'],
    [55, 'vijfenvijftig'],
    [100, 'honderd'],
    [120, 'honderdtwintig'],
    [285, 'tweehonderdvijfentachtig'],
    [1000, 'duizend'],
    [1250, 'duizend tweehonderdvijftig'],
    [2005, 'tweeduizend vijf'],
  ])('%i → %s', (n, words) => {
    expect(dutchNumber(n)).toBe(words)
  })
  it('adds euro', () => {
    expect(euroWords(50)).toBe('vijftig euro')
  })
})

describe('aggregatePredictions', () => {
  it('averages over frames and picks the highest class', () => {
    const agg = aggregatePredictions([
      frame([0.1, 0.1, 0.7, 0.05, 0.05]),
      frame([0.0, 0.0, 0.9, 0.1, 0.0]),
      frame([0.0, 0.0, 0.5, 0.5, 0.0]),
    ])
    expect(agg.label).toBe('20 euro')
    expect(agg.value).toBe(20)
    expect(agg.confidence).toBeCloseTo(0.7, 5)
    expect(agg.frames).toBe(3)
    expect(agg.perClass[0].className).toBe('20 euro')
  })
  it('smooths a single wrong frame', () => {
    const agg = aggregatePredictions([
      frame([0.95, 0, 0, 0.05, 0]),
      frame([0.95, 0, 0, 0.05, 0]),
      frame([0.0, 0, 0, 1, 0]),
    ])
    expect(agg.value).toBe(5)
  })
  it('handles no frames', () => {
    expect(aggregatePredictions([]).frames).toBe(0)
  })
})

describe('decideAnswer', () => {
  const agg = (label: string, confidence: number) => ({
    label,
    value: valueFromLabel(label),
    confidence,
    perClass: [],
    frames: 10,
  })
  it('is a note at ≥ 90%', () => {
    expect(decideAnswer(agg('20 euro', 0.92))).toEqual({ kind: 'note', value: 20, confidence: 0.92, certain: false })
    expect(decideAnswer(agg('20 euro', 0.98))).toMatchObject({ kind: 'note', certain: true })
  })
  it('is unsure between 60% and 90%', () => {
    expect(decideAnswer(agg('10 euro', 0.75))).toMatchObject({ kind: 'unsure', value: 10 })
  })
  it('is none for low confidence or the background class', () => {
    expect(decideAnswer(agg('10 euro', 0.4)).kind).toBe('none')
    expect(decideAnswer(agg('geen biljet', 0.99)).kind).toBe('none')
  })
})

describe('StabilityTracker', () => {
  it('announces after 5 stable frames, not before', () => {
    const t = new StabilityTracker()
    for (let i = 0; i < 4; i++) expect(t.push('20 euro', 0.95, i * 100)).toBeNull()
    expect(t.push('20 euro', 0.95, 500)).toMatchObject({ value: 20 })
  })
  it('does not repeat the same note until it was taken away', () => {
    const t = new StabilityTracker({ minGapMs: 0 })
    for (let i = 0; i < 5; i++) t.push('20 euro', 0.95, i)
    for (let i = 0; i < 10; i++) expect(t.push('20 euro', 0.95, 10 + i)).toBeNull()
    for (let i = 0; i < 5; i++) t.push('geen biljet', 0.99, 30 + i)
    let out = null
    for (let i = 0; i < 5; i++) out = t.push('20 euro', 0.95, 40 + i)
    expect(out).toMatchObject({ value: 20 })
  })
  it('ignores frames below the threshold', () => {
    const t = new StabilityTracker()
    for (let i = 0; i < 10; i++) expect(t.push('50 euro', 0.8, i * 100)).toBeNull()
  })
  it('respects the minimum gap between different notes', () => {
    const t = new StabilityTracker({ minGapMs: 1500 })
    for (let i = 0; i < 5; i++) t.push('20 euro', 0.95, i * 100)
    let out = null
    for (let i = 0; i < 5; i++) out = t.push('50 euro', 0.95, 500 + i * 100)
    expect(out).toBeNull()
    // once the gap has passed it is announced on the next stable frame (and only once)
    const later = Array.from({ length: 5 }, (_, i) => t.push('50 euro', 0.95, 2000 + i * 100)).filter(Boolean)
    expect(later).toEqual([expect.objectContaining({ value: 50 })])
  })
})
