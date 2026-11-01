// ============================================================
// TIMER ENGINE — Exercise OS
// Timestamp-based precision interval execution engine
// Handles throttling, visibility change, pausing, phase skipping
// ============================================================

import type { WorkoutDefinition, ActivePhaseState } from '../types';

export type IntervalType = 'warmup' | 'work' | 'rest' | 'transition' | 'cooldown';

export interface FlatInterval {
  id: string;
  index: number;
  phaseId: string;
  phaseName: string;
  phaseType: IntervalType;
  label: string;
  roundNumber?: number;
  totalRounds?: number;
  exerciseName?: string;
  exerciseIndex?: number;
  totalExercises?: number;
  durationSeconds: number;
  isRest: boolean;
  isTransition: boolean;
  nextLabel?: string;
  coachingCategory: string;
  coachingCues?: string[];
  alternativeName?: string;
}

export function flattenWorkout(workout: WorkoutDefinition): FlatInterval[] {
  const intervals: FlatInterval[] = [];
  let index = 0;

  for (const phase of workout.phases) {
    if (phase.type === 'warmup' || phase.type === 'cooldown' || phase.type === 'transition') {
      if (phase.exercises && phase.exercises.length > 0) {
        phase.exercises.forEach((ex, exIdx) => {
          intervals.push({
            id: `${phase.id}-ex-${exIdx}`,
            index: index++,
            phaseId: phase.id,
            phaseName: phase.name,
            phaseType: phase.type,
            label: phase.displayLabel ?? phase.name.toUpperCase(),
            exerciseName: ex.name,
            exerciseIndex: exIdx,
            totalExercises: phase.exercises!.length,
            durationSeconds: ex.durationSeconds,
            isRest: false,
            isTransition: phase.type === 'transition',
            coachingCategory: phase.coachingCategory,
            coachingCues: phase.coachingCues,
            alternativeName: ex.alternativeName,
          });
        });
      } else {
        intervals.push({
          id: `${phase.id}-single`,
          index: index++,
          phaseId: phase.id,
          phaseName: phase.name,
          phaseType: phase.type,
          label: phase.displayLabel ?? phase.name.toUpperCase(),
          durationSeconds: phase.durationSeconds,
          isRest: false,
          isTransition: phase.type === 'transition',
          coachingCategory: phase.coachingCategory,
          coachingCues: phase.coachingCues,
        });
      }
    } else if (phase.type === 'work') {
      const rounds = phase.rounds ?? 1;
      const roundDuration = phase.roundDurationSeconds ?? phase.durationSeconds;
      const restDuration = phase.restDurationSeconds ?? 0;
      const exercises = phase.exercises;

      for (let r = 0; r < rounds; r++) {
        const roundNumber = r + 1;
        const isLastRound = r === rounds - 1;

        if (exercises && exercises.length > 0) {
          exercises.forEach((ex, exIdx) => {
            intervals.push({
              id: `${phase.id}-r${roundNumber}-ex${exIdx}`,
              index: index++,
              phaseId: phase.id,
              phaseName: phase.name,
              phaseType: 'work',
              label: phase.displayLabel ?? phase.name.toUpperCase(),
              roundNumber,
              totalRounds: rounds,
              exerciseName: ex.name,
              exerciseIndex: exIdx,
              totalExercises: exercises.length,
              durationSeconds: ex.durationSeconds,
              isRest: false,
              isTransition: false,
              coachingCategory: phase.coachingCategory,
              coachingCues: phase.coachingCues,
              alternativeName: ex.alternativeName,
            });
          });
        } else {
          intervals.push({
            id: `${phase.id}-r${roundNumber}`,
            index: index++,
            phaseId: phase.id,
            phaseName: phase.name,
            phaseType: 'work',
            label: phase.displayLabel ?? phase.name.toUpperCase(),
            roundNumber,
            totalRounds: rounds,
            durationSeconds: roundDuration,
            isRest: false,
            isTransition: false,
            coachingCategory: phase.coachingCategory,
            coachingCues: phase.coachingCues,
          });
        }

        const includeRest = !isLastRound || phase.restAfterLastRound === true;
        if (includeRest && restDuration > 0) {
          const nextRound = roundNumber < rounds ? roundNumber + 1 : undefined;
          intervals.push({
            id: `${phase.id}-r${roundNumber}-rest`,
            index: index++,
            phaseId: `${phase.id}-rest`,
            phaseName: `${phase.name} Rest`,
            phaseType: 'rest',
            label: 'REST',
            roundNumber: nextRound,
            totalRounds: rounds,
            durationSeconds: restDuration,
            isRest: true,
            isTransition: false,
            coachingCategory: phase.coachingCategory,
          });
        }
      }
    }
  }

  // Populate nextLabel for upcoming activity display
  for (let i = 0; i < intervals.length; i++) {
    if (!intervals[i].nextLabel && i + 1 < intervals.length) {
      const next = intervals[i + 1];
      if (next.isRest) {
        intervals[i].nextLabel = 'REST';
      } else if (next.exerciseName) {
        intervals[i].nextLabel = next.exerciseName;
      } else if (next.roundNumber && next.totalRounds) {
        intervals[i].nextLabel = `${next.label} (Round ${next.roundNumber})`;
      } else {
        intervals[i].nextLabel = next.label;
      }
    }
  }

  return intervals;
}

