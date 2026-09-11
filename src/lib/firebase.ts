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
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';

// eezor.com Firebase Project Credentials (associated with jobs.eezor.com)
export const firebaseConfig = {
  projectId: 'eezor1-1537170168584',
  appId: '1:840352479509:web:45be19193f0a424b85111c',
  apiKey: 'AIzaSyA9iahgzxM8aLZwUxnqWK5DtQcPTNXpw_Q',
  authDomain: 'eezor1-1537170168584.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-naijajobsnigeria-f8a2304a-f7d0-471a-a51c-710cdaeeb89e',
  storageBucket: 'eezor1-1537170168584.firebasestorage.app',
  messagingSenderId: '840352479509',
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
 * Persists a registered member record to Firestore cloud database
 */
export async function saveMemberToCloud(member: any): Promise<boolean> {
  if (!member || !member.email) return false;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(member.email);
    const docRef = doc(db, 'trafficpulse_members', docId);
    await setDoc(docRef, {
      ...member,
      updatedAt: Date.now(),
    }, { merge: true });
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
  const query = (emailOrUsername || '').trim().toLowerCase();
  if (!query) return null;
  try {
    const db = getFirestoreDb();
    // Direct lookup by email docId first (fastest)
    if (query.includes('@')) {
      const docId = emailToDocId(query);
      const snap = await getDoc(doc(db, 'trafficpulse_members', docId));
      if (snap.exists()) {
        return snap.data();
      }
    }
    // Fallback: search all documents (handles usernames or alternate email format)
    const colSnap = await getDocs(collection(db, 'trafficpulse_members'));
    for (const d of colSnap.docs) {
      const data = d.data();
      if (
        data.email?.toLowerCase() === query ||
        (data.username && data.username.toLowerCase() === query)
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
    const colSnap = await getDocs(collection(db, 'trafficpulse_members'));
    const members: any[] = [];
    colSnap.forEach(d => {
      members.push(d.data());
    });
    return members;
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
