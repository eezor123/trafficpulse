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
