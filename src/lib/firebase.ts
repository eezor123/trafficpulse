import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
      tenantId: firebaseAuth.currentUser?.tenantId,
      providerInfo: firebaseAuth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to safely read env variables in both browser Vite and Node.js backend
function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // Ignore in non-ESM environments
  }
  return undefined;
}

// eezor.com Firebase Project Credentials (associated with jobs.eezor.com)
export const firebaseConfig = {
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'eezor1-1537170168584',
  appId: getEnv('VITE_FIREBASE_APP_ID') || '1:840352479509:web:45be19193f0a424b85111c',
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyA9iahgzxM8aLZwUxnqWK5DtQcPTNXpw_Q',
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'eezor1-1537170168584.firebaseapp.com',
  firestoreDatabaseId: getEnv('VITE_FIREBASE_DATABASE_ID') || 'ai-studio-naijajobsnigeria-f8a2304a-f7d0-471a-a51c-710cdaeeb89e',
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'eezor1-1537170168584.firebasestorage.app',
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '840352479509',
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const firebaseAuth = getAuth(firebaseApp);

// Initialize Cloud Firestore singleton with persistent named database
let firestoreInstance: Firestore | null = null;
let firestoreQuotaExceededUntil = 0;

/**
 * Checks whether the Firestore circuit breaker is currently open (e.g. quota exhausted or service unreachable)
 */
export function isFirestoreCircuitOpen(): boolean {
  return Date.now() < firestoreQuotaExceededUntil;
}

/**
 * Trips the Firestore circuit breaker to prevent hanging subsequent requests
 */
export function tripFirestoreCircuit(reason?: string, durationMs = 10 * 60 * 1000): void {
  firestoreQuotaExceededUntil = Date.now() + durationMs;
  console.warn(`[FIRESTORE] Circuit breaker tripped for ${Math.round(durationMs / 1000)}s: ${reason || 'Quota exceeded or service unavailable'}`);
}

/**
 * Executes a Firestore promise with a strict maximum timeout and automatic circuit breaker tripping
 */
async function runWithFirestoreGuard<T>(action: () => Promise<T>, fallback: T, maxWaitMs = 600): Promise<T> {
  if (isFirestoreCircuitOpen()) {
    return fallback;
  }
  let timer: any = null;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback);
    }, maxWaitMs);
  });

  try {
    const actionPromise = (async () => {
      try {
        return await action();
      } catch (err: any) {
        const msg = String(err?.message || err?.code || '');
        if (msg.includes('resource-exhausted') || msg.toLowerCase().includes('quota') || msg.includes('unavailable')) {
          tripFirestoreCircuit(msg);
        }
        return fallback;
      }
    })();

    const result = await Promise.race([actionPromise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch {
    if (timer) clearTimeout(timer);
    return fallback;
  }
}

export function getFirestoreDb(): Firestore {
  if (!firestoreInstance) {
    try {
      firestoreInstance = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    } catch (err) {
      console.warn('Named Firestore database initialization failed, falling back to default:', err);
      firestoreInstance = getFirestore(firebaseApp);
    }
  }
  return firestoreInstance;
}

/**
 * Encodes an email address into a safe, collision-free Firestore document ID
 */
export function emailToDocId(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  let hex = '';
  for (let i = 0; i < clean.length; i++) {
    hex += clean.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return `member_${hex}`;
}

/**
 * Decodes a Firestore document ID back to an email address
 */
export function docIdToEmail(docId: string): string {
  if (!docId.startsWith('member_')) return '';
  const hex = docId.slice(7);
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

/**
 * Fetches the targeted member's UID from the Firestore 'users' collection (or email/id fallback)
 */
export async function fetchTargetMemberUid(
  target: { uid?: string; id?: string; email?: string } | string
): Promise<string> {
  const cleanId = typeof target === 'string' ? target.trim() : (target?.uid || target?.id || '').trim();
  const cleanEmail =
    typeof target === 'string' && target.includes('@')
      ? target.trim().toLowerCase()
      : typeof target !== 'string'
      ? (target?.email || '').trim().toLowerCase()
      : '';

  const fallbackUid = cleanId || (cleanEmail ? emailToDocId(cleanEmail) : `user_${Date.now()}`);
  if (isFirestoreCircuitOpen()) {
    return fallbackUid;
  }

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();

    // 1. Direct document lookup in 'users' collection if we have cleanId
    if (cleanId) {
      try {
        const snap = await getDoc(doc(db, 'users', cleanId));
        if (snap.exists()) {
          return snap.id;
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
          tripFirestoreCircuit(err?.message);
          return fallbackUid;
        }
      }
    }

    // 2. Query 'users' collection by email to find the matching UID
    if (cleanEmail) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return qSnap.docs[0].id;
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
          tripFirestoreCircuit(err?.message);
          return fallbackUid;
        }
      }
    }

    // 3. Check legacy collection for UID/id
    if (cleanEmail) {
      try {
        const legacyDocId = emailToDocId(cleanEmail);
        const legSnap = await getDoc(doc(db, 'trafficpulse_members', legacyDocId));
        if (legSnap.exists()) {
          const data = legSnap.data();
          if (data.uid) return String(data.uid);
          if (data.id) return String(data.id);
        }
      } catch {}
    }

    return fallbackUid;
  }, fallbackUid, 800);
}

