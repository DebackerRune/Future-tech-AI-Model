import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

import { firebaseConfig as config, firebaseEnabled } from './config'

export { firebaseEnabled }

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

function init() {
  if (!firebaseEnabled || app) return
  app = initializeApp(config)
  auth = getAuth(app)
  // Offline persistence: scans made without a connection are synced later.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}

export function getDb(): Firestore {
  init()
  if (!db) throw new Error('Firebase is not configured')
  return db
}

/** Anonymous sign-in; resolves with the (persisted) anonymous user. No personal data is asked. */
export async function ensureUser(): Promise<User> {
  init()
  if (!auth) throw new Error('Firebase is not configured')
  const a = auth
  const existing = await new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(a, (u) => {
      unsub()
      resolve(u)
    })
  })
  if (existing) return existing
  const cred = await signInAnonymously(a)
  return cred.user
}

/** Delete the anonymous account itself (after its data is gone) and start fresh. */
export async function resetUser(): Promise<User> {
  init()
  if (!auth) throw new Error('Firebase is not configured')
  try {
    await auth.currentUser?.delete()
  } catch {
    await auth.signOut()
  }
  const cred = await signInAnonymously(auth)
  return cred.user
}