export function computeTotalDuration(intervals: FlatInterval[]): number {
  return intervals.reduce((acc, curr) => acc + curr.durationSeconds, 0);
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  currentIntervalIndex: number;
  currentInterval: FlatInterval | null;
  nextInterval: FlatInterval | null;
  intervalRemainingSeconds: number;
  totalRemainingSeconds: number;
  totalDurationSeconds: number;
  progressPercent: number;
  elapsedSeconds: number;
}

export interface TimerEngineCallbacks {
  onTick: (state: TimerState) => void;
  onIntervalComplete: (completed: FlatInterval, next: FlatInterval | null) => void;
  onWorkoutComplete: () => void;
  onStateChange: (state: ActivePhaseState) => void;
}

export class TimerEngine {
  private intervals: FlatInterval[];
  private totalDuration: number;
  private currentIndex: number = 0;
  private intervalTargetTimestamp: number = 0;
  private workoutStartTimestamp: number = 0;
  private pausedAtMs: number | null = null;
  private totalPausedMs: number = 0;
  private tickTimerId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private isFinished: boolean = false;
  private callbacks: TimerEngineCallbacks;
  private elapsedSecondsBeforeCurrent: number = 0;

  constructor(intervals: FlatInterval[], callbacks: TimerEngineCallbacks) {
    this.intervals = intervals;
    this.totalDuration = computeTotalDuration(intervals);
    this.callbacks = callbacks;
  }

  start(restoreState?: ActivePhaseState): void {
    const now = Date.now();

    if (restoreState && restoreState.phaseIndex < this.intervals.length) {
      this.currentIndex = restoreState.phaseIndex;
      this.totalPausedMs = restoreState.pauseAccumulatedMs;
      this.workoutStartTimestamp = restoreState.workoutStartTimestamp;
      this.recalculateElapsedBefore();

      if (restoreState.isPaused && restoreState.pausedAt) {
        const pauseDelta = now - restoreState.pausedAt;
        this.totalPausedMs += pauseDelta;
        this.intervalTargetTimestamp = restoreState.phaseEndTimestamp + pauseDelta;
        this.pausedAtMs = now;
        this.isRunning = false;
      } else {
        this.intervalTargetTimestamp = restoreState.phaseEndTimestamp;
        this.pausedAtMs = null;
        this.isRunning = true;
      }
    } else {
      this.currentIndex = 0;
      this.totalPausedMs = 0;
      this.workoutStartTimestamp = now;
      this.elapsedSecondsBeforeCurrent = 0;
      this.pausedAtMs = null;
      this.isRunning = true;

      if (this.intervals.length > 0) {
        this.intervalTargetTimestamp = now + this.intervals[0].durationSeconds * 1000;
      }
    }

    this.isFinished = false;
    this.startTickInterval();
    this.broadcastTick();
    this.broadcastStateChange();
  }

  pause(): void {
    if (!this.isRunning || this.pausedAtMs !== null) return;
    this.pausedAtMs = Date.now();
    this.isRunning = false;
    this.stopTickInterval();
    this.broadcastTick();
    this.broadcastStateChange();
  }

  resume(): void {
    if (this.isRunning || this.pausedAtMs === null) return;
    const now = Date.now();
    const pausedDuration = now - this.pausedAtMs;
    this.totalPausedMs += pausedDuration;
    this.intervalTargetTimestamp += pausedDuration;
    this.pausedAtMs = null;
    this.isRunning = true;
    this.startTickInterval();
    this.broadcastTick();
    this.broadcastStateChange();
  }

  skipInterval(): void {
    if (this.isFinished) return;
    this.advanceInterval();
  }

