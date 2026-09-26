import { Platform } from 'react-native';

export interface OfflineCheckIn {
  id?: number;
  mood_score: number;
  sleep_hours: number;
  sleep_quality: number;
  physical_exhaustion: number;
  mental_stress_rating: number;
  phq4_score: number;
  voluntary_notes: string;
  created_at: string;
  synced: number;
}

export interface OfflineLeave {
  id?: number;
  leave_type: string;
  days_requested: number;
  start_date: string;
  end_date: string;
  personal_reason: string;
  is_emergency_welfare_request: boolean;
  confidential_notes?: string;
  created_at: string;
  synced: number;
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  details: string[];
}

const CHECKIN_STORAGE_KEY = 'rakshak_offline_checkins';
const LEAVE_STORAGE_KEY = 'rakshak_offline_leaves';
const TRENCH_MODE_KEY = 'rakshak_trench_mode_active';

let dbInstance: any = null;

async function getNativeDb() {
  if (Platform.OS === 'web') return null;
  if (!dbInstance) {
    try {
      const SQLite = await import('expo-sqlite');
      dbInstance = await SQLite.openDatabaseAsync('rakshak_offline_v2.db');
      await dbInstance.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS offline_checkins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mood_score INTEGER,
          sleep_hours REAL,
          sleep_quality INTEGER,
          physical_exhaustion INTEGER,
          mental_stress_rating INTEGER,
          phq4_score INTEGER,
          voluntary_notes TEXT,
          created_at TEXT,
          synced INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS offline_leaves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          leave_type TEXT,
          days_requested INTEGER,
          start_date TEXT,
          end_date TEXT,
          personal_reason TEXT,
          is_emergency_welfare_request INTEGER,
          confidential_notes TEXT,
          created_at TEXT,
          synced INTEGER DEFAULT 0
        );
      `);
    } catch (e) {
      console.warn('SQLite init warning, using web fallback:', e);
      return null;
    }
  }
  return dbInstance;
}

// -------------------------------------------------------------
// CHECK-IN QUEUE
// -------------------------------------------------------------
export async function saveCheckInLocally(
  checkin: Omit<OfflineCheckIn, 'id' | 'synced'>
): Promise<number> {
  const db = await getNativeDb();
  if (db) {
    const res = await db.runAsync(
      `INSERT INTO offline_checkins 
        (mood_score, sleep_hours, sleep_quality, physical_exhaustion, mental_stress_rating, phq4_score, voluntary_notes, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        checkin.mood_score,
        checkin.sleep_hours,
        checkin.sleep_quality,
        checkin.physical_exhaustion,
        checkin.mental_stress_rating,
        checkin.phq4_score,
        checkin.voluntary_notes,
        checkin.created_at,
      ]
    );
    return res.lastInsertRowId;
  }

  // Web / Fallback
  const generatedId = Date.now();
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineCheckIn[] = JSON.parse(
      window.localStorage.getItem(CHECKIN_STORAGE_KEY) || '[]'
    );
    existing.push({ ...checkin, id: generatedId, synced: 0 });
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(existing));
  }
  return generatedId;
}

export async function getPendingCheckIns(): Promise<OfflineCheckIn[]> {
  const db = await getNativeDb();
  if (db) {
    const rows = await db.getAllAsync(
      `SELECT * FROM offline_checkins WHERE synced = 0 ORDER BY created_at ASC;`
    );
    return rows as OfflineCheckIn[];
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineCheckIn[] = JSON.parse(
      window.localStorage.getItem(CHECKIN_STORAGE_KEY) || '[]'
    );
    return existing.filter((c) => c.synced === 0);
  }
  return [];
}

export async function markCheckInSynced(id: number): Promise<void> {
  const db = await getNativeDb();
  if (db) {
    await db.runAsync(`UPDATE offline_checkins SET synced = 1 WHERE id = ?;`, [id]);
    return;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineCheckIn[] = JSON.parse(
      window.localStorage.getItem(CHECKIN_STORAGE_KEY) || '[]'
    );
    const updated = existing.map((c) => (c.id === id ? { ...c, synced: 1 } : c));
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(updated));
  }
}

