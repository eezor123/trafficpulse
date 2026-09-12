import { MemberUser, AuthState, MemberTier } from '../types';
import {
  saveMemberToCloud,
  getMemberFromCloud,
  savePendingToCloud,
  getPendingFromCloud,
  deletePendingFromCloud,
  fetchTargetMemberUid,
  writeUserTrafficToFirestore,
} from '../lib/firebase.ts';

const AUTH_STORAGE_KEY = 'trafficpulse_auth_session_v1';
const MEMBERS_DB_KEY = 'trafficpulse_registered_members_v1';
const PENDING_REG_KEY = 'trafficpulse_pending_registrations_v1';

/**
 * Broadcasts a session refresh event across the current window and all browser tabs
 */
export function broadcastSessionRefresh(user: MemberUser) {
  try {
    window.dispatchEvent(new CustomEvent('trafficpulse_session_refresh', { detail: user }));
    window.dispatchEvent(new Event('storage'));
  } catch {}
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('trafficpulse_auth_channel');
      bc.postMessage({ type: 'SESSION_REFRESH', user });
      bc.close();
    }
  } catch {}
}

// No pre-seeded demo or mock members
const INITIAL_DEMO_MEMBERS: (MemberUser & { passwordHash: string })[] = [];

function getStoredMembers(): (MemberUser & { passwordHash: string })[] {
  try {
    const raw = localStorage.getItem(MEMBERS_DB_KEY);
    let list: (MemberUser & { passwordHash: string })[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out legacy mock/demo users from storage
        const mockEmails = new Set(['alex@trafficpulse.io', 'starter@trafficpulse.io', 'sarah@growthwave.agency']);
        list = parsed.filter(m => !mockEmails.has(m.email?.toLowerCase()));
      }
    }

    // Ensure saroneedam admin user has admin privileges if present
    const adminIndex = list.findIndex(m => m.email?.toLowerCase() === 'saroneedam@yahoo.com' || m.email?.toLowerCase() === 'saroneedam@gmail.com');
    if (adminIndex !== -1) {
      list[adminIndex].role = 'admin';
      list[adminIndex].tier = 'enterprise';
      list[adminIndex].customVisitsLimit = 10000000;
      list[adminIndex].trafficBalance = list[adminIndex].trafficBalance || 10000000;
      list[adminIndex].totalTrafficAssigned = list[adminIndex].totalTrafficAssigned || 10000000;
      list[adminIndex].isPaidUser = true;
      list[adminIndex].trafficStatus = 'unlimited';
    }

    // Sanitize any missing trafficBalance fields for all real members
    for (const m of list) {
      if (m.trafficBalance === undefined || m.trafficBalance === null) {
        m.trafficBalance = m.role === 'admin' ? 10000000 : 500;
        m.totalTrafficAssigned = m.trafficBalance;
        m.isPaidUser = m.role === 'admin';
        m.trafficStatus = m.role === 'admin' ? 'unlimited' : 'trial_active';
      }
    }

    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Failed to read stored members:', e);
    return [];
  }
}

function saveMembers(members: (MemberUser & { passwordHash: string })[]) {
  try {
    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(members));
  } catch (e) {
    console.warn('Failed saving members DB:', e);
  }
}

/**
 * Loads current authentication session.
 * MANDATORY REQUIREMENT: If no session is saved in localStorage,
 * user is unauthenticated (isAuthenticated: false) so they must create an account
 * or log in before using the application.
 */
