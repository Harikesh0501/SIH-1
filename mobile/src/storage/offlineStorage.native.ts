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

let dbInstance: any = null;

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
    `);
  }
  return dbInstance;
}

export async function saveCheckInLocally(checkin: Omit<OfflineCheckIn, 'id' | 'synced'>): Promise<number> {
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