  skipRound(): void {
    if (this.currentIndex >= this.intervals.length) return;
    const current = this.intervals[this.currentIndex];
    const basePhaseId = current.phaseId.replace(/-rest$/, '');
    const roundToSkip = current.roundNumber;

    if (roundToSkip === undefined) {
      this.advanceInterval();
      return;
    }

    while (this.currentIndex < this.intervals.length) {
      const candidate = this.intervals[this.currentIndex];
      const candBase = candidate.phaseId.replace(/-rest$/, '');
      if (candBase === basePhaseId && candidate.roundNumber === roundToSkip) {
        this.currentIndex++;
      } else {
        break;
      }
    }

    if (this.currentIndex >= this.intervals.length) {
      this.finalizeWorkout();
    } else {
      this.recalculateElapsedBefore();
      this.resetIntervalTimestamp();
      this.broadcastTick();
      this.broadcastStateChange();
    }
  }

  restartRound(): void {
    if (this.currentIndex >= this.intervals.length) return;
    const current = this.intervals[this.currentIndex];
    const basePhaseId = current.phaseId.replace(/-rest$/, '');
    const currentRound = current.roundNumber;

    if (currentRound === undefined) {
      this.resetIntervalTimestamp();
      this.broadcastTick();
      this.broadcastStateChange();
      return;
    }

    let firstIndex = this.currentIndex;
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      const candidate = this.intervals[i];
      const candBase = candidate.phaseId.replace(/-rest$/, '');
      if (candBase === basePhaseId && candidate.roundNumber === currentRound) {
        firstIndex = i;
      } else {
        break;
      }
    }

