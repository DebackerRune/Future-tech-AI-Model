import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc, writeBatch, type Firestore } from 'firebase/firestore'

let env: RulesTestEnvironment

const zeroUser = () => ({
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

const scan = (over: Record<string, unknown> = {}) => ({
  label: '20 euro',
  valueEuro: 20,
  confidence: 0.95,
  points: 10,
  mode: 'ask',
  createdAt: serverTimestamp(),
  ...over,
})

const userUpdate = (scanId: string, over: Record<string, unknown> = {}) => ({
  points: 10,
  scanCount: 1,
  seen: [20],
  badges: ['first-scan'],
  streakDays: 1,
  lastScanAt: serverTimestamp(),
  lastScanValue: 20,
  lastScanId: scanId,
  ...over,
})

function scanBatch(db: Firestore, uid: string, scanId: string, s = scan(), u = userUpdate(scanId)) {
  const b = writeBatch(db)
  b.set(doc(db, 'users', uid, 'scans', scanId), s)
  b.update(doc(db, 'users', uid), u)
  return b.commit()
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'bill-detector-37420',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
afterAll(async () => env?.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'users', 'alice'), { ...zeroUser(), createdAt: new Date() })
  })
})

describe('users/{uid}', () => {
  it('owner can read, others cannot', async () => {
    await assertSucceeds(getDoc(doc(env.authenticatedContext('alice').firestore() as unknown as Firestore, 'users', 'alice')))
    await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore() as unknown as Firestore, 'users', 'alice')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore() as unknown as Firestore, 'users', 'alice')))
  })

  it('a new user starts at zero', async () => {
    const db = env.authenticatedContext('carol').firestore() as unknown as Firestore
    await assertSucceeds(setDoc(doc(db, 'users', 'carol'), zeroUser()))
    const db2 = env.authenticatedContext('dave').firestore() as unknown as Firestore
    await assertFails(setDoc(doc(db2, 'users', 'dave'), { ...zeroUser(), points: 1000 }))
  })

  it('points cannot be changed without a scan', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    const b = writeBatch(db)
    b.update(doc(db, 'users', 'alice'), userUpdate('fake'))
    await assertFails(b.commit())
  })
})

describe('scans', () => {
  it('a valid scan + user update in one batch succeeds', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    await assertSucceeds(scanBatch(db, 'alice', 's1'))
  })

  it('rejects confidence below the 90% threshold', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    await assertFails(scanBatch(db, 'alice', 's1', scan({ confidence: 0.8 })))
  })

  it('rejects an unknown note value and invalid points', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    await assertFails(scanBatch(db, 'alice', 's1', scan({ valueEuro: 7 })))
    await assertFails(
      scanBatch(db, 'alice', 's2', scan({ points: 500 }), userUpdate('s2', { points: 500 })),
    )
  })

  it('rejects a scan whose points do not match the user update', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    await assertFails(scanBatch(db, 'alice', 's1', scan({ points: 10 }), userUpdate('s1', { points: 60 })))
  })

  it('rejects a scan written without the user update', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    await assertFails(setDoc(doc(db, 'users', 'alice', 'scans', 's1'), scan()))
  })

  it('nobody can write into another user', async () => {
    const db = env.authenticatedContext('bob').firestore() as unknown as Firestore
    await assertFails(scanBatch(db, 'alice', 's1'))
  })

  it('scans cannot be edited, but the owner can delete them', async () => {
    const db = env.authenticatedContext('alice').firestore() as unknown as Firestore
    await assertSucceeds(scanBatch(db, 'alice', 's1'))
    await assertFails(setDoc(doc(db, 'users', 'alice', 'scans', 's1'), scan({ valueEuro: 50 })))
    const b = writeBatch(db)
    b.delete(doc(db, 'users', 'alice', 'scans', 's1'))
    b.delete(doc(db, 'users', 'alice'))
    await assertSucceeds(b.commit())
  })
})
