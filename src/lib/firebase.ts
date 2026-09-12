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

  try {
    const db = getFirestoreDb();

    // 1. Direct document lookup in 'users' collection if we have cleanId
    if (cleanId) {
      try {
        const snap = await getDoc(doc(db, 'users', cleanId));
        if (snap.exists()) {
          return snap.id;
        }
      } catch (err) {
        console.warn('[FIRESTORE] Direct users doc check error:', err);
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
        console.warn('[FIRESTORE] Query users collection by email check error:', err);
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
  } catch (err) {
    console.warn('[FIRESTORE] Error resolving member UID:', err);
  }

  // Fallback: return cleanId if available, else derive from email
  if (cleanId) return cleanId;
  if (cleanEmail) return emailToDocId(cleanEmail);
  return `user_${Date.now()}`;
}

/**
 * Performs a write operation directly to the Firestore 'users' collection to update the 'trafficBalance' field.
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
  const path = `users/${targetUid}`;
  try {
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', targetUid);

    const payload: Record<string, any> = {
      uid: targetUid,
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
    if (additionalFields.email) {
      payload.email = additionalFields.email;
    }
    if (additionalFields.name) {
      payload.name = additionalFields.name;
    }

    // 1. Primary write operation to Firestore 'users' collection
    await setDoc(userDocRef, payload, { merge: true });

    // 2. Also mirror to 'trafficpulse_members' so all legacy readers stay in sync
    if (additionalFields.email) {
      try {
        const legacyDocId = emailToDocId(additionalFields.email);
        const legacyRef = doc(db, 'trafficpulse_members', legacyDocId);
        await setDoc(legacyRef, payload, { merge: true });
      } catch (legacyErr) {
        console.warn('[FIRESTORE] Legacy mirror write deferred:', legacyErr);
      }
    }

    return { success: true, targetUid };
  } catch (error: any) {
    console.error(`[FIRESTORE] Failed to write trafficBalance to 'users/${targetUid}':`, error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {
      // logged & tracked
    }
    return { success: false, targetUid, error: error?.message || 'Firestore write failed' };
  }
}

/**
 * Persists a registered member record to Firestore cloud database
 */
export async function saveMemberToCloud(member: any): Promise<boolean> {
  if (!member || !member.email) return false;
  try {
    const db = getFirestoreDb();
    const uid = member.uid || member.id || emailToDocId(member.email);

    // 1. Write to 'users' collection (keyed by UID)
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...member,
        uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // 2. Mirror to 'trafficpulse_members' collection
    const docId = emailToDocId(member.email);
    const docRef = doc(db, 'trafficpulse_members', docId);
    await setDoc(
      docRef,
      {
        ...member,
        uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn('Failed to persist member to Firestore cloud database:', e);
    return false;
  }
}

/**
 * Retrieves a registered member from Firestore cloud database by email or username
 */
export async function getMemberFromCloud(emailOrUsername: string): Promise<any | null> {
  const queryStr = (emailOrUsername || '').trim().toLowerCase();
  if (!queryStr) return null;
  try {
    const db = getFirestoreDb();

    // 1. Check 'users' collection first by UID or ID
    try {
      const snap = await getDoc(doc(db, 'users', queryStr));
      if (snap.exists()) {
        return snap.data();
      }
    } catch {}

    // 2. Check 'users' collection by email
    if (queryStr.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', queryStr));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return qSnap.docs[0].data();
        }
      } catch {}
    }

    // 3. Direct lookup by email docId in 'trafficpulse_members'
    if (queryStr.includes('@')) {
      const docId = emailToDocId(queryStr);
      const snap = await getDoc(doc(db, 'trafficpulse_members', docId));
      if (snap.exists()) {
        return snap.data();
      }
    }

    // 4. Fallback: search 'users' collection
    try {
      const usersColSnap = await getDocs(collection(db, 'users'));
      for (const d of usersColSnap.docs) {
        const data = d.data();
        if (
          data.email?.toLowerCase() === queryStr ||
          (data.username && data.username.toLowerCase() === queryStr)
        ) {
          return data;
        }
      }
    } catch {}

    // 5. Fallback: search 'trafficpulse_members'
    const colSnap = await getDocs(collection(db, 'trafficpulse_members'));
    for (const d of colSnap.docs) {
      const data = d.data();
      if (
        data.email?.toLowerCase() === queryStr ||
        (data.username && data.username.toLowerCase() === queryStr)
      ) {
        return data;
      }
    }
    return null;
  } catch (e) {
    console.warn('Failed to query member from Firestore:', e);
    return null;
  }
}

/**
 * Retrieves all registered members from Firestore cloud database
 */
export async function getAllMembersFromCloud(): Promise<any[]> {
  try {
    const db = getFirestoreDb();
    const membersMap = new Map<string, any>();

    // 1. Fetch from 'users' collection
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const data = d.data();
        if (data && data.email) {
          membersMap.set(data.email.toLowerCase(), data);
        }
      });
    } catch (err) {
      console.warn('Failed to get docs from users collection:', err);
    }

    // 2. Fetch from 'trafficpulse_members'
    try {
      const colSnap = await getDocs(collection(db, 'trafficpulse_members'));
      colSnap.forEach((d) => {
        const data = d.data();
        if (data && data.email && !membersMap.has(data.email.toLowerCase())) {
          membersMap.set(data.email.toLowerCase(), data);
        }
      });
    } catch (err) {
      console.warn('Failed to get docs from trafficpulse_members collection:', err);
    }

    return Array.from(membersMap.values());
  } catch (e) {
    console.warn('Failed to get all members from Firestore:', e);
    return [];
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
