import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from './index'
import type { Badge, UserState } from '@/lib/reward'

export type ScanMode = 'ask' | 'continuous' | 'counting'

export interface ScanRecord {
  id: string
  label: string
  valueEuro: number
  confidence: number
  points: number
  mode: ScanMode
  createdAt: Date
}

interface UserDoc {
  points: number
  scanCount: number
  seen: number[]
  badges: Badge[]
  streakDays: number
  lastScanAt: Timestamp | null
  lastScanValue: number | null
  lastScanId: string | null
  createdAt: Timestamp
}

const userRef = (uid: string) => doc(getDb(), 'users', uid)
const scansRef = (uid: string) => collection(getDb(), 'users', uid, 'scans')

/** Load the user's totals, creating the document with zeros on first use. */
export async function loadUserState(uid: string): Promise<UserState> {
  const ref = userRef(uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      points: 0,
      scanCount: 0,
      seen: [],
      badges: [],
      streakDays: 0,
      lastScanAt: null,
      lastScanValue: null,
      lastScanId: null,
      createdAt: serverTimestamp(),
    })
    return { points: 0, scanCount: 0, seen: [], badges: [], streakDays: 0, lastScanAt: null, lastScanValue: null }
  }
  const d = snap.data() as UserDoc
  return {
    points: d.points ?? 0,
    scanCount: d.scanCount ?? 0,
    seen: d.seen ?? [],
    badges: d.badges ?? [],
    streakDays: d.streakDays ?? 0,
    lastScanAt: d.lastScanAt?.toDate() ?? null,
    lastScanValue: d.lastScanValue ?? null,
  }
}

/**
 * Store one scan and the new totals in a single batched write, so they can never drift apart.
 * The security rules check that both documents change together.
 */
export async function saveScan(
  uid: string,
  next: UserState,
  scan: { label: string; valueEuro: number; confidence: number; points: number; mode: ScanMode },
): Promise<void> {
  const scanDoc = doc(scansRef(uid))
  const batch = writeBatch(getDb())
  batch.set(scanDoc, {
    label: scan.label.slice(0, 40),
    valueEuro: scan.valueEuro,
    confidence: Math.round(scan.confidence * 1000) / 1000,
    points: scan.points,
    mode: scan.mode,
    createdAt: serverTimestamp(),
  })
  batch.update(userRef(uid), {
    points: next.points,
    scanCount: next.scanCount,
    seen: next.seen,
    badges: next.badges,
    streakDays: next.streakDays,
    lastScanAt: serverTimestamp(),
    lastScanValue: next.lastScanValue,
    lastScanId: scanDoc.id,
  })
  await batch.commit()
}

export async function loadRecentScans(uid: string, max = 10): Promise<ScanRecord[]> {
  const snap = await getDocs(query(scansRef(uid), orderBy('createdAt', 'desc'), limit(max)))
  return snap.docs.map((d) => {
    const data = d.data({ serverTimestamps: 'estimate' })
    return {
      id: d.id,
      label: data.label,
      valueEuro: data.valueEuro,
      confidence: data.confidence,
      points: data.points,
      mode: data.mode,
      createdAt: (data.createdAt as Timestamp | null)?.toDate() ?? new Date(),
    }
  })
}

/** "Wis al mijn gegevens": delete every scan, then the user document. */
export async function deleteAllData(uid: string): Promise<void> {
  const db = getDb()
  for (;;) {
    const snap = await getDocs(query(scansRef(uid), limit(400)))
    if (snap.empty) break
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  const batch = writeBatch(db)
  batch.delete(userRef(uid))
  await batch.commit()
}