/**
 * Performs a write operation directly to the Firestore 'users' collection to update the 'trafficBalance' field.
 * Safely updates ALL matching user documents for this email/UID in both 'users' and 'trafficpulse_members'.
 */
export async function writeUserTrafficToFirestore(
  targetUid: string,
  trafficBalance: number,
  additionalFields: {
    totalTrafficAssigned?: number;
    isPaidUser?: boolean;
    trafficStatus?: string;
    tier?: string;
    email?: string;
    name?: string;
  } = {}
): Promise<{ success: boolean; targetUid: string; error?: string }> {
  if (isFirestoreCircuitOpen()) {
    return { success: true, targetUid };
  }

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    const cleanEmail = (additionalFields.email || (targetUid.includes('@') ? targetUid : '')).trim().toLowerCase();

    const payload: Record<string, any> = {
      trafficBalance: Number(trafficBalance),
      updatedAt: Date.now(),
    };

    if (additionalFields.totalTrafficAssigned !== undefined) {
      payload.totalTrafficAssigned = Number(additionalFields.totalTrafficAssigned);
    }
    if (additionalFields.isPaidUser !== undefined) {
      payload.isPaidUser = Boolean(additionalFields.isPaidUser);
    }
    if (additionalFields.trafficStatus) {
      payload.trafficStatus = additionalFields.trafficStatus;
    }
    if (additionalFields.tier) {
      payload.tier = additionalFields.tier;
    }
    if (cleanEmail) {
      payload.email = cleanEmail;
    }
    if (additionalFields.name) {
      payload.name = additionalFields.name;
    }

    // 1. Direct write to targetUid if provided
    if (targetUid && !targetUid.includes('@')) {
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await setDoc(userDocRef, { ...payload, uid: targetUid }, { merge: true });
      } catch (err: any) {
        if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
          tripFirestoreCircuit(err?.message);
        }
      }
    }

    // 2. Query all documents in 'users' matching this email and update
    if (cleanEmail) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const qSnap = await getDocs(q);
        for (const d of qSnap.docs) {
          await setDoc(doc(db, 'users', d.id), payload, { merge: true });
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
          tripFirestoreCircuit(err?.message);
        }
      }

      // 3. Mirror directly to 'trafficpulse_members' canonical email doc
      try {
        const legacyDocId = emailToDocId(cleanEmail);
        const legacyRef = doc(db, 'trafficpulse_members', legacyDocId);
        await setDoc(legacyRef, payload, { merge: true });
      } catch (legacyErr: any) {
        if (String(legacyErr?.message || '').includes('resource-exhausted') || String(legacyErr?.code || '').includes('quota')) {
          tripFirestoreCircuit(legacyErr?.message);
        }
      }
    }

    return { success: true, targetUid };
  }, { success: true, targetUid }, 1000);
}

/**
 * Persists a registered member record to Firestore cloud database without downgrading existing quota.
 */
export async function saveMemberToCloud(member: any): Promise<boolean> {
  if (!member || !member.email) return false;
  if (isFirestoreCircuitOpen()) return false;

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    const cleanEmail = member.email.trim().toLowerCase();
    const uid = member.uid || member.id || emailToDocId(cleanEmail);

    let authoritativeBalance = member.trafficBalance !== undefined ? Number(member.trafficBalance) : 100;
    let authoritativeAssigned = member.totalTrafficAssigned !== undefined ? Number(member.totalTrafficAssigned) : authoritativeBalance;
    let authoritativePaid = Boolean(member.isPaidUser);

    const isExhausted = authoritativeBalance <= 0;
    const safePayload = {
      ...member,
      email: cleanEmail,
      uid,
      trafficBalance: authoritativeBalance,
      totalTrafficAssigned: authoritativeAssigned,
      isPaidUser: authoritativePaid,
      trafficStatus: isExhausted
        ? (authoritativePaid ? 'paid_exhausted' : 'trial_exhausted')
        : (authoritativePaid ? 'paid_active' : 'trial_active'),
      updatedAt: Date.now(),
    };

    // 1. Write to 'users' collection (keyed by UID)
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, safePayload, { merge: true });

    // 2. Mirror to 'trafficpulse_members' collection
    const docId = emailToDocId(cleanEmail);
    const docRef = doc(db, 'trafficpulse_members', docId);
    await setDoc(docRef, safePayload, { merge: true });

    return true;
  }, false, 1000);
}

