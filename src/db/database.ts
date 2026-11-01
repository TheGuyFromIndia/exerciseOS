// ============================================================
// DATABASE — Exercise OS
// IndexedDB persistence via Dexie.js
// Stores: sessions, settings, active workout state (recovery)
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { WorkoutSession, AppSettings, SavedWorkoutState } from '../types';

export class ExerciseOSDatabase extends Dexie {
  sessions!: Table<WorkoutSession, number>;
  settings!: Table<{ key: string; value: unknown }, string>;
  activeState!: Table<SavedWorkoutState, string>;

  constructor() {
    super('ExerciseOSDB');

    this.version(1).stores({
      sessions: '++id, workoutId, workoutDay, date, completionStatus, startTime',
      settings: 'key',
      activeState: 'workoutId',
    });
  }
}

export const db = new ExerciseOSDatabase();

// ---- Default Application Settings ----

export const DEFAULT_SETTINGS: AppSettings = {
  voice: {
    enabled: true,
    voiceURI: null,
    speechRate: 1.0,
    minuteAnnouncements: true,
    restAnnouncements: true,
    countdownAt10: false,
    countdownAt5: true,
    randomCoaching: true,
    coachingFrequencySeconds: 30, // 25-40s range default
  },
  keepScreenAwake: true,
  showSkipConfirmation: false,
};

// ---- Settings API ----

export async function loadSettings(): Promise<AppSettings> {
  try {
    const record = await db.settings.get('appSettings');
    if (record && record.value) {
      const saved = record.value as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        voice: {
          ...DEFAULT_SETTINGS.voice,
          ...(saved.voice ?? {}),
        },
      };
    }
  } catch (err) {
    console.error('Error loading settings from IndexedDB:', err);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await db.settings.put({ key: 'appSettings', value: settings });
  } catch (err) {
    console.error('Error saving settings to IndexedDB:', err);
  }
}

// ---- Active Workout State Persistence (Reload/Crash Recovery) ----

export async function saveActiveWorkoutState(state: SavedWorkoutState): Promise<void> {
  try {
    await db.activeState.put(state);
  } catch (err) {
    console.error('Error saving active workout state:', err);
  }
}

export async function loadActiveWorkoutState(workoutId: string): Promise<SavedWorkoutState | undefined> {
  try {
    return await db.activeState.get(workoutId);
  } catch (err) {
    console.error('Error loading active workout state:', err);
    return undefined;
  }
}

export async function clearActiveWorkoutState(workoutId: string): Promise<void> {
  try {
    await db.activeState.delete(workoutId);
  } catch (err) {
    console.error('Error clearing active workout state:', err);
  }
}

// ---- Workout Session API ----

export async function saveSession(session: WorkoutSession): Promise<number> {
  return (await db.sessions.add(session)) as number;
}

export async function updateSession(id: number, updates: Partial<WorkoutSession>): Promise<void> {
  await db.sessions.update(id, updates);
}

export async function loadAllSessions(): Promise<WorkoutSession[]> {
  try {
    return await db.sessions.orderBy('startTime').reverse().toArray();
  } catch (err) {
    console.error('Error loading sessions:', err);
    return [];
  }
}

export async function loadSessionsForWeek(weekStartDate: string, weekEndDate: string): Promise<WorkoutSession[]> {
  try {
    return await db.sessions
      .where('date')
      .between(weekStartDate, weekEndDate, true, true)
      .toArray();
  } catch (err) {
    console.error('Error loading weekly sessions:', err);
    return [];
  }
}

// ---- Export / Import Data ----

export interface ExportDataPayload {
  app: string;
  version: number;
  exportedAt: string;
  sessions: WorkoutSession[];
  settings: AppSettings;
}

export async function exportUserData(): Promise<ExportDataPayload> {
  const [sessions, settings] = await Promise.all([
    loadAllSessions(),
    loadSettings(),
  ]);

  return {
    app: 'Exercise OS',
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    settings,
  };
}

export function validateImportPayload(data: unknown): data is ExportDataPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d['version'] !== 'number') return false;
  if (!Array.isArray(d['sessions'])) return false;
  return true;
}

export async function importUserData(
  payload: ExportDataPayload,
  overwrite: boolean
): Promise<{ importedCount: number; skippedCount: number }> {
  let importedCount = 0;
  let skippedCount = 0;

  if (overwrite) {
    await db.sessions.clear();
    const cleanSessions = payload.sessions.map(s => {
      const copy = { ...s };
      delete copy.id;
      return copy;
    });
    if (cleanSessions.length > 0) {
      await db.sessions.bulkAdd(cleanSessions);
    }
    importedCount = cleanSessions.length;
  } else {
    for (const session of payload.sessions) {
      const exists = await db.sessions
        .where('startTime')
        .equals(session.startTime)
        .first();
      if (!exists) {
        const copy = { ...session };
        delete copy.id;
        await db.sessions.add(copy);
        importedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  if (payload.settings) {
    await saveSettings(payload.settings);
  }

  return { importedCount, skippedCount };
}
