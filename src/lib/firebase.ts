import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import firebaseConfig from '../../firebase-applet-config.json';
import { ProfileState, Desire, RitualItem, JournalEntry } from '../types';

// ============================================================
// 🔥 FABLE 5 - USING YOUR OLD DATABASE ONLY
// ============================================================
// Project: gen-lang-client-0876553272
// All data (Goals, Vision, Journal, Rituals, Community) 
// will be saved in the SAME Firestore database you created earlier.
// Collections used:
//   - users/{uid}/desires
//   - users/{uid}/vision_board
//   - users/{uid}/journal
//   - users/{uid}/rituals
//   - community_posts
// ============================================================

// ============================================================
// 🔥🔥🔥 FABLE 5 - LOCKED TO YOUR OLD DATABASE ONLY 🔥🔥🔥
// ============================================================
// Project: gen-lang-client-0876553272
// This is THE EXACT same Firebase project + database
// you created and used before.
// All previous data (Goals, Vision Board, Journal, etc.)
// is in this database.
// ============================================================

console.log('%c========================================', 'color:#22c55e;font-size:12px');
console.log('%c[FABLE5] ✅✅✅ USING YOUR OLD DATABASE', 'color:#22c55e;font-weight:bold;font-size:14px');
console.log('%cProject ID: ' + firebaseConfig.projectId, 'color:#22c55e;font-weight:bold');
console.log('%cAll Goals / Vision / Journal will save here', 'color:#22c55e');
console.log('%c========================================', 'color:#22c55e;font-size:12px');

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Explicitly set local persistence so user stays logged in across sessions/refreshes
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Firebase Auth Persistence Set to Local"))
  .catch((error) => console.error("Error setting persistence:", error));

export const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Helper to handle Firestore errors
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };

  try {
    console.error('Firestore Error:', JSON.stringify(errInfo));
  } catch {
    console.error('Firestore Error:', errInfo.error, operationType, path);
  }
  // Do NOT throw an error here, it will crash the React app on quota exceeded or offline states.
}