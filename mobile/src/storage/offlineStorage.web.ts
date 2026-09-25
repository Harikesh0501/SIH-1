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

const STORAGE_KEY = 'rakshak_offline_checkins';

export async function getDatabase() {
  return null;
}

export async function saveCheckInLocally(checkin: Omit<OfflineCheckIn, 'id' | 'synced'>): Promise<number> {
  const generatedId = Date.now();
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineCheckIn[] = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    const newEntry: OfflineCheckIn = { ...checkin, id: generatedId, synced: 0 };
    existing.push(newEntry);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
  return generatedId;
}

export async function getPendingCheckIns(): Promise<OfflineCheckIn[]> {
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineCheckIn[] = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return existing.filter((c) => c.synced === 0);
  }
  return [];
}

export async function markCheckInSynced(id: number): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing: OfflineCheckIn[] = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = existing.map((c) => (c.id === id ? { ...c, synced: 1 } : c));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}