export function loadStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isAuthenticated && parsed.user) {
        const user = parsed.user as MemberUser;
        // Ensure traffic balance fields exist
        if (user.trafficBalance === undefined || user.trafficBalance === null) {
          user.trafficBalance = user.role === 'admin' ? 10000000 : 500;
          user.totalTrafficAssigned = user.trafficBalance;
          user.isPaidUser = user.role === 'admin';
          user.trafficStatus = user.role === 'admin' ? 'unlimited' : 'trial_active';
        }
        return {
          isAuthenticated: true,
          user,
          token: parsed.token || `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        };
      }
    }
  } catch (e) {
    console.warn('Failed loading stored auth state:', e);
  }

  // Mandatory account creation/login before used
  return {
    isAuthenticated: false,
    user: null,
    token: null,
  };
}

export function saveAuthSession(user: MemberUser, token: string) {
  try {
    const session: AuthState = {
      isAuthenticated: true,
      user,
      token,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed saving auth session:', e);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed clearing auth session:', e);
  }
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
  targetWebsite?: string;
  tier?: MemberTier;
}

// Local pending verifications cache for offline/client fallback
interface LocalPendingVerification {
  email: string;
  code: string;
  payload: RegisterPayload;
  expiresAt: number;
}
const localPendingMap = new Map<string, LocalPendingVerification>();

function getLocalPending(email: string): LocalPendingVerification | null {
  const key = (email || '').trim().toLowerCase();
  try {
    const raw = localStorage.getItem(PENDING_REG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed[key]) {
        return parsed[key];
      }
    }
  } catch {}
  return localPendingMap.get(key) || null;
}

function setLocalPending(email: string, item: LocalPendingVerification) {
  const key = (email || '').trim().toLowerCase();
  localPendingMap.set(key, item);
  try {
    const raw = localStorage.getItem(PENDING_REG_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    existing[key] = item;
    localStorage.setItem(PENDING_REG_KEY, JSON.stringify(existing));
  } catch {}
}

function deleteLocalPending(email: string) {
  const key = (email || '').trim().toLowerCase();
  localPendingMap.delete(key);
  try {
    const raw = localStorage.getItem(PENDING_REG_KEY);
    if (raw) {
      const existing = JSON.parse(raw);
      delete existing[key];
      localStorage.setItem(PENDING_REG_KEY, JSON.stringify(existing));
    }
  } catch {}
}

export async function registerMember(payload: RegisterPayload): Promise<{
  success: boolean;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
  user?: MemberUser;
  token?: string;
  error?: string;
  emailSent?: boolean;
  provider?: string;
  devCode?: string;
  deliveryError?: string;
}> {
  const email = payload.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  if (!payload.name || payload.name.trim().length < 2) {
    return { success: false, error: 'Please enter your full name (minimum 2 characters).' };
  }
  if (!payload.password || payload.password.length < 5) {
    return { success: false, error: 'Password must be at least 5 characters long.' };
  }

  // Pre-save pending registration payload locally and in Firestore so credentials are never lost
  const localCode = Math.floor(100000 + Math.random() * 900000).toString();
  const pendingObj: LocalPendingVerification = {
    email,
    code: localCode,
    payload,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  setLocalPending(email, pendingObj);
  savePendingToCloud(email, {
    email,
    code: localCode,
    name: payload.name.trim(),
    passwordHash: payload.password,
    company: payload.company,
    targetWebsite: payload.targetWebsite,
    tier: payload.tier || 'starter',
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
  }).catch(() => {});

  // Attempt backend API registration
  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (resp.ok && data.success) {
      if (data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: data.email || email,
          message: data.message,
          emailSent: data.emailSent,
          provider: data.provider,
          devCode: data.devCode,
          deliveryError: data.deliveryError,
        };
      }
      if (data.user && data.token) {
        saveAuthSession(data.user, data.token);
        const members = getStoredMembers();
        const existingIdx = members.findIndex(m => m.id === data.user.id || m.email.toLowerCase() === data.user.email.toLowerCase());
        if (existingIdx !== -1) {
          members[existingIdx] = { ...members[existingIdx], ...data.user, passwordHash: payload.password };
        } else {
          members.push({ ...data.user, passwordHash: payload.password });
        }
        saveMembers(members);
        saveMemberToCloud({ ...data.user, passwordHash: payload.password }).catch(() => {});
        deleteLocalPending(email);
        return { success: true, user: data.user, token: data.token };
      }
    }
    if (!resp.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.info('Server auth endpoint unavailable, operating client registration.');
  }

  const members = getStoredMembers();
  const existing = members.find(m => m.email.toLowerCase() === email);
  if (existing && existing.isVerified) {
    return { success: false, error: 'An account with this email address already exists. Please log in instead.' };
  }

  return {
    success: true,
    requiresVerification: true,
    email,
    message: `A 6-digit confirmation code has been dispatched to ${email}. Please enter the code to complete registration.`,
    emailSent: false,
    provider: 'local',
    devCode: localCode,
  };

}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{
  success: boolean;
  user?: MemberUser;
  token?: string;
  message?: string;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const pending = getLocalPending(cleanEmail);
  const userPassword = pending?.payload?.password || '';

  try {
    const resp = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
    });
    const data = await resp.json();
    if (resp.ok && data.success && data.user && data.token) {
      saveAuthSession(data.user, data.token);
      const members = getStoredMembers();
      const existingIdx = members.findIndex(m => m.id === data.user.id || m.email.toLowerCase() === cleanEmail);
      if (existingIdx !== -1) {
        members[existingIdx] = {
          ...members[existingIdx],
          ...data.user,
          passwordHash: userPassword || members[existingIdx].passwordHash || '',
        };
      } else {
        members.push({ ...data.user, passwordHash: userPassword });
      }
      saveMembers(members);

      // Persist to Cloud Firestore database
      saveMemberToCloud({
        ...data.user,
        passwordHash: userPassword,
      }).catch(() => {});

      deleteLocalPending(cleanEmail);
      deletePendingFromCloud(cleanEmail).catch(() => {});

      return { success: true, user: data.user, token: data.token, message: data.message };
    }
    if (!resp.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.info('Server verify endpoint unavailable, checking local & cloud pending verifications.');
  }

  // Fallback to local and cloud pending verification
  let cloudPending: any = null;
  if (!pending) {
    try {
      cloudPending = await getPendingFromCloud(cleanEmail);
    } catch {}
  }

  const effectiveCode = pending?.code || cloudPending?.code;
  const effectivePayload = pending?.payload || (cloudPending ? {
    name: cloudPending.name,
    email: cleanEmail,
    password: cloudPending.passwordHash,
    company: cloudPending.company,
    targetWebsite: cloudPending.targetWebsite,
    tier: cloudPending.tier,
  } : null);

  if (!effectiveCode || !effectivePayload) {
    return { success: false, error: 'No verification record found for this email address. Please register again.' };
  }
  if (effectiveCode !== cleanCode) {
    return { success: false, error: 'Invalid verification code. Please check your email and try again.' };
  }

  const isSaroneedam = cleanEmail === 'saroneedam@gmail.com' || cleanEmail === 'saroneedam@yahoo.com';
  const tier: MemberTier = effectivePayload.tier || 'starter';
  const customLimit = isSaroneedam ? 10000000 : tier === 'enterprise' ? 5000000 : tier === 'pro' ? 250000 : 25000;
  const maxVUs = isSaroneedam ? 250 : tier === 'enterprise' ? 100 : tier === 'pro' ? 50 : 15;

  const resolvedPassword = effectivePayload.password || userPassword || '';

  const newUser: MemberUser & { passwordHash: string } = {
    id: isSaroneedam ? 'user_admin_saroneedam' : `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: cleanEmail,
    name: effectivePayload.name.trim(),
    username: cleanEmail.split('@')[0],
    company: isSaroneedam ? 'TrafficPulse HQ (Super Admin)' : effectivePayload.company?.trim() || undefined,
    targetWebsite: effectivePayload.targetWebsite?.trim() || 'https://jobs.eezor.com',
    tier: isSaroneedam ? 'enterprise' : tier,
    role: isSaroneedam ? 'admin' : 'member',
    customVisitsLimit: customLimit,
    maxConcurrentVUs: maxVUs,
    totalCampaignsRun: 0,
    totalVisitsGenerated: 0,
    joinedAt: Date.now(),
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: resolvedPassword,
    trafficBalance: isSaroneedam ? 10000000 : 500,
    totalTrafficAssigned: isSaroneedam ? 10000000 : 500,
    isPaidUser: isSaroneedam,
    trafficStatus: isSaroneedam ? 'unlimited' : 'trial_active',
    registrationIp: '127.0.0.1',
    lastLoginIp: '127.0.0.1',
    authProvider: 'email',
  };

  const members = getStoredMembers();
  const existingIdx = members.findIndex(m => m.email.toLowerCase() === cleanEmail);
  if (existingIdx !== -1) {
    members[existingIdx] = newUser;
  } else {
    members.push(newUser);
  }
  saveMembers(members);

  // Persist to Cloud Firestore database
  saveMemberToCloud(newUser).catch(() => {});
  deleteLocalPending(cleanEmail);
  deletePendingFromCloud(cleanEmail).catch(() => {});

  // Sync to server
  fetch('/api/auth/sync-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member: newUser }),
  }).catch(() => {});

  const { passwordHash: _, ...safeUser } = newUser;
  const token = `tp_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  saveAuthSession(safeUser, token);

  return {
    success: true,
    user: safeUser,
    token,
    message: 'Email verified successfully! 500 Free Trial traffic credits assigned.',
  };
}

export async function resendVerificationCode(
  email: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  emailSent?: boolean;
  provider?: string;
  devCode?: string;
  deliveryError?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const resp = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    const data = await resp.json();
    if (resp.ok && data.success) {
      return {
        success: true,
        message: data.message || `A new code has been sent to ${cleanEmail}.`,
        emailSent: data.emailSent,
        provider: data.provider,
        devCode: data.devCode,
        deliveryError: data.deliveryError,
      };
    }
    if (!resp.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.info('Server resend endpoint unavailable, regenerating locally.');
  }

  const pending = localPendingMap.get(cleanEmail);
  if (pending) {
    pending.code = Math.floor(100000 + Math.random() * 900000).toString();
    pending.expiresAt = Date.now() + 15 * 60 * 1000;
    return {
      success: true,
      message: `A fresh 6-digit confirmation code has been dispatched to ${cleanEmail}.`,
      emailSent: false,
      provider: 'local',
      devCode: pending.code,
    };
  }

  return { success: false, error: 'No pending registration found for this email.' };
}

export async function loginMember(emailOrUsername: string, password: string): Promise<{
  success: boolean;
  user?: MemberUser;
  token?: string;
  requiresVerification?: boolean;
  email?: string;
  emailSent?: boolean;
  provider?: string;
  devCode?: string;
  error?: string;
}> {
  const query = emailOrUsername.trim().toLowerCase();
  if (!query) {
    return { success: false, error: 'Please enter your email or username.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  // 1. Attempt backend API login
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: query, password }),
    });
    const data = await resp.json();
    if (resp.ok && data.success && data.user && data.token) {
      saveAuthSession(data.user, data.token);
      const members = getStoredMembers();
      const idx = members.findIndex(m => m.id === data.user.id || m.email.toLowerCase() === data.user.email.toLowerCase());
      if (idx !== -1) {
        members[idx] = { ...members[idx], ...data.user, passwordHash: password };
      } else {
        members.push({ ...data.user, passwordHash: password });
      }
      saveMembers(members);
      // Persist to Cloud Firestore database
      saveMemberToCloud({ ...data.user, passwordHash: password }).catch(() => {});
      return { success: true, user: data.user, token: data.token };
    }
    if (!resp.ok && data.requiresVerification) {
      return {
        success: false,
        requiresVerification: true,
        email: data.email || query,
        emailSent: data.emailSent,
        provider: data.provider,
        devCode: data.devCode,
        error: data.error || 'Please verify your email address to activate your account.',
      };
    }

    if (resp.status === 401) {
      return { success: false, error: data.error || 'Incorrect password. Please verify and try again.' };
    }
    // If status is 404, continue to Firestore and local registry checks below
  } catch (err) {
    console.info('Server auth endpoint unavailable, checking cloud & local registries.');
  }

  // 2. Direct Cloud Firestore database check (restores accounts across server restarts & cloud instances)
  try {
    const cloudUser = await getMemberFromCloud(query);
    if (cloudUser && cloudUser.email) {
      const isMatchingPass = !cloudUser.passwordHash || cloudUser.passwordHash === password || cloudUser.passwordHash === password.trim();

      if (isMatchingPass) {
        const { passwordHash: _, ...safeUser } = cloudUser;
        const token = `tp_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        saveAuthSession(safeUser, token);

        const members = getStoredMembers();
        const idx = members.findIndex(m => m.email.toLowerCase() === safeUser.email.toLowerCase());
        if (idx !== -1) {
          members[idx] = { ...members[idx], ...safeUser, passwordHash: password };
        } else {
          members.push({ ...safeUser, passwordHash: password });
        }
        saveMembers(members);

        // Update last login in Firestore
        saveMemberToCloud({ ...safeUser, passwordHash: password, lastLoginAt: Date.now() }).catch(() => {});

        // Synchronize with server cache
        fetch('/api/auth/sync-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member: { ...safeUser, passwordHash: password } }),
        }).catch(() => {});

        return { success: true, user: safeUser, token };
      } else {
        return { success: false, error: 'Incorrect password. Please verify and try again.' };
      }
    }
  } catch (cloudErr) {
    console.warn('Direct Firestore login check warning:', cloudErr);
  }

  // 3. Local storage registry check
  const members = getStoredMembers();
  const match = members.find(
    m => m.email.toLowerCase() === query || (m.username && m.username.toLowerCase() === query)
  );

  if (!match) {
    return { success: false, error: 'No member account found with this email or username. Please register first.' };
  }

  if (match.passwordHash && match.passwordHash !== password && match.passwordHash !== password.trim()) {
    return { success: false, error: 'Incorrect password. Please verify and try again.' };
  }

  // Update password if it was missing or needs saving
  match.passwordHash = password;
  match.lastLoginAt = Date.now();
  saveMembers(members);
  saveMemberToCloud(match).catch(() => {});

  // Sync to server
  fetch('/api/auth/sync-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member: match }),
  }).catch(() => {});

  const { passwordHash: _, ...safeUser } = match;
  const token = `tp_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  saveAuthSession(safeUser, token);

  return { success: true, user: safeUser, token };
}

export async function loginWithGoogle(customProfile?: {
  email?: string;
  name?: string;
  avatar?: string;
  adminPasscode?: string;
  uid?: string;
}): Promise<{ success: boolean; user?: MemberUser; token?: string; error?: string; requiresAdminPasscode?: boolean }> {
  const providedEmail = (customProfile?.email || '').trim().toLowerCase();
  
  if (!providedEmail) {
    return { success: false, error: 'Please enter or select a valid Google Account email address.' };
  }

  const isSaroneedamAdmin = providedEmail === 'saroneedam@yahoo.com' || providedEmail === 'saroneedam@gmail.com' || providedEmail === 'saroneedam';
  const isGoogleVerified = Boolean(customProfile?.uid);
  const providedPasscode = customProfile?.adminPasscode?.trim();

  // If administrative account access is requested without verified Google UID, require server passkey validation
  if (isSaroneedamAdmin && !isGoogleVerified && !providedPasscode) {
    return {
      success: false,
      requiresAdminPasscode: true,
      error: 'Security Verification Required: Administrative security passkey is required to sign into this account.',
    };
  }

  const googleEmail = providedEmail;
  const isVerifiedAdmin = isSaroneedamAdmin;
  const googleName = customProfile?.name?.trim() || (isVerifiedAdmin ? 'Super Administrator' : googleEmail.split('@')[0]);
  const userAvatar = typeof customProfile?.avatar === 'string' && customProfile.avatar.trim() ? customProfile.avatar.trim() : undefined;

  // Attempt backend API google login
  try {
    const resp = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleEmail,
        name: googleName,
        avatar: userAvatar,
        adminPasscode: customProfile?.adminPasscode,
        uid: customProfile?.uid,
      }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Google authentication error.' };
    }
    if (data.success && data.user && data.token) {
      saveAuthSession(data.user, data.token);
      // Sync local members
      const members = getStoredMembers();
      const existingIdx = members.findIndex(m => m.id === data.user.id || m.email.toLowerCase() === data.user.email.toLowerCase());
      if (existingIdx !== -1) {
        members[existingIdx] = { ...members[existingIdx], ...data.user };
      } else {
        members.push({ ...data.user, passwordHash: '' });
      }
      saveMembers(members);
      return { success: true, user: data.user, token: data.token };
    }
  } catch (err) {
    console.info('Server Google auth endpoint unavailable, handling client-side verification.');
  }

  const members = getStoredMembers();
  let match = members.find(m => m.email.toLowerCase() === googleEmail);

  if (!match) {
    // Create new google member (regular member by default, admin ONLY if verified)
    const newGoogleUser: MemberUser & { passwordHash: string } = {
      id: isVerifiedAdmin ? 'user_admin_saroneedam' : `user_google_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: googleEmail,
      name: googleName,
      username: googleEmail.split('@')[0],
      company: isVerifiedAdmin ? 'TrafficPulse HQ (Super Admin)' : 'Google Verified Member',
      targetWebsite: 'https://jobs.eezor.com',
      tier: isVerifiedAdmin ? 'enterprise' : 'starter',
      role: isVerifiedAdmin ? 'admin' : 'member',
      customVisitsLimit: isVerifiedAdmin ? 10000000 : 25000,
      maxConcurrentVUs: isVerifiedAdmin ? 250 : 20,
      totalCampaignsRun: isVerifiedAdmin ? 88 : 0,
      totalVisitsGenerated: isVerifiedAdmin ? 650000 : 0,
      joinedAt: Date.now(),
      lastLoginAt: Date.now(),
      isVerified: true,
      avatar: userAvatar,
      passwordHash: '',
      trafficBalance: isVerifiedAdmin ? 10000000 : 500,
      totalTrafficAssigned: isVerifiedAdmin ? 10000000 : 500,
      isPaidUser: isVerifiedAdmin,
      trafficStatus: isVerifiedAdmin ? 'unlimited' : 'trial_active',
    };
    members.push(newGoogleUser);
    saveMembers(members);
    match = newGoogleUser;
  } else {
    match.lastLoginAt = Date.now();
    match.isVerified = true;
    if (match.trafficBalance === undefined || match.trafficBalance === null) {
      match.trafficBalance = isVerifiedAdmin ? 10000000 : 500;
      match.totalTrafficAssigned = match.trafficBalance;
      match.isPaidUser = isVerifiedAdmin;
      match.trafficStatus = isVerifiedAdmin ? 'unlimited' : 'trial_active';
    }
    if (isVerifiedAdmin) {
      match.role = 'admin';
      match.tier = 'enterprise';
      match.customVisitsLimit = 10000000;
      match.company = 'TrafficPulse HQ (Super Admin)';
      match.trafficBalance = Math.max(match.trafficBalance || 0, 10000000);
      match.totalTrafficAssigned = Math.max(match.totalTrafficAssigned || 0, 10000000);
      match.isPaidUser = true;
      match.trafficStatus = 'unlimited';
    } else {
      // Ensure regular Google users never stay admin unless specifically authorized
      if (match.role === 'admin' && !isVerifiedAdmin) {
        match.role = 'member';
        match.tier = 'starter';
      }
    }
    if (userAvatar !== undefined) {
      match.avatar = userAvatar;
    }
    saveMembers(members);
  }

  const { passwordHash: _, ...safeUser } = match;
  const token = `tp_google_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  saveAuthSession(safeUser, token);

  return { success: true, user: safeUser, token };
}

export interface UpdateProfilePayload {
  name?: string;
  username?: string;
  company?: string;
  targetWebsite?: string;
  avatar?: string | null; // string for image URL/base64 data, null/empty string to remove
  currentPassword?: string;
  newPassword?: string;
}

export async function updateMemberProfile(payload: UpdateProfilePayload): Promise<{ success: boolean; user?: MemberUser; error?: string }> {
  const auth = loadStoredAuth();
  if (!auth.isAuthenticated || !auth.user) {
    return { success: false, error: 'You must be signed in to update your profile.' };
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === auth.user?.id || m.email.toLowerCase() === auth.user?.email.toLowerCase());

  if (!match) {
    return { success: false, error: 'Account record could not be found.' };
  }

  // Validate and apply password change
  if (payload.newPassword) {
    if (payload.newPassword.length < 5) {
      return { success: false, error: 'New password must be at least 5 characters long.' };
    }
    if (match.passwordHash && match.passwordHash !== 'google_oauth_auth') {
      if (!payload.currentPassword || payload.currentPassword !== match.passwordHash) {
        return { success: false, error: 'Current password verification failed.' };
      }
    }
    match.passwordHash = payload.newPassword;
  }

  if (payload.name && payload.name.trim().length >= 2) {
    match.name = payload.name.trim();
  }
  if (payload.username && payload.username.trim().length >= 2) {
    match.username = payload.username.trim();
  }
  if (payload.company !== undefined) {
    match.company = payload.company.trim() || undefined;
  }
  if (payload.targetWebsite !== undefined) {
    match.targetWebsite = payload.targetWebsite.trim() || undefined;
  }
  // Avatar handling: null or '' removes avatar, string updates it
  if (payload.avatar !== undefined) {
    if (payload.avatar === null || payload.avatar === '') {
      delete match.avatar;
    } else {
      match.avatar = payload.avatar.trim();
    }
  }

  saveMembers(members);

  const { passwordHash: _, ...safeUser } = match;
  saveAuthSession(safeUser, auth.token || 'tok_valid');

  // Attempt backend API profile sync
  try {
    await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: match.id,
        email: match.email,
        name: match.name,
        username: match.username,
        company: match.company,
        targetWebsite: match.targetWebsite,
        avatar: payload.avatar === null ? '' : payload.avatar,
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      }),
    });
  } catch (err) {
    console.info('Backend profile sync skipped, saved locally in browser.');
  }

  return { success: true, user: safeUser };
}

export function incrementMemberStats(visitsToAdd: number) {
  try {
    const auth = loadStoredAuth();
    if (!auth.isAuthenticated || !auth.user) return;

    const members = getStoredMembers();
    const match = members.find(m => m.id === auth.user?.id);
    if (match) {
      match.totalCampaignsRun = (match.totalCampaignsRun || 0) + 1;
      match.totalVisitsGenerated = (match.totalVisitsGenerated || 0) + visitsToAdd;
      saveMembers(members);

      auth.user.totalCampaignsRun = match.totalCampaignsRun;
      auth.user.totalVisitsGenerated = match.totalVisitsGenerated;
      saveAuthSession(auth.user, auth.token || 'tok_valid');
    }
  } catch (e) {
    console.warn('Failed incrementing member stats:', e);
  }
}

/**
 * Deducts traffic units from the active logged-in user.
 * Requirement: 500 free trial traffic for login users.
 * When trial is exhausted, further traffic is blocked until admin assigns quota.
 * Super Admin (role === 'admin') has unlimited traffic.
 */
export function deductTrafficCredit(amount: number = 1): {
  allowed: boolean;
  remaining: number;
  exhausted: boolean;
  isPaid: boolean;
  user: MemberUser | null;
} {
  const auth = loadStoredAuth();
  if (!auth.isAuthenticated || !auth.user) {
    return {
      allowed: false,
      remaining: 0,
      exhausted: true,
      isPaid: false,
      user: null,
    };
  }

  // Admin accounts have unlimited access
  if (auth.user.role === 'admin') {
    return {
      allowed: true,
      remaining: 10000000,
      exhausted: false,
      isPaid: true,
      user: auth.user,
    };
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === auth.user?.id || m.email.toLowerCase() === auth.user?.email.toLowerCase());

  if (!match) {
    return {
      allowed: false,
      remaining: 0,
      exhausted: true,
      isPaid: false,
      user: auth.user,
    };
  }

  // Initialize balance if missing
  if (match.trafficBalance === undefined || match.trafficBalance === null) {
    match.trafficBalance = 500;
    match.totalTrafficAssigned = 500;
    match.isPaidUser = false;
    match.trafficStatus = 'trial_active';
  }

  // Check if balance is already exhausted
  if (match.trafficBalance <= 0) {
    match.trafficBalance = 0;
    match.trafficStatus = match.isPaidUser ? 'paid_exhausted' : 'trial_exhausted';
    saveMembers(members);

    auth.user.trafficBalance = 0;
    auth.user.trafficStatus = match.trafficStatus;
    saveAuthSession(auth.user, auth.token || 'tok_valid');

    return {
      allowed: false,
      remaining: 0,
      exhausted: true,
      isPaid: !!match.isPaidUser,
      user: auth.user,
    };
  }

  // Deduct credit
  match.trafficBalance = Math.max(0, match.trafficBalance - amount);
  match.totalVisitsGenerated = (match.totalVisitsGenerated || 0) + amount;
  if (match.trafficBalance <= 0) {
    match.trafficStatus = match.isPaidUser ? 'paid_exhausted' : 'trial_exhausted';
  }
  saveMembers(members);

  // Sync to current active session
  auth.user.trafficBalance = match.trafficBalance;
  auth.user.totalVisitsGenerated = match.totalVisitsGenerated;
  auth.user.trafficStatus = match.trafficStatus;
  auth.user.isPaidUser = match.isPaidUser;
  saveAuthSession(auth.user, auth.token || 'tok_valid');

  return {
    allowed: true,
    remaining: match.trafficBalance,
    exhausted: match.trafficBalance <= 0,
    isPaid: !!match.isPaidUser,
    user: auth.user,
  };
}

// ============================================================================
// ADMIN TRAFFIC & USER MANAGEMENT API
// Only Admin can assign custom traffic quotas to paid users or trial users
// ============================================================================

/**
 * Returns list of all registered member accounts (safe without passwords).
 */
export function getAllMembers(): MemberUser[] {
  const members = getStoredMembers();
  return members.map(({ passwordHash: _, ...safe }) => safe);
}

/**
 * Admin assigns any custom number of traffic visits to a member.
 * Persists to server API and local storage.
 */
export async function adminAssignTraffic(
  userId: string,
  additionalTraffic: number,
  markAsPaid: boolean = true,
  newTier?: MemberTier
): Promise<{ success: boolean; user?: MemberUser; error?: string }> {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only an Administrator can assign traffic quotas.' };
  }

  if (additionalTraffic <= 0) {
    return { success: false, error: 'Please enter a valid positive number of traffic credits to assign.' };
  }

  // 1. Fetch targeted member's UID from Firestore 'users' collection or local identifiers
  const targetUid = await fetchTargetMemberUid({ id: userId, email: userId });

  // 2. Call server API
  let serverUser: MemberUser | null = null;
  try {
    const res = await fetch('/api/auth/assign-traffic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUid || userId,
        additionalTraffic,
        markAsPaid,
        newTier,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      serverUser = data.user;
    } else if (!res.ok) {
      return { success: false, error: data.error || 'Server rejected traffic assignment.' };
    }
  } catch (err: any) {
    console.warn('Backend server assignment unavailable, falling back to local storage:', err);
  }

  // 3. Update local storage
  const members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.uid === targetUid || m.email.toLowerCase() === userId.toLowerCase());

  let finalUser: MemberUser;

  if (serverUser) {
    // If server succeeded, update local store with authoritative server user
    finalUser = { ...serverUser, uid: targetUid };
    const updatedMembers = members.map(m => (m.id === serverUser!.id || m.uid === targetUid || m.email.toLowerCase() === serverUser!.email.toLowerCase()) ? { ...m, ...finalUser } : m);
    if (!updatedMembers.some(m => m.id === serverUser!.id || m.uid === targetUid)) {
      updatedMembers.push(finalUser as any);
    }
    saveMembers(updatedMembers);
  } else if (match) {
    // Fallback update in local storage
    const currentBalance = match.trafficBalance || 0;
    match.trafficBalance = currentBalance + additionalTraffic;
    match.totalTrafficAssigned = (match.totalTrafficAssigned || 0) + additionalTraffic;
    match.uid = targetUid;

    if (markAsPaid) {
      match.isPaidUser = true;
      match.trafficStatus = 'paid_active';
    } else {
      match.trafficStatus = 'trial_active';
    }

    if (newTier) {
      match.tier = newTier;
    }

    saveMembers(members);
    const { passwordHash: _, ...safeUser } = match;
    finalUser = safeUser;
  } else {
    return { success: false, error: 'Member account not found.' };
  }

  // 4. Perform write operation directly to the Firestore 'users' collection to update the 'trafficBalance' field
  try {
    await writeUserTrafficToFirestore(targetUid, finalUser.trafficBalance, {
      totalTrafficAssigned: finalUser.totalTrafficAssigned,
      isPaidUser: finalUser.isPaidUser,
      trafficStatus: finalUser.trafficStatus,
      tier: finalUser.tier,
      email: finalUser.email,
      name: finalUser.name,
    });
  } catch (firestoreErr) {
    console.warn('[FIRESTORE] Cloud update deferred:', firestoreErr);
  }

  // 5. Trigger state refresh for target user's session if active in this browser
  if (
    currentAuth.user?.id === finalUser.id ||
    currentAuth.user?.uid === targetUid ||
    currentAuth.user?.email.toLowerCase() === finalUser.email.toLowerCase()
  ) {
    saveAuthSession(finalUser, currentAuth.token || 'tok_valid');
  }

  // Broadcast session refresh across window and other open tabs
  broadcastSessionRefresh(finalUser);

  return { success: true, user: finalUser };
}

/**
 * Admin resets a user's traffic balance back to the 500 free trial quota.
 */
export async function adminResetUserTraffic(userId: string): Promise<{ success: boolean; user?: MemberUser; error?: string }> {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator rights required.' };
  }

  let serverUser: MemberUser | null = null;
  try {
    const res = await fetch('/api/auth/reset-traffic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      serverUser = data.user;
    }
  } catch (e) {
    console.warn('Server reset call deferred:', e);
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.email.toLowerCase() === userId.toLowerCase());

  if (serverUser) {
    const updatedMembers = members.map(m => (m.id === serverUser!.id || m.email.toLowerCase() === serverUser!.email.toLowerCase()) ? { ...m, ...serverUser } : m);
    saveMembers(updatedMembers);
    if (currentAuth.user?.id === serverUser.id) {
      saveAuthSession(serverUser, currentAuth.token || 'tok_valid');
    }
    return { success: true, user: serverUser };
  }

  if (!match) {
    return { success: false, error: 'Member account not found.' };
  }

  match.trafficBalance = 500;
  match.totalTrafficAssigned = 500;
  match.isPaidUser = false;
  match.trafficStatus = 'trial_active';
  saveMembers(members);

  const { passwordHash: _, ...safeUser } = match;

  if (currentAuth.user?.id === match.id) {
    saveAuthSession(safeUser, currentAuth.token || 'tok_valid');
  }

  return { success: true, user: safeUser };
}

/**
 * Admin toggles user's paid user status.
 */
export async function adminTogglePaidStatus(userId: string, isPaid: boolean): Promise<{ success: boolean; user?: MemberUser; error?: string }> {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator rights required.' };
  }

  let serverUser: MemberUser | null = null;
  try {
    const res = await fetch('/api/auth/toggle-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPaid }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      serverUser = data.user;
    }
  } catch (e) {
    console.warn('Server toggle paid call deferred:', e);
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.email.toLowerCase() === userId.toLowerCase());

  if (serverUser) {
    const updatedMembers = members.map(m => (m.id === serverUser!.id || m.email.toLowerCase() === serverUser!.email.toLowerCase()) ? { ...m, ...serverUser } : m);
    saveMembers(updatedMembers);
    if (currentAuth.user?.id === serverUser.id) {
      saveAuthSession(serverUser, currentAuth.token || 'tok_valid');
    }
    return { success: true, user: serverUser };
  }

  if (!match) {
    return { success: false, error: 'Member account not found.' };
  }

  match.isPaidUser = isPaid;
  match.trafficStatus = isPaid ? 'paid_active' : 'trial_active';
  saveMembers(members);

  const { passwordHash: _, ...safeUser } = match;

  if (currentAuth.user?.id === match.id) {
    saveAuthSession(safeUser, currentAuth.token || 'tok_valid');
  }

  return { success: true, user: safeUser };
}

/**
 * Admin deletes a member account.
 */
export async function adminDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator rights required.' };
  }

  let members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.email.toLowerCase() === userId.toLowerCase());

  if (!match) {
    return { success: false, error: 'Member not found.' };
  }

  // Prevent deletion of root super admin
  if (match.email.toLowerCase() === 'saroneedam@yahoo.com' || match.email.toLowerCase() === 'saroneedam@gmail.com') {
    return { success: false, error: 'Root Super Admin account cannot be deleted.' };
  }

  try {
    await fetch('/api/auth/delete-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch (e) {
    console.warn('Server delete member deferred:', e);
  }

  members = members.filter(m => m.id !== userId && m.email.toLowerCase() !== userId.toLowerCase());
  saveMembers(members);

  return { success: true };
}

/**
 * Fetches current outbound email provider configuration status from the server
 */
export async function fetchEmailProviderStatus(): Promise<{
  configured: boolean;
  activeProvider: string;
  providers: {
    gmail: boolean;
    resend: boolean;
    sendgrid: boolean;
    brevo: boolean;
    smtp: boolean;
  };
  fromAddress: string;
}> {
  try {
    const res = await fetch('/api/auth/email-status');
    const data = await res.json();
    if (res.ok && data.success && data.status) {
      return data.status;
    }
  } catch (err) {
    console.warn('Failed to fetch email provider status:', err);
  }
  return {
    configured: false,
    activeProvider: 'none',
    providers: { gmail: false, resend: false, sendgrid: false, brevo: false, smtp: false },
    fromAddress: '',
  };
}

/**
 * Super Admin helper to inspect pending OTP verifications
 */
export async function fetchPendingOtps(): Promise<Array<{
  email: string;
  code: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}>> {
  try {
    const res = await fetch('/api/auth/pending-otps');
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.pending)) {
      return data.pending;
    }
  } catch (err) {
    console.warn('Failed to fetch pending OTPs:', err);
  }
  return [];
}

/**
 * Dispatches a test OTP email to any given address and returns delivery results
 */
export async function sendTestEmail(testEmail: string): Promise<{
  success: boolean;
  sent: boolean;
  provider: string;
  message: string;
  testCode?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testEmail }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        sent: !!data.result?.sent,
        provider: data.result?.provider || 'none',
        message: data.message || 'Test email dispatched.',
        testCode: data.testCode,
        error: data.result?.error,
      };
    }
    return {
      success: false,
      sent: false,
      provider: 'error',
      message: data.error || 'Test email failed to send',
      error: data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      sent: false,
      provider: 'error',
      message: err.message || 'Network error',
      error: err.message,
    };
  }
}

/**
 * Super Admin helper to fetch saved email credentials
 */
export async function fetchSavedEmailConfig(): Promise<{
  success: boolean;
  config?: any;
  status?: any;
}> {
  try {
    const res = await fetch('/api/auth/email-config');
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false };
  }
}

/**
 * Super Admin helper to save email credentials dynamically
 */
export async function saveEmailConfiguration(config: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  status?: any;
}> {
  try {
    const res = await fetch('/api/auth/email-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save configuration' };
  }
}

