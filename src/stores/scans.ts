import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readJson, removeKey, writeJson } from '@/lib/storage'
import { firebaseEnabled } from '@/firebase/config'
import type { ScanRecord } from '@/firebase/scans'

// The Firebase SDK is loaded on demand (code-split), so the scan button is usable sooner.
const fb = () => Promise.all([import('@/firebase'), import('@/firebase/scans')]).then(([a, b]) => ({ ...a, ...b }))

const LOCAL_KEY = 'geldscan.scans.v2'
const LOCAL_MAX = 100

/**
 * Log of confident recognitions (≥ 90 %), kept silently in the backend.
 * Uses Firestore (anonymous user) when configured, otherwise localStorage.
 */
export const useScanLog = defineStore('scanLog', () => {
  const cloud = ref(false)
  let uid: string | null = null
  let initPromise: Promise<void> | null = null

  function init(): Promise<void> {
    initPromise ??= (async () => {
      if (!firebaseEnabled) return
      try {
        const { ensureUser } = await fb()
        uid = (await ensureUser()).uid
        cloud.value = true
      } catch (e) {
        console.warn('Firebase niet bereikbaar, scans blijven lokaal:', e)
      }
    })()
    return initPromise
  }

  async function record(scan: ScanRecord): Promise<void> {
    await init()
    if (cloud.value && uid) {
      try {
        const { saveScan } = await fb()
        await saveScan(uid, scan)
        return
      } catch (e) {
        console.warn('Opslaan mislukt:', e)
      }
    }
    const items = readJson<{ items: (ScanRecord & { createdAt: string })[] }>(LOCAL_KEY, { items: [] }).items
    writeJson(LOCAL_KEY, { items: [{ ...scan, createdAt: new Date().toISOString() }, ...items].slice(0, LOCAL_MAX) })
  }

  async function deleteAll(): Promise<void> {
    await init()
    if (cloud.value && uid) {
      const { deleteAllData, resetUser } = await fb()
      await deleteAllData(uid)
      uid = (await resetUser()).uid
    }
    removeKey(LOCAL_KEY)
    removeKey('geldscan.points.v1')
    removeKey('geldscan.scans.v1')
  }

  return { cloud, init, record, deleteAll }
})
