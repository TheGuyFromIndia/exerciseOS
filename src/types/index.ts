// ============================================================
// CORE TYPES — Exercise OS
// ============================================================

export type WorkoutCategory = 'boxing' | 'aerobic' | 'hiit' | 'recovery';
export type PhaseType = 'warmup' | 'work' | 'rest' | 'transition' | 'cooldown';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type CoachingCategory = 'boxing' | 'bodyweight' | 'aerobic' | 'warmup' | 'cooldown';
export type CompletionStatus = 'completed' | 'partial' | 'skipped';

// ---- Workout Structure Types ----

export interface ExerciseInterval {
  name: string;
  durationSeconds: number;
  alternativeName?: string; // low-impact alternative
  cue?: string;             // exercise-specific reminder
}

export interface WorkoutPhase {
  id: string;
  name: string;
  type: PhaseType;
  durationSeconds: number;        // total phase duration
  rounds?: number;                // for repeated round phases
  roundDurationSeconds?: number;  // duration of each work round
  restDurationSeconds?: number;   // rest between rounds (seconds)
  restAfterLastRound?: boolean;   // default false
  exercises?: ExerciseInterval[]; // for structured phases (e.g. aerobic circuit, warmup)
  coachingCategory: CoachingCategory;
  coachingCues?: string[];        // phase-specific cues
  displayLabel?: string;          // custom UI badge/header
  notes?: string;
}

export interface WorkoutDefinition {
  id: string;
  name: string;
  shortName: string;
  day: DayOfWeek;
  category: WorkoutCategory;
  durationSeconds: number;        // total calculated duration in seconds
  purpose: string;
  equipment: string[];
  intensityLabel: string;         // e.g. "7–8/10"
  phases: WorkoutPhase[];
  referenceVideoUrl?: string;
  referenceVideoNote?: string;
  version: number;
}

// ---- Session / History Types ----

export interface SkippedInterval {
  phaseId: string;
  phaseName: string;
  round?: number;
  secondsRemaining: number;
  timestamp: number;
}

export interface WorkoutSession {
  id?: number;            // Dexie auto-increment ID
  workoutId: string;
  workoutName: string;
  workoutDay: DayOfWeek;
  date: string;           // ISO date "YYYY-MM-DD"
  startTime: number;      // unix ms
  endTime?: number;       // unix ms
  plannedDurationSeconds: number;
  actualDurationSeconds?: number;
  completedRounds: number;
  skippedIntervals: SkippedInterval[];
  completionStatus: CompletionStatus;
  notes?: string;
}

// ---- Active Workout State for Crash/Reload Recovery ----

export interface ActivePhaseState {
  phaseIndex: number;
  roundIndex: number;          // 0-based within phase
  intervalIndex: number;       // 0-based within phase exercises
  isRest: boolean;
  phaseEndTimestamp: number;   // absolute target end time ms
  workoutStartTimestamp: number;
  totalRemainingSeconds: number;
  isPaused: boolean;
  pausedAt?: number;           // ms timestamp when paused
  pauseAccumulatedMs: number;  // total ms spent paused
}

export interface SavedWorkoutState {
  sessionId?: number;
  workoutId: string;
  activeState: ActivePhaseState;
  savedAt: number;
}

// ---- Settings / Preferences ----

export interface VoiceSettings {
  enabled: boolean;
  voiceURI: string | null;      // null = system default
  speechRate: number;           // 0.5 – 2.0
  minuteAnnouncements: boolean;
  restAnnouncements: boolean;
  countdownAt10: boolean;
  countdownAt5: boolean;
  randomCoaching?: boolean;
  coachingFrequencySeconds?: number;
}

export interface AppSettings {
  voice: VoiceSettings;
  keepScreenAwake: boolean;
  showSkipConfirmation: boolean;
}

// ---- App Navigation ----

export type AppScreen = 'home' | 'overview' | 'workout' | 'history' | 'settings';
