export const POINTS_PER_NOTE = 10
export const ALL_NOTES_BONUS = 50
export const STREAK_BONUS = 25
export const STREAK_DAYS = 3
export const COOLDOWN_MS = 10_000
/** Every possible points value of one scan (used by the Firestore rules too). */
export const ALLOWED_SCAN_POINTS = [10, 35, 60, 85] as const

export type Badge = 'first-scan' | 'all-notes' | 'streak-3'

export interface UserState {
  points: number
  scanCount: number
  seen: number[]
  badges: Badge[]
  streakDays: number
  lastScanAt: Date | null
  lastScanValue: number | null
}

export const EMPTY_STATE: UserState = {
  points: 0,
  scanCount: 0,
  seen: [],
  badges: [],
  streakDays: 0,
  lastScanAt: null,
  lastScanValue: null,
}

export interface Reward {
  /** false when the same note was already counted less than 10 s ago — nothing is stored then */
  counted: boolean
  points: number
  newBadges: Badge[]
  next: UserState
}

function dayNumber(d: Date): number {
  // local calendar day, so "yesterday" follows the user's own clock
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000)
}

/**
 * Points for one confidently recognised note (confidence ≥ threshold is checked by the caller).
 * +10 per note, +50 the first time every note of the model has been seen, +25 for a 3-day streak.
 */
export function computeReward(
  state: UserState,
  value: number,
  allValues: readonly number[],
  now: Date,
): Reward {
  if (
    state.lastScanAt &&
    state.lastScanValue === value &&
    now.getTime() - state.lastScanAt.getTime() < COOLDOWN_MS
  ) {
    return { counted: false, points: 0, newBadges: [], next: state }
  }

  let points = POINTS_PER_NOTE
  const newBadges: Badge[] = []
  const badges = new Set(state.badges)

  if (!badges.has('first-scan')) newBadges.push('first-scan')

  const seen = state.seen.includes(value) ? [...state.seen] : [...state.seen, value].sort((a, b) => a - b)
  if (!badges.has('all-notes') && allValues.length > 0 && allValues.every((v) => seen.includes(v))) {
    points += ALL_NOTES_BONUS
    newBadges.push('all-notes')
  }

  let streakDays = 1
  if (state.lastScanAt) {
    const diff = dayNumber(now) - dayNumber(state.lastScanAt)
    if (diff === 0) streakDays = Math.max(1, state.streakDays)
    else if (diff === 1) streakDays = state.streakDays + 1
  }
  if (!badges.has('streak-3') && streakDays >= STREAK_DAYS) {
    points += STREAK_BONUS
    newBadges.push('streak-3')
  }

  return {
    counted: true,
    points,
    newBadges,
    next: {
      points: state.points + points,
      scanCount: state.scanCount + 1,
      seen,
      badges: [...state.badges, ...newBadges],
      streakDays,
      lastScanAt: now,
      lastScanValue: value,
    },
  }
}
