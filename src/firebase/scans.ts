import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { getDb } from './index'

export type ScanMode = 'ask' | 'counting'

export interface ScanRecord {
  label: string
  valueEuro: number
  confidence: number
  mode: ScanMode
}

const scansRef = (uid: string) => collection(getDb(), 'users', uid, 'scans')

/** Store one confident (≥ 90 %) recognition. No image, no audio — only the result. */
export async function saveScan(uid: string, scan: ScanRecord): Promise<void> {
  await addDoc(scansRef(uid), {
    label: scan.label.slice(0, 40),
    valueEuro: scan.valueEuro,
    confidence: Math.round(scan.confidence * 1000) / 1000,
    mode: scan.mode,
    createdAt: serverTimestamp(),
  })
}

/** "Wis al mijn gegevens": delete every scan (and the old user document from the points version). */
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
  batch.delete(doc(db, 'users', uid))
  await batch.commit()
}