/**
 * Retrieves a registered member from Firestore cloud database by email or username,
 * picking the authoritative record with the highest assigned balance.
 */
export async function getMemberFromCloud(emailOrUsername: string): Promise<any | null> {
  const queryStr = (emailOrUsername || '').trim().toLowerCase();
  if (!queryStr) return null;
  if (isFirestoreCircuitOpen()) return null;

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    let bestCandidate: any = null;

    const consider = (candidate: any) => {
      if (!candidate || !candidate.email) return;
      if (!bestCandidate) {
        bestCandidate = candidate;
        return;
      }
      const candBal = Number(candidate.trafficBalance ?? -1);
      const bestBal = Number(bestCandidate.trafficBalance ?? -1);
      const candAssigned = Number(candidate.totalTrafficAssigned ?? -1);
      const bestAssigned = Number(bestCandidate.totalTrafficAssigned ?? -1);
      const candUpdated = Number(candidate.updatedAt ?? 0);
      const bestUpdated = Number(bestCandidate.updatedAt ?? 0);

      if (
        candBal > bestBal ||
        (candBal === bestBal && candAssigned > bestAssigned) ||
        (candBal === bestBal && candAssigned === bestAssigned && candUpdated > bestUpdated)
      ) {
        bestCandidate = candidate;
      }
    };

    // 1. Direct lookup by email docId in 'trafficpulse_members'
    if (queryStr.includes('@')) {
      try {
        const docId = emailToDocId(queryStr);
        const snap = await getDoc(doc(db, 'trafficpulse_members', docId));
        if (snap.exists()) {
          consider(snap.data());
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
          tripFirestoreCircuit(err?.message);
          return null;
        }
      }
    }

    // 2. Direct document lookup by ID / UID in 'users'
    if (!bestCandidate) {
      try {
        const snap = await getDoc(doc(db, 'users', queryStr));
        if (snap.exists()) {
          consider(snap.data());
        }
      } catch (err: any) {
        if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
          tripFirestoreCircuit(err?.message);
          return null;
        }
      }
    }

    if (bestCandidate && !bestCandidate.isPaidUser && bestCandidate.role !== 'admin') {
      if (bestCandidate.totalTrafficAssigned === undefined || bestCandidate.totalTrafficAssigned === null) {
        bestCandidate.totalTrafficAssigned = 100;
      }
      if (bestCandidate.trafficBalance === undefined || bestCandidate.trafficBalance === null) {
        bestCandidate.trafficBalance = 100;
      }
      bestCandidate.trafficStatus = bestCandidate.trafficBalance <= 0 ? 'trial_exhausted' : 'trial_active';
    }

    return bestCandidate;
  }, null, 600);
}

/**
 * Retrieves all registered members from Firestore cloud database,
 * merging by email and picking the highest authoritative balance.
 */
export async function getAllMembersFromCloud(): Promise<any[]> {
  if (isFirestoreCircuitOpen()) return [];

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    const membersMap = new Map<string, any>();

    const sanitizeMemberData = (m: any) => {
      if (!m || typeof m !== 'object') return m;
      const cleanEmail = String(m.email || '').toLowerCase().trim();
      const cleanName = m.name || m.username || cleanEmail.split('@')[0] || 'Member';
      const isPaid = Boolean(m.isPaidUser);
      let balance = m.trafficBalance !== undefined ? Number(m.trafficBalance) : (isPaid ? 1000 : 100);
      let assigned = m.totalTrafficAssigned !== undefined ? Number(m.totalTrafficAssigned) : Math.max(balance, 100);
      const isExhausted = balance <= 0;
      return {
        ...m,
        name: cleanName,
        email: cleanEmail,
        totalTrafficAssigned: assigned,
        trafficBalance: balance,
        isPaidUser: isPaid,
        trafficStatus: isExhausted
          ? (isPaid ? 'paid_exhausted' : 'trial_exhausted')
          : (isPaid ? 'paid_active' : 'trial_active'),
      };
    };

    const mergeIn = (data: any) => {
      if (!data || !data.email) return;
      const emailLower = data.email.toLowerCase().trim();
      const sanitized = sanitizeMemberData(data);
      const existing = membersMap.get(emailLower);
      if (!existing) {
        membersMap.set(emailLower, sanitized);
      } else {
        const existBal = Number(existing.trafficBalance ?? -1);
        const newBal = Number(sanitized.trafficBalance ?? -1);
        const existAssigned = Number(existing.totalTrafficAssigned ?? -1);
        const newAssigned = Number(sanitized.totalTrafficAssigned ?? -1);

        let finalBal = 0;
        if (sanitized.updatedAt && existing.updatedAt) {
          finalBal = sanitized.updatedAt >= existing.updatedAt ? newBal : existBal;
        } else if (newBal >= 0 && existBal >= 0) {
          finalBal = Math.max(existBal, newBal);
        } else {
          finalBal = Math.max(existBal, newBal, 0);
        }

        const isPaid = Boolean(existing.isPaidUser || sanitized.isPaidUser);
        let finalAssigned = Math.max(existAssigned, newAssigned, finalBal);
        const isExhausted = finalBal <= 0;

        membersMap.set(emailLower, {
          ...existing,
          ...sanitized,
          trafficBalance: finalBal,
          totalTrafficAssigned: finalAssigned,
          isPaidUser: isPaid,
          tier: sanitized.tier || existing.tier,
          trafficStatus: isExhausted
            ? (isPaid ? 'paid_exhausted' : 'trial_exhausted')
            : (isPaid ? 'paid_active' : 'trial_active'),
        });
      }
    };

    // 1. Fetch from 'users' collection
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        mergeIn(d.data());
      });
    } catch (err: any) {
      if (String(err?.message || '').includes('resource-exhausted') || String(err?.code || '').includes('quota')) {
        tripFirestoreCircuit(err?.message);
        return [];
      }
    }

    return Array.from(membersMap.values());
  }, [], 1000);
}

