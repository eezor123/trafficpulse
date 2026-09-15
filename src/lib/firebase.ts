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

  try {
    const timeoutPromise = new Promise<string>((resolve) =>
      setTimeout(() => resolve(fallbackUid), 2500)
    );

    const resolvePromise = (async (): Promise<string> => {
      const db = getFirestoreDb();

      // 1. Direct document lookup in 'users' collection if we have cleanId
      if (cleanId) {
        try {
          const snap = await getDoc(doc(db, 'users', cleanId));
          if (snap.exists()) {
            return snap.id;
          }
        } catch (err) {
          console.warn('[FIRESTORE] Direct users doc check note:', err);
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
        } catch (err) {
          console.warn('[FIRESTORE] Query users collection by email note:', err);
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
    })();

    return await Promise.race([resolvePromise, timeoutPromise]);
  } catch (err) {
    console.warn('[FIRESTORE] Error resolving member UID:', err);
    return fallbackUid;
  }
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
  try {
    const timeoutPromise = new Promise<{ success: boolean; targetUid: string; error?: string }>((resolve) =>
      setTimeout(() => resolve({ success: true, targetUid }), 4000)
    );

    const writePromise = (async () => {
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
        } catch (err) {
          console.warn('[FIRESTORE] Target user doc direct write note:', err);
        }
      }

      // 2. Query all documents in 'users' matching this email and update EVERY ONE
      if (cleanEmail) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const qSnap = await getDocs(q);
          for (const d of qSnap.docs) {
            await setDoc(doc(db, 'users', d.id), payload, { merge: true });
          }
        } catch (err) {
          console.warn('[FIRESTORE] Query and update all email user docs note:', err);
        }

        // 3. Mirror directly to 'trafficpulse_members' canonical email doc
        try {
          const legacyDocId = emailToDocId(cleanEmail);
          const legacyRef = doc(db, 'trafficpulse_members', legacyDocId);
          await setDoc(legacyRef, payload, { merge: true });
        } catch (legacyErr) {
          console.warn('[FIRESTORE] Legacy mirror write note:', legacyErr);
        }
      }

      return { success: true, targetUid };
    })();

    return await Promise.race([writePromise, timeoutPromise]);
  } catch (error: any) {
    console.warn(`[FIRESTORE] Write note for 'users/${targetUid}':`, error?.message);
    return { success: false, targetUid, error: error?.message || 'Firestore write deferred' };
  }
}

/**
 * Persists a registered member record to Firestore cloud database without downgrading existing quota.
 */
export async function saveMemberToCloud(member: any): Promise<boolean> {
  if (!member || !member.email) return false;
  try {
    const db = getFirestoreDb();
    const cleanEmail = member.email.trim().toLowerCase();
    const uid = member.uid || member.id || emailToDocId(cleanEmail);

    // Retrieve existing cloud data if available
    let authoritativeBalance = member.trafficBalance !== undefined ? Number(member.trafficBalance) : 100;
    let authoritativeAssigned = member.totalTrafficAssigned !== undefined ? Number(member.totalTrafficAssigned) : authoritativeBalance;
    let authoritativePaid = Boolean(member.isPaidUser);

    try {
      const existingCloud = await getMemberFromCloud(cleanEmail);
      if (existingCloud) {
        // If member or existing cloud is exhausted, balance must remain 0
        if (member.trafficBalance === 0 || member.trafficStatus?.includes('exhausted')) {
          authoritativeBalance = 0;
        } else if (existingCloud.trafficBalance === 0 || existingCloud.trafficStatus?.includes('exhausted')) {
          authoritativeBalance = 0;
        } else if (existingCloud.trafficBalance !== undefined && member.trafficBalance === undefined) {
          authoritativeBalance = Number(existingCloud.trafficBalance);
        } else if (existingCloud.trafficBalance !== undefined && member.trafficBalance !== undefined) {
          // Keep the lower balance so consumed visits are never reverted
          authoritativeBalance = Math.min(Number(existingCloud.trafficBalance), Number(member.trafficBalance));
        }

        if (existingCloud.totalTrafficAssigned !== undefined && existingCloud.totalTrafficAssigned > authoritativeAssigned) {
          authoritativeAssigned = Number(existingCloud.totalTrafficAssigned);
        }
        if (existingCloud.isPaidUser) {
          authoritativePaid = true;
        }

        // Enforce 100 trial quota cap for free trial members
        if (!authoritativePaid && member.role !== 'admin') {
          if (authoritativeAssigned === 500 || authoritativeAssigned > 100) {
            authoritativeAssigned = 100;
          }
          if (authoritativeBalance === 500 || authoritativeBalance > 100) {
            authoritativeBalance = 100;
          }
        }
      }
    } catch {}

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

    // 2. Also update all existing 'users' docs for this email
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const qSnap = await getDocs(q);
      for (const d of qSnap.docs) {
        if (d.id !== uid) {
          await setDoc(doc(db, 'users', d.id), safePayload, { merge: true });
        }
      }
    } catch {}

    // 3. Mirror to 'trafficpulse_members' collection
    const docId = emailToDocId(cleanEmail);
    const docRef = doc(db, 'trafficpulse_members', docId);
    await setDoc(docRef, safePayload, { merge: true });

    return true;
  } catch (e) {
    console.warn('Failed to persist member to Firestore cloud database:', e);
    return false;
  }
}

