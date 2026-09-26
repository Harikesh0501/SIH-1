import * as SQLite from 'expo-sqlite';

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

let dbInstance: any = null;
let trenchModeActive = false;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('rakshak_offline.db');
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
  }
  return dbInstance;
}

// -------------------------------------------------------------
// CHECK-IN QUEUE
// -------------------------------------------------------------
export async function saveCheckInLocally(
  checkin: Omit<OfflineCheckIn, 'id' | 'synced'>
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
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
  return result.lastInsertRowId;
}

export async function getPendingCheckIns(): Promise<OfflineCheckIn[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT * FROM offline_checkins WHERE synced = 0 ORDER BY created_at ASC;`
  );
  return rows as OfflineCheckIn[];
}

export async function markCheckInSynced(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE offline_checkins SET synced = 1 WHERE id = ?;`, [id]);
}

// -------------------------------------------------------------
// LEAVE QUEUE
// -------------------------------------------------------------
export async function saveLeaveLocally(
  leave: Omit<OfflineLeave, 'id' | 'synced'>
): Promise<number> {
  const db = await getDatabase();
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

export async function getPendingLeaves(): Promise<OfflineLeave[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT * FROM offline_leaves WHERE synced = 0 ORDER BY created_at ASC;`
  );
  return (rows as any[]).map((r) => ({
    ...r,
    is_emergency_welfare_request: Boolean(r.is_emergency_welfare_request),
  }));
}

export async function markLeaveSynced(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE offline_leaves SET synced = 1 WHERE id = ?;`, [id]);
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
  trenchModeActive = active;
}

export async function getFieldTrenchMode(): Promise<boolean> {
  return trenchModeActive;
}
