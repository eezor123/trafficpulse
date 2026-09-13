import fs from 'fs';
import path from 'path';
import {
  saveMemberToCloud,
  getMemberFromCloud,
  getAllMembersFromCloud,
  savePendingToCloud,
  getPendingFromCloud,
  deletePendingFromCloud,
  deleteMemberFromCloud,
} from '../lib/firebase.ts';

export interface ServerMember {
  id: string;
  email: string;
  name: string;
  username?: string;
  company?: string;
  targetWebsite?: string;
  tier: 'starter' | 'pro' | 'enterprise';
  role: 'member' | 'admin' | 'guest';
  customVisitsLimit?: number;
  maxConcurrentVUs?: number;
  totalCampaignsRun: number;
  totalVisitsGenerated: number;
  joinedAt: number;
  lastLoginAt: number;
  isVerified: boolean;
  avatar?: string;
  passwordHash: string;
  trafficBalance: number;
  totalTrafficAssigned: number;
  isPaidUser?: boolean;
  trafficStatus?: 'trial_active' | 'trial_exhausted' | 'paid_active' | 'paid_exhausted' | 'unlimited';
  registrationIp?: string;
  lastLoginIp?: string;
  authProvider?: 'google' | 'firebase' | 'email';
}

export interface PendingVerification {
  email: string;
  code: string;
  name: string;
  passwordHash: string;
  company?: string;
  targetWebsite?: string;
  tier: 'starter' | 'pro' | 'enterprise';
  clientIp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

// In-memory runtime caches
const memoryMembers = new Map<string, ServerMember>();
const memoryPending = new Map<string, PendingVerification>();

// Determine usable persistence file path
function getStorageFilePath(): string {
  // Try ./data directory first (persistent on Cloud Run / container)
  const localDataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    const testFile = path.join(localDataDir, '.writable_check');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return path.join(localDataDir, 'server_members.json');
  } catch {
    // Fallback to /tmp (writable in Vercel Serverless & AWS Lambda)
    const tmpDir = '/tmp';
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return path.join(tmpDir, 'trafficpulse_server_members.json');
  }
}

let activeStoragePath: string | null = null;
function getActiveStoragePath(): string {
  if (!activeStoragePath) {
    activeStoragePath = getStorageFilePath();
  }
  return activeStoragePath;
}