    this.currentIndex = firstIndex;
    this.recalculateElapsedBefore();
    this.resetIntervalTimestamp();
    this.broadcastTick();
    this.broadcastStateChange();
  }

  stop(): void {
    this.stopTickInterval();
    this.isRunning = false;
    this.isFinished = true;
  }

  handleVisibilityChange(): void {
    if (document.hidden) return;
    if (!this.isRunning) return;

    const now = Date.now();
    let remainingMs = this.intervalTargetTimestamp - now;

    // Fast-forward any intervals completed while suspended
    while (remainingMs <= 0 && this.currentIndex < this.intervals.length) {
      const completed = this.intervals[this.currentIndex];
      const next = this.intervals[this.currentIndex + 1] ?? null;
      this.callbacks.onIntervalComplete(completed, next);

      this.currentIndex++;
      this.elapsedSecondsBeforeCurrent += completed.durationSeconds;

      if (this.currentIndex >= this.intervals.length) {
        this.finalizeWorkout();
        return;
      }

      const nextInterval = this.intervals[this.currentIndex];
      this.intervalTargetTimestamp += nextInterval.durationSeconds * 1000;
      remainingMs = this.intervalTargetTimestamp - now;
    }

    this.broadcastTick();
    this.broadcastStateChange();
  }

  private startTickInterval(): void {
    this.stopTickInterval();
    this.tickTimerId = setInterval(() => this.processTick(), 250);
  }

  private stopTickInterval(): void {
    if (this.tickTimerId !== null) {
      clearInterval(this.tickTimerId);
      this.tickTimerId = null;
    }
  }

  private processTick(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const remainingMs = this.intervalTargetTimestamp - now;

    if (remainingMs <= 0) {
      this.advanceInterval();
      return;
    }

    this.broadcastTick();
  }

  private advanceInterval(): void {
    if (this.currentIndex >= this.intervals.length) return;

    const completed = this.intervals[this.currentIndex];
    const next = this.intervals[this.currentIndex + 1] ?? null;

    this.callbacks.onIntervalComplete(completed, next);
    this.elapsedSecondsBeforeCurrent += completed.durationSeconds;
    this.currentIndex++;

    if (this.currentIndex >= this.intervals.length) {
      this.finalizeWorkout();
      return;
    }

    this.resetIntervalTimestamp();
    this.broadcastTick();
    this.broadcastStateChange();
  }

  private resetIntervalTimestamp(): void {
    if (this.currentIndex >= this.intervals.length) return;
    const now = Date.now();
    const intervalSecs = this.intervals[this.currentIndex].durationSeconds;
    this.intervalTargetTimestamp = now + intervalSecs * 1000;
    if (this.pausedAtMs !== null) {
      this.pausedAtMs = now;
    }
  }

  private recalculateElapsedBefore(): void {
    this.elapsedSecondsBeforeCurrent = this.intervals
      .slice(0, this.currentIndex)
      .reduce((sum, iv) => sum + iv.durationSeconds, 0);
  }

  private finalizeWorkout(): void {
    this.isFinished = true;
    this.isRunning = false;
    this.stopTickInterval();
    this.broadcastTick();
    this.callbacks.onWorkoutComplete();
  }

  private broadcastTick(): void {
    const now = Date.now();
    const current = this.intervals[this.currentIndex] ?? null;
    const next = this.intervals[this.currentIndex + 1] ?? null;

    let intervalRemainingMs = 0;
    if (current && !this.isFinished) {
      if (this.isRunning) {
        intervalRemainingMs = Math.max(0, this.intervalTargetTimestamp - now);
      } else if (this.pausedAtMs !== null) {
        intervalRemainingMs = Math.max(0, this.intervalTargetTimestamp - this.pausedAtMs);
      }
    }

    const intervalRemainingSeconds = Math.ceil(intervalRemainingMs / 1000);

    const elapsedSeconds = current
      ? this.elapsedSecondsBeforeCurrent + (current.durationSeconds - intervalRemainingSeconds)
      : this.totalDuration;

    const totalRemainingSeconds = Math.max(0, this.totalDuration - elapsedSeconds);

    const progressPercent = this.totalDuration > 0
      ? Math.min(100, Math.max(0, (elapsedSeconds / this.totalDuration) * 100))
      : 0;

    const state: TimerState = {
      isRunning: this.isRunning,
      isPaused: this.pausedAtMs !== null,
      isFinished: this.isFinished,
      currentIntervalIndex: this.currentIndex,
      currentInterval: current,
      nextInterval: next,
      intervalRemainingSeconds,
      totalRemainingSeconds,
      totalDurationSeconds: this.totalDuration,
      progressPercent,
      elapsedSeconds,
    };

    this.callbacks.onTick(state);
  }

  private broadcastStateChange(): void {
    if (this.currentIndex >= this.intervals.length) return;

    const current = this.intervals[this.currentIndex];
    const state: ActivePhaseState = {
      phaseIndex: this.currentIndex,
      roundIndex: (current?.roundNumber ?? 1) - 1,
      intervalIndex: current?.exerciseIndex ?? 0,
      isRest: current?.isRest ?? false,
      phaseEndTimestamp: this.intervalTargetTimestamp,
      workoutStartTimestamp: this.workoutStartTimestamp,
      totalRemainingSeconds: this.computeTotalRemaining(),
      isPaused: this.pausedAtMs !== null,
      pausedAt: this.pausedAtMs ?? undefined,
      pauseAccumulatedMs: this.totalPausedMs,
    };

    this.callbacks.onStateChange(state);
  }

  private computeTotalRemaining(): number {
    const now = Date.now();
    let currRemainingMs = 0;
    if (this.isRunning) {
      currRemainingMs = Math.max(0, this.intervalTargetTimestamp - now);
    } else if (this.pausedAtMs !== null) {
      currRemainingMs = Math.max(0, this.intervalTargetTimestamp - this.pausedAtMs);
    }

    const futureMs = this.intervals
      .slice(this.currentIndex + 1)
      .reduce((sum, iv) => sum + iv.durationSeconds * 1000, 0);

    return Math.ceil((currRemainingMs + futureMs) / 1000);
  }

  getCurrentState(): TimerState | null {
    if (this.currentIndex >= this.intervals.length && this.isFinished) return null;
    const now = Date.now();
    const current = this.intervals[this.currentIndex] ?? null;
    const next = this.intervals[this.currentIndex + 1] ?? null;

    let intervalRemainingMs = 0;
    if (current) {
      if (this.isRunning) {
        intervalRemainingMs = Math.max(0, this.intervalTargetTimestamp - now);
      } else if (this.pausedAtMs !== null) {
        intervalRemainingMs = Math.max(0, this.intervalTargetTimestamp - this.pausedAtMs);
      }
    }

    const intervalRemainingSeconds = Math.ceil(intervalRemainingMs / 1000);
    const elapsedSeconds = current
      ? this.elapsedSecondsBeforeCurrent + (current.durationSeconds - intervalRemainingSeconds)
      : this.totalDuration;
    const totalRemainingSeconds = Math.max(0, this.totalDuration - elapsedSeconds);

    return {
      isRunning: this.isRunning,
      isPaused: this.pausedAtMs !== null,
      isFinished: this.isFinished,
      currentIntervalIndex: this.currentIndex,
      currentInterval: current,
      nextInterval: next,
      intervalRemainingSeconds,
      totalRemainingSeconds,
      totalDurationSeconds: this.totalDuration,
      progressPercent: (elapsedSeconds / this.totalDuration) * 100,
      elapsedSeconds,
    };
  }

  getIntervals(): FlatInterval[] {
    return this.intervals;
  }
}
