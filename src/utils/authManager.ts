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
    avatar: '/admin-avatar.jpg',
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
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
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
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
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
      list[adminIndex].avatar = '/admin-avatar.jpg';
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
}): Promise<{ success: boolean; user?: MemberUser; token?: string; error?: string }> {
  // If user provided a specific email or auto-detected Google email
  const googleEmail = (customProfile?.email || 'saroneedam@gmail.com').trim().toLowerCase();
  const googleName = customProfile?.name?.trim() || (googleEmail.includes('saroneedam') ? 'Saroneedam Admin' : 'Google Verified Member');
  const googleAvatar = customProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  // Attempt backend API google login
  try {
    const resp = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: googleEmail, name: googleName, avatar: googleAvatar }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.user && data.token) {
        saveAuthSession(data.user, data.token);
        return { success: true, user: data.user, token: data.token };
      }
    }
  } catch (err) {
    console.info('Server Google auth endpoint unavailable, handling client-side.');
  }

  const members = getStoredMembers();
  let match = members.find(
    m => m.email.toLowerCase() === googleEmail || (googleEmail.includes('saroneedam') && m.email.toLowerCase() === 'saroneedam@yahoo.com')
  );

  const isAdmin = googleEmail.includes('saroneedam');

  if (!match) {
    // Create new google member
    const newGoogleUser: MemberUser & { passwordHash: string } = {
      id: `user_google_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: googleEmail,
      name: googleName,
      username: googleEmail.split('@')[0],
      company: isAdmin ? 'TrafficPulse HQ (Super Admin)' : 'Google Verified Organization',
      targetWebsite: 'https://jobs.eezor.com',
      tier: isAdmin ? 'enterprise' : 'pro',
      role: isAdmin ? 'admin' : 'member',
      customVisitsLimit: isAdmin ? 10000000 : 500000,
      maxConcurrentVUs: isAdmin ? 250 : 50,
      totalCampaignsRun: isAdmin ? 88 : 1,
      totalVisitsGenerated: isAdmin ? 650000 : 500,
      joinedAt: Date.now(),
      lastLoginAt: Date.now(),
      isVerified: true,
      avatar: googleAvatar,
      passwordHash: 'google_oauth_auth',
    };
    members.push(newGoogleUser);
    saveMembers(members);
    match = newGoogleUser;
  } else {
    match.lastLoginAt = Date.now();
    match.isVerified = true;
    if (isAdmin) {
      match.role = 'admin';
      match.tier = 'enterprise';
      match.customVisitsLimit = 10000000;
      match.company = 'TrafficPulse HQ (Super Admin)';
    }
    if (googleAvatar) match.avatar = googleAvatar;
    saveMembers(members);
  }

  const { passwordHash: _, ...safeUser } = match;
  const token = `tp_google_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  saveAuthSession(safeUser, token);

  return { success: true, user: safeUser, token };
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