// -------------------------------------------------------------
// LEAVE & GRIEVANCE QUEUE
// -------------------------------------------------------------
export async function saveLeaveLocally(
  leave: Omit<OfflineLeave, 'id' | 'synced'>
): Promise<number> {
  const db = await getNativeDb();
  if (db) {
    const res = await db.runAsync(
      `INSERT INTO offline_leaves 
        (leave_type, days_requested, start_date, end_date, personal_reason, is_emergency_welfare_request, confidential_notes, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        leave.leave_type,
        leave.days_requested,
        leave.start_date,
        leave.end_date,
        leave.personal_reason,
        leave.is_emergency_welfare_request ? 1 : 0,
        leave.confidential_notes || '',
        leave.created_at,
      ]
    );
    return res.lastInsertRowId;
  }

  const generatedId = Date.now();
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineLeave[] = JSON.parse(
      window.localStorage.getItem(LEAVE_STORAGE_KEY) || '[]'
    );
    existing.push({ ...leave, id: generatedId, synced: 0 });
    window.localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(existing));
  }
  return generatedId;
}

export async function getPendingLeaves(): Promise<OfflineLeave[]> {
  const db = await getNativeDb();
  if (db) {
    const rows = await db.getAllAsync(
      `SELECT * FROM offline_leaves WHERE synced = 0 ORDER BY created_at ASC;`
    );
    return (rows as any[]).map((r) => ({
      ...r,
      is_emergency_welfare_request: Boolean(r.is_emergency_welfare_request),
    }));
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineLeave[] = JSON.parse(
      window.localStorage.getItem(LEAVE_STORAGE_KEY) || '[]'
    );
    return existing.filter((l) => l.synced === 0);
  }
  return [];
}

export async function markLeaveSynced(id: number): Promise<void> {
  const db = await getNativeDb();
  if (db) {
    await db.runAsync(`UPDATE offline_leaves SET synced = 1 WHERE id = ?;`, [id]);
    return;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineLeave[] = JSON.parse(
      window.localStorage.getItem(LEAVE_STORAGE_KEY) || '[]'
    );
    const updated = existing.map((l) => (l.id === id ? { ...l, synced: 1 } : l));
    window.localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(updated));
  }
}

// -------------------------------------------------------------
// QUEUE SUMMARY & SYNC ENGINE
// -------------------------------------------------------------
export async function getPendingCount(): Promise<{
  checkins: number;
  leaves: number;
  total: number;
}> {
  const checkins = await getPendingCheckIns();
  const leaves = await getPendingLeaves();
  return {
    checkins: checkins.length,
    leaves: leaves.length,
    total: checkins.length + leaves.length,
  };
}

export async function syncAllPending(apiClient: any): Promise<SyncResult> {
  const checkins = await getPendingCheckIns();
  const leaves = await getPendingLeaves();

  let synced = 0;
  let failed = 0;
  const details: string[] = [];

  // 1. Sync Check-ins
  for (const c of checkins) {
    try {
      await apiClient.post('/api/jawan/check-in', {
        mood_score: c.mood_score,
        sleep_hours: c.sleep_hours,
        sleep_quality: c.sleep_quality,
        physical_exhaustion: c.physical_exhaustion,
        mental_stress_rating: c.mental_stress_rating,
        phq4_score: c.phq4_score,
        voluntary_notes: c.voluntary_notes,
        is_offline_synced: true,
      });
      if (c.id) {
        await markCheckInSynced(c.id);
      }
      synced++;
      details.push(`Check-in #${c.id || synced} synced`);
    } catch (e: any) {
      failed++;
      details.push(`Check-in #${c.id} failed: ${e?.message || 'Network error'}`);
    }
  }

  // 2. Sync Leaves
  for (const l of leaves) {
    try {
      await apiClient.post('/api/jawan/leave-request', {
        leave_type: l.leave_type,
        days_requested: l.days_requested,
        start_date: l.start_date,
        end_date: l.end_date,
        personal_reason: l.personal_reason,
        is_emergency_welfare_request: l.is_emergency_welfare_request,
        confidential_notes: l.confidential_notes,
      });
      if (l.id) {
        await markLeaveSynced(l.id);
      }
      synced++;
      details.push(`Leave request #${l.id || synced} synced`);
    } catch (e: any) {
      failed++;
      details.push(`Leave #${l.id} failed: ${e?.message || 'Network error'}`);
    }
  }

  return {
    total: checkins.length + leaves.length,
    synced,
    failed,
    details,
  };
}

// -------------------------------------------------------------
// FIELD TRENCH SIMULATION FLAG
// -------------------------------------------------------------
export async function setFieldTrenchMode(active: boolean): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(TRENCH_MODE_KEY, active ? 'true' : 'false');
  }
}

export async function getFieldTrenchMode(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(TRENCH_MODE_KEY) === 'true';
  }
  return false;
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await getNativeDb();
  if (db) {
    await db.runAsync(`DELETE FROM offline_checkins;`);
    await db.runAsync(`DELETE FROM offline_leaves;`);
    return;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(CHECKIN_STORAGE_KEY);
    window.localStorage.removeItem(LEAVE_STORAGE_KEY);
  }
}
