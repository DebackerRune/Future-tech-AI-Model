import { describe, expect, it } from 'vitest'
import { ALLOWED_SCAN_POINTS, computeReward, EMPTY_STATE, type UserState } from '@/lib/reward'

const ALL = [5, 10, 20, 50]
const at = (iso: string) => new Date(iso)

describe('computeReward', () => {
  it('gives 10 points and the first-scan badge on the first note', () => {
    const r = computeReward(EMPTY_STATE, 20, ALL, at('2026-11-24T10:00:00'))
    expect(r.counted).toBe(true)
    expect(r.points).toBe(10)
    expect(r.newBadges).toEqual(['first-scan'])
    expect(r.next).toMatchObject({ points: 10, scanCount: 1, seen: [20], streakDays: 1, lastScanValue: 20 })
  })

  it('does not count the same note twice within 10 seconds', () => {
    const first = computeReward(EMPTY_STATE, 20, ALL, at('2026-11-24T10:00:00'))
    const again = computeReward(first.next, 20, ALL, at('2026-11-24T10:00:05'))
    expect(again.counted).toBe(false)
    expect(again.next).toBe(first.next)
    const later = computeReward(first.next, 20, ALL, at('2026-11-24T10:00:11'))
    expect(later.counted).toBe(true)
  })

  it('counts a different note right away', () => {
    const first = computeReward(EMPTY_STATE, 20, ALL, at('2026-11-24T10:00:00'))
    expect(computeReward(first.next, 50, ALL, at('2026-11-24T10:00:02')).counted).toBe(true)
  })

  it('gives +50 once all notes have been seen', () => {
    let s: UserState = EMPTY_STATE
    let r = computeReward(s, 5, ALL, at('2026-11-24T10:00:00'))
    for (const [v, t] of [[10, '10:01'], [20, '10:02']] as const) {
      s = r.next
      r = computeReward(s, v, ALL, at(`2026-11-24T${t}:00`))
      expect(r.points).toBe(10)
    }
    r = computeReward(r.next, 50, ALL, at('2026-11-24T10:03:00'))
    expect(r.points).toBe(60)
    expect(r.newBadges).toContain('all-notes')
    const next = computeReward(r.next, 5, ALL, at('2026-11-24T10:04:00'))
    expect(next.points).toBe(10)
  })

  it('builds a streak over consecutive days and rewards 3 days once', () => {
    const d1 = computeReward(EMPTY_STATE, 5, ALL, at('2026-11-22T20:00:00'))
    const d2 = computeReward(d1.next, 5, ALL, at('2026-11-23T09:00:00'))
    expect(d2.next.streakDays).toBe(2)
    const d3 = computeReward(d2.next, 5, ALL, at('2026-11-24T09:00:00'))
    expect(d3.next.streakDays).toBe(3)
    expect(d3.points).toBe(35)
    expect(d3.newBadges).toContain('streak-3')
    const d4 = computeReward(d3.next, 10, ALL, at('2026-11-25T09:00:00'))
    expect(d4.points).toBe(10)
  })

  it('resets the streak after a missed day', () => {
    const d1 = computeReward(EMPTY_STATE, 5, ALL, at('2026-11-20T10:00:00'))
    const d3 = computeReward(d1.next, 5, ALL, at('2026-11-22T10:00:00'))
    expect(d3.next.streakDays).toBe(1)
  })

  it('only produces point values the Firestore rules allow', () => {
    const s: UserState = { ...EMPTY_STATE, seen: [5, 10, 20], badges: ['first-scan'], streakDays: 2, lastScanAt: at('2026-11-23T10:00:00'), lastScanValue: 5, scanCount: 3, points: 30 }
    const r = computeReward(s, 50, ALL, at('2026-11-24T10:00:00'))
    expect(r.points).toBe(85)
    expect(ALLOWED_SCAN_POINTS).toContain(r.points)
  })
})
