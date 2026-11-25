import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const scan = (over: Record<string, unknown> = {}) => ({
  label: '20 euro',
  valueEuro: 20,
  confidence: 0.95,
  mode: 'ask',
  createdAt: serverTimestamp(),
  ...over,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'bill-detector-37420',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
afterAll(async () => env?.cleanup())
beforeEach(async () => env.clearFirestore())

describe('firestore.rules', () => {
  const alice = () => env.authenticatedContext('alice').firestore()
  const scanDoc = (id = 's1') => doc(alice(), 'users', 'alice', 'scans', id)

  it('stores a valid scan of the owner', async () => {
    await assertSucceeds(setDoc(scanDoc(), scan()))
    await assertSucceeds(getDoc(scanDoc()))
  })

  it('refuses scans below 90 %, unknown notes, extra fields or a fake time', async () => {
    await assertFails(setDoc(scanDoc('a'), scan({ confidence: 0.89 })))
    await assertFails(setDoc(scanDoc('b'), scan({ valueEuro: 30 })))
    await assertFails(setDoc(scanDoc('c'), scan({ points: 10 })))
    await assertFails(setDoc(scanDoc('d'), scan({ createdAt: new Date(2000, 0, 1) })))
    await assertFails(setDoc(scanDoc('e'), scan({ mode: 'other' })))
  })

  it('other users and visitors cannot read or write', async () => {
    await assertSucceeds(setDoc(scanDoc(), scan()))
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'scans', 's1')))
    await assertFails(setDoc(doc(bob, 'users', 'alice', 'scans', 's2'), scan()))
    const guest = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(guest, 'users', 'alice', 'scans', 's1')))
  })

  it('scans cannot be edited, but the owner can delete them', async () => {
    await assertSucceeds(setDoc(scanDoc(), scan()))
    await assertFails(updateDoc(scanDoc(), { valueEuro: 50 }))
    await assertSucceeds(deleteDoc(scanDoc()))
  })

  it('the old user document can only be deleted by its owner', async () => {
    await assertFails(setDoc(doc(alice(), 'users', 'alice'), { points: 1000 }))
    await assertSucceeds(deleteDoc(doc(alice(), 'users', 'alice')))
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(deleteDoc(doc(bob, 'users', 'alice')))
  })
})
