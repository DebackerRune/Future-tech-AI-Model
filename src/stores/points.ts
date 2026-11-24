import { defineStore } from 'pinia'
import { ref } from 'vue'
import { computeReward, EMPTY_STATE, type Badge, type UserState } from '@/lib/reward'
import { readJson, removeKey, writeJson } from '@/lib/storage'
import { firebaseEnabled } from '@/firebase/config'
import type { ScanMode, ScanRecord } from '@/firebase/scans'

// The Firebase SDK is loaded on demand (code-split), so the scan button is usable sooner.
const fb = () => Promise.all([import('@/firebase'), import('@/firebase/scans')]).then(([a, b]) => ({ ...a, ...b }))

const LOCAL_KEY = 'geldscan.points.v1'
const LOCAL_SCANS_KEY = 'geldscan.scans.v1'

interface LocalState extends Omit<UserState, 'lastScanAt'> {
  lastScanAt: string | null
}

function toLocal(s: UserState): LocalState {
  return { ...s, lastScanAt: s.lastScanAt?.toISOString() ?? null }
}
function fromLocal(s: LocalState): UserState {
  return { ...s, lastScanAt: s.lastScanAt ? new Date(s.lastScanAt) : null }
}

export interface RecordResult {
  counted: boolean
  points: number
  newBadges: Badge[]
}

/**
 * Points and scan history. Uses Firestore (anonymous user) when configured,
 * otherwise localStorage — the app works the same either way.
 */
export const usePoints = defineStore('points', () => {
  const state = ref<UserState>({ ...EMPTY_STATE })
  const recent = ref<ScanRecord[]>([])
  const cloud = ref(false)
  const ready = ref(false)
  const saveError = ref(false)
  let uid: string | null = null
  let initPromise: Promise<void> | null = null

  function loadLocal() {
    state.value = fromLocal(readJson<LocalState>(LOCAL_KEY, toLocal(EMPTY_STATE)))
    const scans = readJson<{ items: (Omit<ScanRecord, 'createdAt'> & { createdAt: string })[] }>(LOCAL_SCANS_KEY, {
      items: [],
    })
    recent.value = scans.items.map((s) => ({ ...s, createdAt: new Date(s.createdAt) }))
  }

  function init(): Promise<void> {
    initPromise ??= (async () => {
      if (firebaseEnabled) {
        try {
          const { ensureUser, loadUserState, loadRecentScans } = await fb()
          const user = await ensureUser()
          uid = user.uid
          state.value = await loadUserState(uid)
          recent.value = await loadRecentScans(uid)
          cloud.value = true
        } catch (e) {
          console.warn('Firebase niet bereikbaar, punten blijven lokaal:', e)
          cloud.value = false
          loadLocal()
        }
      } else {
        loadLocal()
      }
      ready.value = true
    })()
    return initPromise
  }

  /** Called for every confident (≥ threshold) recognition. */
  async function record(
    label: string,
    value: number,
    confidence: number,
    mode: ScanMode,
    allValues: number[],
  ): Promise<RecordResult> {
    await init()
    const reward = computeReward(state.value, value, allValues, new Date())
    if (!reward.counted) return { counted: false, points: 0, newBadges: [] }

    const scan: ScanRecord = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      label,
      valueEuro: value,
      confidence,
      points: reward.points,
      mode,
      createdAt: new Date(),
    }
    state.value = reward.next
    recent.value = [scan, ...recent.value].slice(0, 10)

    if (cloud.value && uid) {
      try {
        const { saveScan } = await fb()
        await saveScan(uid, reward.next, { label, valueEuro: value, confidence, points: reward.points, mode })
        saveError.value = false
      } catch (e) {
        console.warn('Opslaan mislukt:', e)
        saveError.value = true
      }
    } else {
      writeJson(LOCAL_KEY, toLocal(state.value))
      writeJson(LOCAL_SCANS_KEY, { items: recent.value.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })) })
    }
    return { counted: true, points: reward.points, newBadges: reward.newBadges }
  }

  async function deleteAll(): Promise<void> {
    await init()
    if (cloud.value && uid) {
      const { deleteAllData, resetUser, loadUserState } = await fb()
      await deleteAllData(uid)
      const user = await resetUser()
      uid = user.uid
      state.value = await loadUserState(uid)
    } else {
      removeKey(LOCAL_KEY)
      removeKey(LOCAL_SCANS_KEY)
      state.value = { ...EMPTY_STATE }
    }
    recent.value = []
  }

  return { state, recent, cloud, ready, saveError, init, record, deleteAll }
})