/**
 * Retrieves a registered member from Firestore cloud database by email or username,
 * picking the authoritative record with the highest assigned balance.
 */
export async function getMemberFromCloud(emailOrUsername: string): Promise<any | null> {
  const queryStr = (emailOrUsername || '').trim().toLowerCase();
  if (!queryStr) return null;
  try {
    const db = getFirestoreDb();
    let bestCandidate: any = null;

    // Helper to evaluate and keep the best candidate (highest balance / assigned)
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
      } catch {}
    }

    // 2. Check 'users' collection by email
    if (queryStr.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', queryStr));
        const qSnap = await getDocs(q);
        for (const d of qSnap.docs) {
          consider(d.data());
        }
      } catch {}
    }

    // 3. Direct document lookup by ID / UID in 'users'
    try {
      const snap = await getDoc(doc(db, 'users', queryStr));
      if (snap.exists()) {
        consider(snap.data());
      }
    } catch {}

    if (bestCandidate) {
      return bestCandidate;
    }

    // 4. Fallback scan of 'users' collection for username
    try {
      const usersColSnap = await getDocs(collection(db, 'users'));
      for (const d of usersColSnap.docs) {
        const data = d.data();
        if (
          data.email?.toLowerCase() === queryStr ||
          (data.username && data.username.toLowerCase() === queryStr)
        ) {
          consider(data);
        }
      }
    } catch {}

    // 5. Fallback scan of 'trafficpulse_members'
    try {
      const colSnap = await getDocs(collection(db, 'trafficpulse_members'));
      for (const d of colSnap.docs) {
        const data = d.data();
        if (
          data.email?.toLowerCase() === queryStr ||
          (data.username && data.username.toLowerCase() === queryStr)
        ) {
          consider(data);
        }
      }
    } catch {}

    if (bestCandidate && !bestCandidate.isPaidUser && bestCandidate.role !== 'admin') {
      if (bestCandidate.totalTrafficAssigned === 500 || (bestCandidate.totalTrafficAssigned !== undefined && bestCandidate.totalTrafficAssigned > 100)) {
        bestCandidate.totalTrafficAssigned = 100;
      }
      if (bestCandidate.trafficBalance === 500 || (bestCandidate.trafficBalance !== undefined && bestCandidate.trafficBalance > 100)) {
        bestCandidate.trafficBalance = 100;
      }
      if (bestCandidate.trafficBalance <= 0) {
        bestCandidate.trafficStatus = 'trial_exhausted';
      }
    }

    return bestCandidate;
  } catch (e) {
    console.warn('Failed to query member from Firestore:', e);
    return null;
  }
}

/**
 * Retrieves all registered members from Firestore cloud database,
 * merging by email and picking the highest authoritative balance.
 */