function loadFromFileCache(): void {
  try {
    const filePath = getActiveStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const m of data) {
          if (m && m.email) {
            memoryMembers.set(m.email.toLowerCase(), m);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[STORE] Could not read local file cache:', err);
  }
}

function saveToFileCache(): void {
  try {
    const filePath = getActiveStoragePath();
    const list = Array.from(memoryMembers.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[STORE] Could not write to local file cache:', err);
  }
}

// Initial bootstrap from file cache
loadFromFileCache();

// Async background sync with Firestore
let hasSyncedWithCloud = false;
export async function syncMembersFromCloud(force = false): Promise<void> {
  if (hasSyncedWithCloud && !force) return;
  try {
    const cloudMembers = await getAllMembersFromCloud();
    if (cloudMembers && cloudMembers.length > 0) {
      for (const m of cloudMembers) {
        if (m && m.email) {
          const emailLower = m.email.toLowerCase();
          const existing = memoryMembers.get(emailLower);
          if (!existing) {
            memoryMembers.set(emailLower, m as ServerMember);
          } else {
            const merged: ServerMember = {
              ...existing,
              ...m,
              trafficBalance: m.trafficBalance !== undefined ? m.trafficBalance : existing.trafficBalance,
              totalTrafficAssigned: Math.max(existing.totalTrafficAssigned || 0, m.totalTrafficAssigned || 0),
              isPaidUser: (m.isPaidUser !== undefined ? m.isPaidUser : existing.isPaidUser),
              trafficStatus: m.trafficStatus || existing.trafficStatus,
              tier: m.tier || existing.tier,
            };
            memoryMembers.set(emailLower, merged);
          }
        }
      }
      saveToFileCache();
      console.log(`[STORE] Successfully synchronized ${cloudMembers.length} member(s) from Firestore cloud database.`);
    }
    hasSyncedWithCloud = true;
  } catch (e) {
    console.warn('[STORE] Cloud members sync deferred:', e);
  }
}

// Trigger initial cloud sync in background
syncMembersFromCloud().catch(() => {});

/**
 * Retrieves a member from memory, file cache, or Firestore.
 * When forceCloudCheck is true, always queries Firestore to retrieve the absolute latest quota & balance.
 */
export async function findMember(query: string, forceCloudCheck = false): Promise<ServerMember | null> {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return null;

  // 1. If fresh cloud check is requested, query Firestore first
  if (forceCloudCheck) {
    try {
      const cloudRecord = await getMemberFromCloud(clean);
      if (cloudRecord && cloudRecord.email) {
        const parsed = cloudRecord as ServerMember;
        const existing = memoryMembers.get(parsed.email.toLowerCase());
        const merged: ServerMember = {
          ...(existing || {}),
          ...parsed,
          trafficBalance: parsed.trafficBalance !== undefined ? parsed.trafficBalance : (existing?.trafficBalance || 0),
          totalTrafficAssigned: Math.max(existing?.totalTrafficAssigned || 0, parsed.totalTrafficAssigned || 0),
        };
        memoryMembers.set(parsed.email.toLowerCase(), merged);
        saveToFileCache();
        return merged;
      }
    } catch (err) {
      console.warn('[STORE] Fresh cloud check error, falling back to cache:', err);
    }
  }

  // 2. Check memory cache
  let member = memoryMembers.get(clean);
  if (!member) {
    for (const m of memoryMembers.values()) {
      if (
        (m.username && m.username.toLowerCase() === clean) ||
        (m.id && (m.id === query.trim() || m.id.toLowerCase() === clean)) ||
        ((m as any).uid && ((m as any).uid === query.trim() || (m as any).uid.toLowerCase() === clean)) ||
        (m.email && m.email.toLowerCase() === clean)
      ) {
        member = m;
        break;
      }
    }
  }
  if (member) return member;

  // 3. Try reloading from file cache in case another worker updated it
  loadFromFileCache();
  member = memoryMembers.get(clean);
  if (!member) {
    for (const m of memoryMembers.values()) {
      if (
        (m.username && m.username.toLowerCase() === clean) ||
        (m.id && (m.id === query.trim() || m.id.toLowerCase() === clean)) ||
        ((m as any).uid && ((m as any).uid === query.trim() || (m as any).uid.toLowerCase() === clean)) ||
        (m.email && m.email.toLowerCase() === clean)
      ) {
        member = m;
        break;
      }
    }
  }
  if (member) return member;

  // 4. Fall back to querying Firestore directly (essential for cold-started serverless functions)
  try {
    const cloudRecord = await getMemberFromCloud(clean);
    if (cloudRecord && cloudRecord.email) {
      const parsed = cloudRecord as ServerMember;
      memoryMembers.set(parsed.email.toLowerCase(), parsed);
      saveToFileCache();
      return parsed;
    }
  } catch (err) {
    console.warn('[STORE] Error querying member from cloud:', err);
  }

  return null;
}

/**
 * Returns all members currently in memory, reloading from file/cloud if empty or if forceCloud is specified
 */
export async function listAllMembers(forceCloud = false): Promise<ServerMember[]> {
  if (memoryMembers.size === 0 || forceCloud) {
    loadFromFileCache();
    await syncMembersFromCloud(forceCloud);
  }
  return Array.from(memoryMembers.values());
}

/**
 * Saves or updates a member in memory, file cache, and Firestore cloud database
 */
export async function persistMember(member: ServerMember): Promise<void> {
  if (!member || !member.email) return;
  const emailLower = member.email.toLowerCase();

  // Update memory
  memoryMembers.set(emailLower, member);

  // Write to local file cache
  saveToFileCache();

  // Persist to Cloud Firestore
  try {
    await saveMemberToCloud(member);
  } catch (err) {
    console.warn('[STORE] Could not save member to cloud database:', err);
  }
}

/**
 * Saves a pending verification state to memory and Firestore
 */
export async function persistPending(pending: PendingVerification): Promise<void> {
  if (!pending || !pending.email) return;
  const emailLower = pending.email.toLowerCase();

  memoryPending.set(emailLower, pending);

  // Persist to Cloud Firestore so other serverless instances can verify the code
  try {
    await savePendingToCloud(emailLower, pending);
  } catch (err) {
    console.warn('[STORE] Could not save pending verification to cloud:', err);
  }
}

/**
 * Retrieves a pending verification from memory or Firestore
 */
export async function findPending(email: string): Promise<PendingVerification | null> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return null;

  // 1. Check memory
  const mem = memoryPending.get(clean);
  if (mem) return mem;

  // 2. Check Firestore
  try {
    const cloudPending = await getPendingFromCloud(clean);
    if (cloudPending && cloudPending.code) {
      const parsed = cloudPending as PendingVerification;
      memoryPending.set(clean, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('[STORE] Could not get pending verification from cloud:', err);
  }

  return null;
}

/**
 * Deletes a pending verification from memory and Firestore
 */
export async function removePending(email: string): Promise<void> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return;

  memoryPending.delete(clean);

  try {
    await deletePendingFromCloud(clean);
  } catch (err) {
    console.warn('[STORE] Could not remove pending verification from cloud:', err);
  }
}

/**
 * Lists all active (unexpired) pending verifications for Super Admin inspection
 */
export function listPendingVerifications(): Array<Omit<PendingVerification, 'passwordHash'>> {
  const now = Date.now();
  const list: Array<Omit<PendingVerification, 'passwordHash'>> = [];
  for (const item of memoryPending.values()) {
    if (item.expiresAt > now) {
      const { passwordHash: _, ...safe } = item;
      list.push(safe);
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Deletes a member from memory, file cache, and Cloud Firestore
 */
export async function deleteMember(userIdOrEmail: string, optionalEmail?: string): Promise<boolean> {
  const clean = (userIdOrEmail || '').trim().toLowerCase();
  const cleanEmail = (optionalEmail || '').trim().toLowerCase();
  if (!clean && !cleanEmail) return false;

  let targetKey: string | null = null;
  let targetId: string | null = null;

  if (clean && memoryMembers.has(clean)) {
    targetKey = clean;
    targetId = memoryMembers.get(clean)?.id || null;
  } else if (cleanEmail && memoryMembers.has(cleanEmail)) {
    targetKey = cleanEmail;
    targetId = memoryMembers.get(cleanEmail)?.id || null;
  } else {
    for (const [em, m] of memoryMembers.entries()) {
      if (
        m.id === userIdOrEmail ||
        (m.id && m.id.toLowerCase() === clean) ||
        ((m as any).uid && (m as any).uid === userIdOrEmail) ||
        em === clean ||
        em === cleanEmail ||
        (m.email && (m.email.toLowerCase() === clean || m.email.toLowerCase() === cleanEmail))
      ) {
        targetKey = em;
        targetId = m.id || (m as any).uid || null;
        break;
      }
    }
  }

  if (targetKey) {
    memoryMembers.delete(targetKey);
    saveToFileCache();
  } else {
    // Check file cache if cold
    loadFromFileCache();
    for (const [em, m] of memoryMembers.entries()) {
      if (
        m.id === userIdOrEmail ||
        (m.id && m.id.toLowerCase() === clean) ||
        em === clean ||
        em === cleanEmail ||
        (m.email && (m.email.toLowerCase() === clean || m.email.toLowerCase() === cleanEmail))
      ) {
        targetKey = em;
        targetId = m.id || (m as any).uid || null;
        memoryMembers.delete(em);
        saveToFileCache();
        break;
      }
    }
  }

  // Purge from Cloud Firestore so it never re-appears
  try {
    const firestoreEmail = targetKey || cleanEmail || (clean.includes('@') ? clean : undefined);
    await deleteMemberFromCloud(targetId || userIdOrEmail, firestoreEmail);
  } catch (err) {
    console.warn('[STORE] Could not delete member from Firestore cloud:', err);
  }

  return true;
}

