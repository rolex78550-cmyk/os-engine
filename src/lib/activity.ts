import { db } from './firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

let currentSessionId: string | null = null;
let sessionStartTime: number | null = null;
let currentUserId: string | null = null;

export async function startUserSession(userId: string, userEmail?: string, userName?: string) {
  if (!userId) return;

  currentUserId = userId;
  sessionStartTime = Date.now();
  currentSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    // Create a new session document
    await setDoc(doc(db, 'user_sessions', currentSessionId), {
      userId,
      userEmail: userEmail || null,
      userName: userName || null,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      pagesVisited: [],
      totalTimeSpentMs: 0,
      isActive: true,
    });

    // Also update user last login
    await setDoc(doc(db, 'users', userId), {
      lastLoginAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });

    console.log('[Activity] Session started:', currentSessionId);
  } catch (e) {
    console.warn('[Activity] Failed to start session', e);
  }
}

export async function logPageVisit(page: string) {
  if (!currentSessionId || !currentUserId) return;

  try {
    const sessionRef = doc(db, 'user_sessions', currentSessionId);
    
    // Add to pagesVisited array (use arrayUnion if you want, but for simplicity we overwrite)
    await updateDoc(sessionRef, {
      lastActiveAt: new Date().toISOString(),
      [`pagesVisited.${Date.now()}`]: {
        page,
        timestamp: new Date().toISOString()
      }
    });

    // Update user last active
    await setDoc(doc(db, 'users', currentUserId), {
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });

  } catch (e) {
    console.warn('[Activity] Failed to log page visit', e);
  }
}

export async function endUserSession() {
  if (!currentSessionId || !sessionStartTime) return;

  const endTime = Date.now();
  const timeSpent = endTime - sessionStartTime;

  try {
    const sessionRef = doc(db, 'user_sessions', currentSessionId);
    
    await updateDoc(sessionRef, {
      endedAt: new Date().toISOString(),
      totalTimeSpentMs: timeSpent,
      isActive: false,
      lastActiveAt: new Date().toISOString(),
    });

    // Update total time on user doc
    await setDoc(doc(db, 'users', currentUserId!), {
      totalTimeSpentMs: increment(timeSpent),
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });

    console.log('[Activity] Session ended. Time spent:', Math.round(timeSpent / 1000), 'seconds');
  } catch (e) {
    console.warn('[Activity] Failed to end session', e);
  }

  currentSessionId = null;
  sessionStartTime = null;
  currentUserId = null;
}

// Auto end session on tab close / refresh
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (currentSessionId) {
      // Fire and forget
      navigator.sendBeacon?.('/api/session-end', JSON.stringify({ sessionId: currentSessionId }));
      // Fallback: try to write (may not complete)
      endUserSession();
    }
  });
}