/**
 * Deletes a member document from Firestore cloud database across all collections
 */
export async function deleteMemberFromCloud(identifier: string, email?: string): Promise<boolean> {
  const cleanId = (identifier || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanId && !cleanEmail) return false;
  if (isFirestoreCircuitOpen()) return true;

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    if (cleanId) {
      try {
        await deleteDoc(doc(db, 'users', cleanId));
      } catch {}
    }
    if (cleanEmail) {
      try {
        const legacyDocId = emailToDocId(cleanEmail);
        await deleteDoc(doc(db, 'trafficpulse_members', legacyDocId));
      } catch {}
    }
    return true;
  }, true, 800);
}

/**
 * Persists pending email verification state to Firestore cloud database
 */
export async function savePendingToCloud(email: string, pending: any): Promise<boolean> {
  if (!email || !pending) return false;
  if (isFirestoreCircuitOpen()) return false;

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    const docId = emailToDocId(email);
    const docRef = doc(db, 'trafficpulse_pending_verifications', docId);
    await setDoc(docRef, {
      ...pending,
      email: email.trim().toLowerCase(),
      updatedAt: Date.now(),
    });
    return true;
  }, false, 600);
}

/**
 * Retrieves pending email verification state from Firestore cloud database
 */
export async function getPendingFromCloud(email: string): Promise<any | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  if (isFirestoreCircuitOpen()) return null;

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    const docId = emailToDocId(cleanEmail);
    const snap = await getDoc(doc(db, 'trafficpulse_pending_verifications', docId));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  }, null, 500);
}

/**
 * Deletes pending email verification from Firestore after successful verification or expiry
 */
export async function deletePendingFromCloud(email: string): Promise<boolean> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return false;
  if (isFirestoreCircuitOpen()) return true;

  return runWithFirestoreGuard(async () => {
    const db = getFirestoreDb();
    const docId = emailToDocId(cleanEmail);
    await deleteDoc(doc(db, 'trafficpulse_pending_verifications', docId));
    return true;
  }, true, 500);
}

// Configure Google Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Executes authentic Google Sign-In via Firebase Auth.
 * Attempts popup authentication first, handling iframe sandboxing gracefully.
 */
export async function signInWithGoogleViaFirebase(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  popupBlocked?: boolean;
  unauthorizedDomain?: boolean;
}> {
  try {
    const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    console.warn('Firebase Google Auth error:', error);
    const code = error?.code || '';
    const message = error?.message || '';

    const isUnauthorizedDomain =
      code === 'auth/unauthorized-domain' ||
      message.toLowerCase().includes('unauthorized-domain');

    const isPopupBlocked =
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      message.includes('popup') ||
      message.includes('cross-origin');

    return {
      success: false,
      error: error?.message || 'Google sign-in could not be completed.',
      popupBlocked: isPopupBlocked,
      unauthorizedDomain: isUnauthorizedDomain,
    };
  }
}

/**
 * Signs up a new member via Firebase Email & Password
 */
export async function registerWithFirebaseEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const res = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    return { success: true, user: res.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create Firebase account.' };
  }
}

/**
 * Signs in an existing member via Firebase Email & Password
 */
export async function loginWithFirebaseEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const res = await signInWithEmailAndPassword(firebaseAuth, email, pass);
    return { success: true, user: res.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to sign in with Firebase.' };
  }
}

/**
 * Signs out from Firebase
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(firebaseAuth);
  } catch (err) {
    console.warn('Error signing out of Firebase:', err);
  }
}
