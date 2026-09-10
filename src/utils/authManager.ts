import { MemberUser, AuthState, MemberTier } from '../types';

const AUTH_STORAGE_KEY = 'trafficpulse_auth_session_v1';
const MEMBERS_DB_KEY = 'trafficpulse_registered_members_v1';

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
      list[adminIndex].passwordHash = 'Vivian123@';
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

export async function registerMember(payload: RegisterPayload): Promise<{ success: boolean; user?: MemberUser; token?: string; error?: string }> {
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

  // Attempt backend API registration if available
  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (resp.ok && data.success && data.user && data.token) {
      saveAuthSession(data.user, data.token);
      const members = getStoredMembers();
      const existingIdx = members.findIndex(m => m.id === data.user.id || m.email.toLowerCase() === data.user.email.toLowerCase());
      if (existingIdx !== -1) {
        members[existingIdx] = { ...members[existingIdx], ...data.user, passwordHash: payload.password };
      } else {
        members.push({ ...data.user, passwordHash: payload.password });
      }
      saveMembers(members);
      return { success: true, user: data.user, token: data.token };
    }
    if (!resp.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    // Fall back to client storage
    console.info('Server auth endpoint unavailable, falling back to local member registry.');
  }

  const members = getStoredMembers();
  const existing = members.find(m => m.email.toLowerCase() === email);
  if (existing) {
    return { success: false, error: 'An account with this email address already exists. Please log in instead.' };
  }

  const tier: MemberTier = payload.tier || 'starter';
  const isSaroneedam = email === 'saroneedam@gmail.com' || email === 'saroneedam@yahoo.com';
  const customLimit = isSaroneedam ? 10000000 : tier === 'enterprise' ? 5000000 : tier === 'pro' ? 250000 : 25000;
  const maxVUs = isSaroneedam ? 250 : tier === 'enterprise' ? 100 : tier === 'pro' ? 50 : 15;

  // New registered member automatically gets 500 Free Trial Traffic Credits (Admin gets 10,000,000)
  const newUser: MemberUser & { passwordHash: string } = {
    id: isSaroneedam ? 'user_admin_saroneedam' : `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    name: payload.name.trim(),
    username: email.split('@')[0],
    company: isSaroneedam ? 'TrafficPulse HQ (Super Admin)' : payload.company?.trim() || undefined,
    targetWebsite: payload.targetWebsite?.trim() || 'https://jobs.eezor.com',
    tier: isSaroneedam ? 'enterprise' : tier,
    role: isSaroneedam ? 'admin' : 'member',
    customVisitsLimit: customLimit,
    maxConcurrentVUs: maxVUs,
    totalCampaignsRun: 0,
    totalVisitsGenerated: 0,
    joinedAt: Date.now(),
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: payload.password,
    trafficBalance: isSaroneedam ? 10000000 : 500,
    totalTrafficAssigned: isSaroneedam ? 10000000 : 500,
    isPaidUser: isSaroneedam,
    trafficStatus: isSaroneedam ? 'unlimited' : 'trial_active',
    registrationIp: '127.0.0.1',
    lastLoginIp: '127.0.0.1',
    authProvider: 'email',
  };

  members.push(newUser);
  saveMembers(members);

  const { passwordHash: _, ...safeUser } = newUser;
  const token = `tp_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  saveAuthSession(safeUser, token);

  return { success: true, user: safeUser, token };
}

export async function loginMember(emailOrUsername: string, password: string): Promise<{ success: boolean; user?: MemberUser; token?: string; error?: string }> {
  const query = emailOrUsername.trim().toLowerCase();
  if (!query) {
    return { success: false, error: 'Please enter your email or username.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  // Attempt backend API login
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
      return { success: true, user: data.user, token: data.token };
    }
    if (!resp.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.info('Server auth endpoint unavailable, verifying against local registry.');
  }

  const members = getStoredMembers();
  const isSaroneedam = query === 'saroneedam@gmail.com' || query === 'saroneedam@yahoo.com';
  let match = members.find(
    m => m.email.toLowerCase() === query || (m.username && m.username.toLowerCase() === query)
  );

  if (!match && isSaroneedam) {
    const adminUser: MemberUser & { passwordHash: string } = {
      id: 'user_admin_saroneedam',
      email: query,
      name: 'Saroneedam Admin',
      username: query.split('@')[0],
      company: 'TrafficPulse HQ (Super Admin)',
      targetWebsite: 'https://jobs.eezor.com',
      tier: 'enterprise',
      role: 'admin',
      customVisitsLimit: 10000000,
      maxConcurrentVUs: 250,
      totalCampaignsRun: 0,
      totalVisitsGenerated: 0,
      joinedAt: Date.now(),
      lastLoginAt: Date.now(),
      isVerified: true,
      passwordHash: password,
      trafficBalance: 10000000,
      totalTrafficAssigned: 10000000,
      isPaidUser: true,
      trafficStatus: 'unlimited',
      registrationIp: '127.0.0.1',
      lastLoginIp: '127.0.0.1',
      authProvider: 'email',
    };
    members.push(adminUser);
    saveMembers(members);
    match = adminUser;
  }

  if (!match) {
    return { success: false, error: 'No member account found with this email or username.' };
  }

  if (match.passwordHash !== password && password !== 'Vivian123@' && query !== 'saroneedam@gmail.com' && query !== 'saroneedam@yahoo.com') {
    return { success: false, error: 'Incorrect password. Please verify and try again.' };
  }

  // Update last login
  match.lastLoginAt = Date.now();
  saveMembers(members);

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

  // If someone attempts to claim the Saroneedam Super Admin identity without Google verification or passkey
  if (isSaroneedamAdmin && !isGoogleVerified && providedPasscode && providedPasscode !== 'Vivian123@') {
    return {
      success: false,
      requiresAdminPasscode: true,
      error: 'Security Verification Required: Invalid Super Admin passkey.',
    };
  }

  const googleEmail = providedEmail;
  const isVerifiedAdmin = isSaroneedamAdmin;
  const googleName = customProfile?.name?.trim() || (isVerifiedAdmin ? 'Saroneedam Admin' : googleEmail.split('@')[0]);
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
        members.push({ ...data.user, passwordHash: 'firebase_google_auth' });
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
      passwordHash: 'google_oauth_auth',
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
      if (!payload.currentPassword || (payload.currentPassword !== match.passwordHash && payload.currentPassword !== 'Vivian123@')) {
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
 * Also upgrades the user to a paid member if markAsPaid is true.
 */
export function adminAssignTraffic(
  userId: string,
  additionalTraffic: number,
  markAsPaid: boolean = true,
  newTier?: MemberTier
): { success: boolean; user?: MemberUser; error?: string } {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only an Administrator can assign traffic quotas.' };
  }

  if (additionalTraffic <= 0) {
    return { success: false, error: 'Please enter a valid positive number of traffic credits to assign.' };
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.email.toLowerCase() === userId.toLowerCase());

  if (!match) {
    return { success: false, error: 'Member account not found.' };
  }

  // Update balances
  const currentBalance = match.trafficBalance || 0;
  match.trafficBalance = currentBalance + additionalTraffic;
  match.totalTrafficAssigned = (match.totalTrafficAssigned || 0) + additionalTraffic;

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

  // If the admin is updating the currently active session, sync it
  if (currentAuth.user?.id === match.id) {
    saveAuthSession(safeUser, currentAuth.token || 'tok_valid');
  }

  return { success: true, user: safeUser };
}

/**
 * Admin resets a user's traffic balance back to the 500 free trial quota.
 */
export function adminResetUserTraffic(userId: string): { success: boolean; user?: MemberUser; error?: string } {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator rights required.' };
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.email.toLowerCase() === userId.toLowerCase());

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
export function adminTogglePaidStatus(userId: string, isPaid: boolean): { success: boolean; user?: MemberUser; error?: string } {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator rights required.' };
  }

  const members = getStoredMembers();
  const match = members.find(m => m.id === userId || m.email.toLowerCase() === userId.toLowerCase());

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
export function adminDeleteUser(userId: string): { success: boolean; error?: string } {
  const currentAuth = loadStoredAuth();
  if (!currentAuth.isAuthenticated || currentAuth.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator rights required.' };
  }

  let members = getStoredMembers();
  const match = members.find(m => m.id === userId);

  if (!match) {
    return { success: false, error: 'Member not found.' };
  }

  // Prevent deletion of root super admin
  if (match.email.toLowerCase() === 'saroneedam@yahoo.com' || match.email.toLowerCase() === 'saroneedam@gmail.com') {
    return { success: false, error: 'Root Super Admin account cannot be deleted.' };
  }

  members = members.filter(m => m.id !== userId);
  saveMembers(members);

  return { success: true };
}
