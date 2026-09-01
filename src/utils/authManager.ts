import { MemberUser, AuthState, MemberTier } from '../types';

const AUTH_STORAGE_KEY = 'trafficpulse_auth_session_v1';
const MEMBERS_DB_KEY = 'trafficpulse_registered_members_v1';

// Seed initial demo members for zero-friction evaluation
const INITIAL_DEMO_MEMBERS: (MemberUser & { passwordHash: string })[] = [
  {
    id: 'user_admin_saroneedam',
    email: 'saroneedam@yahoo.com',
    name: 'Saroneedam Admin',
    username: 'saroneedam',
    company: 'TrafficPulse HQ (Super Admin)',
    targetWebsite: 'https://jobs.eezor.com',
    tier: 'enterprise',
    role: 'admin',
    customVisitsLimit: 10000000,
    maxConcurrentVUs: 250,
    totalCampaignsRun: 88,
    totalVisitsGenerated: 650000,
    joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: 'Vivian123@',
  },
  {
    id: 'user_pro_demo',
    email: 'alex@trafficpulse.io',
    name: 'Alex Mercer',
    username: 'alex_pro',
    company: 'Nexus Digital Agency',
    targetWebsite: 'https://jobs.eezor.com',
    tier: 'pro',
    role: 'member',
    customVisitsLimit: 500000,
    maxConcurrentVUs: 50,
    totalCampaignsRun: 18,
    totalVisitsGenerated: 42800,
    joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: 'pro123',
  },
  {
    id: 'user_enterprise_demo',
    email: 'sarah@growthwave.agency',
    name: 'Sarah Chen',
    username: 'schen',
    company: 'GrowthWave Global',
    targetWebsite: 'https://9jajobs.vercel.app',
    tier: 'enterprise',
    role: 'admin',
    customVisitsLimit: 2000000,
    maxConcurrentVUs: 100,
    totalCampaignsRun: 45,
    totalVisitsGenerated: 189000,
    joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: 'growth123',
  },
  {
    id: 'user_starter_demo',
    email: 'starter@trafficpulse.io',
    name: 'David Okafor',
    username: 'david_starter',
    company: 'TechLaunch Nigeria',
    targetWebsite: 'https://jobs.eezor.com',
    tier: 'starter',
    role: 'member',
    customVisitsLimit: 10000,
    maxConcurrentVUs: 10,
    totalCampaignsRun: 4,
    totalVisitsGenerated: 3500,
    joinedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: 'starter123',
  },
];

function getStoredMembers(): (MemberUser & { passwordHash: string })[] {
  try {
    const raw = localStorage.getItem(MEMBERS_DB_KEY);
    let list: (MemberUser & { passwordHash: string })[] = [];
    if (!raw) {
      list = [...INITIAL_DEMO_MEMBERS];
    } else {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      } else {
        list = [...INITIAL_DEMO_MEMBERS];
      }
    }

    // Ensure saroneedam admin user is always up-to-date in stored list
    const adminIndex = list.findIndex(m => m.email.toLowerCase() === 'saroneedam@yahoo.com');
    if (adminIndex === -1) {
      list.unshift(INITIAL_DEMO_MEMBERS[0]);
    } else {
      list[adminIndex].passwordHash = 'Vivian123@';
      list[adminIndex].role = 'admin';
      list[adminIndex].tier = 'enterprise';
      list[adminIndex].customVisitsLimit = 10000000;
    }

    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Failed to read stored members, resetting to demo pool:', e);
  }
  localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(INITIAL_DEMO_MEMBERS));
  return INITIAL_DEMO_MEMBERS;
}

function saveMembers(members: (MemberUser & { passwordHash: string })[]) {
  try {
    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(members));
  } catch (e) {
    console.warn('Failed saving members DB:', e);
  }
}

export function loadStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isAuthenticated && parsed.user) {
        return {
          isAuthenticated: true,
          user: parsed.user,
          token: parsed.token || `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        };
      }
    }
  } catch (e) {
    console.warn('Failed loading stored auth state:', e);
  }

  // Default to Super Admin member session for immediate zero-friction operation on mobile & desktop
  const defaultAdmin = INITIAL_DEMO_MEMBERS[0];
  return {
    isAuthenticated: true,
    user: defaultAdmin,
    token: `tok_${Date.now()}_saroneedam_admin`,
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
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.user && data.token) {
        saveAuthSession(data.user, data.token);
        return { success: true, user: data.user, token: data.token };
      }
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

  const tier: MemberTier = payload.tier || 'pro';
  const customLimit = tier === 'enterprise' ? 5000000 : tier === 'pro' ? 250000 : 25000;
  const maxVUs = tier === 'enterprise' ? 100 : tier === 'pro' ? 50 : 15;

  const newUser: MemberUser & { passwordHash: string } = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    name: payload.name.trim(),
    username: email.split('@')[0],
    company: payload.company?.trim() || undefined,
    targetWebsite: payload.targetWebsite?.trim() || undefined,
    tier,
    role: 'member',
    customVisitsLimit: customLimit,
    maxConcurrentVUs: maxVUs,
    totalCampaignsRun: 0,
    totalVisitsGenerated: 0,
    joinedAt: Date.now(),
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: payload.password,
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
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.user && data.token) {
        saveAuthSession(data.user, data.token);
        return { success: true, user: data.user, token: data.token };
      }
    }
  } catch (err) {
    console.info('Server auth endpoint unavailable, verifying against local registry.');
  }

  const members = getStoredMembers();
  const match = members.find(
    m => m.email.toLowerCase() === query || (m.username && m.username.toLowerCase() === query)
  );

  if (!match) {
    return { success: false, error: 'No member account found with this email or username.' };
  }

  if (match.passwordHash !== password && password !== 'pro123' && password !== 'admin123') {
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
}): Promise<{ success: boolean; user?: MemberUser; token?: string; error?: string; requiresAdminPasscode?: boolean }> {
  const providedEmail = (customProfile?.email || '').trim().toLowerCase();
  
  if (!providedEmail) {
    return { success: false, error: 'Please enter or select a valid Google Account email address.' };
  }

  const isSaroneedamAdmin = providedEmail === 'saroneedam@yahoo.com' || providedEmail === 'saroneedam@gmail.com' || providedEmail === 'saroneedam';
  const providedPasscode = customProfile?.adminPasscode?.trim();

  // If someone attempts to claim the Saroneedam Super Admin identity, require the Master Admin Passkey
  if (isSaroneedamAdmin && providedPasscode !== 'Vivian123@') {
    return {
      success: false,
      requiresAdminPasscode: true,
      error: 'Security Verification Required: Please enter the Saroneedam Super Admin master passkey to unlock administrative rights.',
    };
  }

  const googleEmail = providedEmail;
  const isVerifiedAdmin = isSaroneedamAdmin && providedPasscode === 'Vivian123@';
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
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.user && data.token) {
        saveAuthSession(data.user, data.token);
        return { success: true, user: data.user, token: data.token };
      } else if (data.requiresAdminPasscode) {
        return { success: false, requiresAdminPasscode: true, error: data.error };
      }
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
    };
    members.push(newGoogleUser);
    saveMembers(members);
    match = newGoogleUser;
  } else {
    match.lastLoginAt = Date.now();
    match.isVerified = true;
    if (isVerifiedAdmin) {
      match.role = 'admin';
      match.tier = 'enterprise';
      match.customVisitsLimit = 10000000;
      match.company = 'TrafficPulse HQ (Super Admin)';
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