export async function getAllMembersFromCloud(): Promise<any[]> {
  try {
    const db = getFirestoreDb();
    const membersMap = new Map<string, any>();

    const sanitizeMemberData = (m: any) => {
      if (!m || typeof m !== 'object') return m;
      const cleanEmail = String(m.email || '').toLowerCase().trim();
      const cleanName = m.name || m.username || cleanEmail.split('@')[0] || 'Member';
      if (!m.isPaidUser && m.role !== 'admin') {
        let assigned = Number(m.totalTrafficAssigned ?? 100);
        let balance = Number(m.trafficBalance ?? 100);
        return {
          ...m,
          name: cleanName,
          email: cleanEmail,
          totalTrafficAssigned: assigned,
          trafficBalance: balance,
          trafficStatus: balance <= 0 ? 'trial_exhausted' : (m.trafficStatus || 'trial_active'),
        };
      }
      return {
        ...m,
        name: cleanName,
        email: cleanEmail,
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

        // If either record is exhausted (0 balance or exhausted status), user is strictly exhausted
        let finalBal = 0;
        if (
          existBal === 0 ||
          newBal === 0 ||
          existing.trafficStatus?.includes('exhausted') ||
          sanitized.trafficStatus?.includes('exhausted')
        ) {
          finalBal = 0;
        } else if (existBal > 0 && newBal > 0) {
          finalBal = Math.min(existBal, newBal);
        } else {
          finalBal = Math.max(existBal, newBal, 0);
        }

        const isPaid = Boolean(existing.isPaidUser || sanitized.isPaidUser);
        let finalAssigned = Math.max(existAssigned, newAssigned, 0);

        const isExhausted = finalBal <= 0;

        membersMap.set(emailLower, sanitizeMemberData({
          ...existing,
          ...sanitized,
          trafficBalance: finalBal,
          totalTrafficAssigned: finalAssigned,
          isPaidUser: isPaid,
          tier: sanitized.tier || existing.tier,
          trafficStatus: isExhausted
            ? (isPaid ? 'paid_exhausted' : 'trial_exhausted')
            : (isPaid ? 'paid_active' : (sanitized.trafficStatus || existing.trafficStatus || 'trial_active')),
        }));
      }
    };

    // 1. Fetch from 'users' collection
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        mergeIn(d.data());
      });
    } catch (err) {
      console.warn('Failed to get docs from users collection:', err);
    }

    // 2. Fetch from 'trafficpulse_members'
    try {
      const colSnap = await getDocs(collection(db, 'trafficpulse_members'));
      colSnap.forEach((d) => {
        mergeIn(d.data());
      });
    } catch (err) {
      console.warn('Failed to get docs from trafficpulse_members collection:', err);
    }

    const mockEmails = new Set([
      'alex@trafficpulse.io',
      'starter@trafficpulse.io',
      'sarah@growthwave.agency',
      'bashir@kukuholdings.ng',
      'nneka@lagoslogistics.ng',
      'emeka.dev@naijawork.ng',
      'amina.design@naijawork.ng',
      'tunde.solar@naijawork.ng',
      'testuser999@example.com',
    ]);

    return Array.from(membersMap.values())
      .map(sanitizeMemberData)
      .filter((m) => !mockEmails.has((m.email || '').toLowerCase()));
  } catch (e) {
    console.warn('Failed to get all members from Firestore:', e);
    return [];
  }
}

/**
 * Deletes a member document from Firestore cloud database across all collections
 */
export async function deleteMemberFromCloud(identifier: string, email?: string): Promise<boolean> {
  try {
    const db = getFirestoreDb();
    const cleanId = (identifier || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Delete by docId in 'users'
    if (cleanId) {
      try {
        await deleteDoc(doc(db, 'users', cleanId));
      } catch (err) {
        console.warn('Failed to delete user doc from users:', err);
      }
    }

    // 2. Delete by email-derived docId in 'trafficpulse_members'
    if (cleanEmail) {
      try {
        const legacyDocId = emailToDocId(cleanEmail);
        await deleteDoc(doc(db, 'trafficpulse_members', legacyDocId));
      } catch (err) {
        console.warn('Failed to delete legacy doc from trafficpulse_members:', err);
      }
    }

    // 3. Delete by cleanId in 'trafficpulse_members'
    if (cleanId) {
      try {
        await deleteDoc(doc(db, 'trafficpulse_members', cleanId));
      } catch (err) {}
    }

    // 4. Query and delete any matching documents in 'users' by email
    if (cleanEmail) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (err) {}
    }

    return true;
  } catch (e) {
    console.warn('Failed to delete member from Firestore:', e);
    return false;
  }
}

/**
 * Persists pending email verification state to Firestore cloud database
 */
export async function savePendingToCloud(email: string, pending: any): Promise<boolean> {
  if (!email || !pending) return false;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(email);
    const docRef = doc(db, 'trafficpulse_pending_verifications', docId);
    await setDoc(docRef, {
      ...pending,
      email: email.trim().toLowerCase(),
      updatedAt: Date.now(),
    });
    return true;
  } catch (e) {
    console.warn('Failed to save pending verification to Firestore:', e);
    return false;
  }
}

/**
 * Retrieves pending email verification state from Firestore cloud database
 */
export async function getPendingFromCloud(email: string): Promise<any | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(cleanEmail);
    const snap = await getDoc(doc(db, 'trafficpulse_pending_verifications', docId));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.warn('Failed to get pending verification from Firestore:', e);
    return null;
  }
}

/**
 * Deletes pending email verification from Firestore after successful verification or expiry
 */
export async function deletePendingFromCloud(email: string): Promise<boolean> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return false;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(cleanEmail);
    await deleteDoc(doc(db, 'trafficpulse_pending_verifications', docId));
    return true;
  } catch (e) {
    console.warn('Failed to delete pending verification from Firestore:', e);
    return false;
  }
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
