// ============================================================
// useWorkout — Exercise OS Hook
// Orchestrates TimerEngine, VoiceCoach, Screen Wake Lock, and IndexedDB
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerEngine, flattenWorkout, type TimerState, type FlatInterval } from '../engine/TimerEngine';
import { VoiceCoach } from '../engine/VoiceCoach';
import type { WorkoutDefinition, AppSettings, SkippedInterval } from '../types';
import {
  saveSession,
  updateSession,
  saveActiveWorkoutState,
  clearActiveWorkoutState,
  loadActiveWorkoutState,
} from '../db/database';

// Screen Wake Lock API type definition fallback
type WakeLockSentinelInstance = {
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
};

export interface WorkoutEngineHook {
  timerState: TimerState | null;
  isStarted: boolean;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  skipInterval: () => void;
  skipRound: () => void;
  restartRound: () => void;
  endWorkout: () => Promise<void>;
  sessionId: number | null;
  backgroundWarning: boolean;
  dismissBackgroundWarning: () => void;
  savedStateFound: boolean;
  resumeSavedState: () => Promise<void>;
  discardSavedState: () => Promise<void>;
}

export function useWorkout(
  workout: WorkoutDefinition | null,
  settings: AppSettings,
  onComplete: (sessionId: number | null) => void
): WorkoutEngineHook {
  const engineRef = useRef<TimerEngine | null>(null);
  const coachRef = useRef<VoiceCoach | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelInstance | null>(null);

  const sessionIdRef = useRef<number | null>(null);
  const skippedListRef = useRef<SkippedInterval[]>([]);
  const completedRoundsCountRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);

  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [backgroundWarning, setBackgroundWarning] = useState(false);
  const [savedStateFound, setSavedStateFound] = useState(false);
  const savedStateDataRef = useRef<Awaited<ReturnType<typeof loadActiveWorkoutState>> | null>(null);

  // Check for saved state on workout mount
  useEffect(() => {
    if (!workout) return;
    loadActiveWorkoutState(workout.id).then(saved => {
      if (saved && !saved.activeState.isPaused && Date.now() - saved.savedAt < 4 * 60 * 60 * 1000) {
        savedStateDataRef.current = saved;
        setSavedStateFound(true);
      }
    });
  }, [workout]);

  // Teardown
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      coachRef.current?.cancelAllSpeech();
      releaseWakeLock();
    };
  }, []);

  // Sync settings
  useEffect(() => {
    coachRef.current?.updateSettings(settings.voice);
  }, [settings.voice]);

  // Visibility change listener (iOS backgrounding recovery)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden && engineRef.current) {
        engineRef.current.handleVisibilityChange();
        setBackgroundWarning(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const requestWakeLock = async () => {
    if (!settings.keepScreenAwake) return;
    try {
      if ('wakeLock' in navigator) {
        const nav = navigator as unknown as {
          wakeLock: { request: (type: string) => Promise<WakeLockSentinelInstance> };
        };
        wakeLockRef.current = await nav.wakeLock.request('screen');
      }
    } catch {
      // Screen wake lock not permitted or supported
    }
  };

  const releaseWakeLock = () => {
    try {
      wakeLockRef.current?.release();
    } catch {
      // Ignored
    }
    wakeLockRef.current = null;
  };

  const initAndRunEngine = async (restoreState?: Parameters<TimerEngine['start']>[0], existingSessionId?: number) => {
    if (!workout) return;

    const intervals = flattenWorkout(workout);

    coachRef.current = new VoiceCoach(settings.voice);
    coachRef.current.initOnUserGesture();

    const now = Date.now();
    startTimestampRef.current = now;
    skippedListRef.current = [];
    completedRoundsCountRef.current = 0;

    let sid = existingSessionId ?? null;
    if (!sid) {
      sid = await saveSession({
        workoutId: workout.id,
        workoutName: workout.name,
        workoutDay: workout.day,
        date: new Date(now).toISOString().split('T')[0],
        startTime: now,
        plannedDurationSeconds: workout.durationSeconds,
        completedRounds: 0,
        skippedIntervals: [],
        completionStatus: 'partial',
      });
    }
    sessionIdRef.current = sid;
    setSessionId(sid);

    engineRef.current = new TimerEngine(intervals, {
      onTick: (state) => {
        setTimerState({ ...state });
        if (state.currentInterval) {
          coachRef.current?.onTick(
            state.intervalRemainingSeconds,
            state.currentInterval.durationSeconds,
            state.currentInterval
          );
        }
      },
      onIntervalComplete: (completed: FlatInterval, next: FlatInterval | null) => {
        coachRef.current?.onIntervalComplete(completed, next);
        if (!completed.isRest && completed.roundNumber) {
          completedRoundsCountRef.current++;
        }
      },
      onIntervalStart: (interval: FlatInterval) => {
        coachRef.current?.onIntervalStart(interval);
      },
      onWorkoutComplete: async () => {
        coachRef.current?.onWorkoutComplete();
        releaseWakeLock();
        const finishTime = Date.now();
        if (sessionIdRef.current !== null) {
          await updateSession(sessionIdRef.current, {
            endTime: finishTime,
            actualDurationSeconds: Math.round((finishTime - startTimestampRef.current) / 1000),
            completedRounds: completedRoundsCountRef.current,
            skippedIntervals: skippedListRef.current,
            completionStatus: 'completed',
          });
          await clearActiveWorkoutState(workout.id);
        }
        onComplete(sessionIdRef.current);
      },
      onStateChange: async (state) => {
        if (sessionIdRef.current !== null && workout) {
          await saveActiveWorkoutState({
            sessionId: sessionIdRef.current,
            workoutId: workout.id,
            activeState: state,
            savedAt: Date.now(),
          });
        }
      },
    });

    coachRef.current.onWorkoutStart();
    engineRef.current.start(restoreState);

    const first = intervals[restoreState ? restoreState.phaseIndex : 0];
    if (first) {
      coachRef.current.onIntervalStart(first);
    }

    setIsStarted(true);
    await requestWakeLock();
  };

  const start = useCallback(async () => {
    await initAndRunEngine();
  }, [workout, settings]);

  const resumeSavedState = useCallback(async () => {
    if (!savedStateDataRef.current) {
      await start();
      return;
    }
    setSavedStateFound(false);
    await initAndRunEngine(savedStateDataRef.current.activeState, savedStateDataRef.current.sessionId);
  }, [workout, settings, start]);

  const discardSavedState = useCallback(async () => {
    if (workout) {
      await clearActiveWorkoutState(workout.id);
    }
    setSavedStateFound(false);
    savedStateDataRef.current = null;
  }, [workout]);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    coachRef.current?.onWorkoutPaused();
    releaseWakeLock();
    setTimerState((s: TimerState | null) => (s ? { ...s, isPaused: true, isRunning: false } : null));
  }, []);

  const resume = useCallback(async () => {
    engineRef.current?.resume();
    coachRef.current?.onWorkoutResumed();
    await requestWakeLock();
    setTimerState((s: TimerState | null) => (s ? { ...s, isPaused: false, isRunning: true } : null));
  }, [settings.keepScreenAwake]);

  const skipInterval = useCallback(() => {
    const s = engineRef.current?.getCurrentState();
    if (s?.currentInterval) {
      skippedListRef.current.push({
        phaseId: s.currentInterval.phaseId,
        phaseName: s.currentInterval.phaseName,
        round: s.currentInterval.roundNumber,
        secondsRemaining: s.intervalRemainingSeconds,
        timestamp: Date.now(),
      });
    }
    engineRef.current?.skipInterval();
    const updated = engineRef.current?.getCurrentState();
    if (updated?.currentInterval) {
      coachRef.current?.onIntervalStart(updated.currentInterval);
    }
  }, []);

  const skipRound = useCallback(() => {
    const s = engineRef.current?.getCurrentState();
    if (s?.currentInterval) {
      skippedListRef.current.push({
        phaseId: s.currentInterval.phaseId,
        phaseName: s.currentInterval.phaseName,
        round: s.currentInterval.roundNumber,
        secondsRemaining: s.intervalRemainingSeconds,
        timestamp: Date.now(),
      });
    }
    engineRef.current?.skipRound();
    const updated = engineRef.current?.getCurrentState();
    if (updated?.currentInterval) {
      coachRef.current?.onIntervalStart(updated.currentInterval);
    }
  }, []);

  const restartRound = useCallback(() => {
    engineRef.current?.restartRound();
    const updated = engineRef.current?.getCurrentState();
    if (updated?.currentInterval) {
      coachRef.current?.onIntervalStart(updated.currentInterval);
    }
  }, []);

  const endWorkout = useCallback(async () => {
    engineRef.current?.stop();
    coachRef.current?.cancelAllSpeech();
    releaseWakeLock();

    const finishTime = Date.now();
    if (sessionIdRef.current !== null && workout) {
      await updateSession(sessionIdRef.current, {
        endTime: finishTime,
        actualDurationSeconds: Math.round((finishTime - startTimestampRef.current) / 1000),
        completedRounds: completedRoundsCountRef.current,
        skippedIntervals: skippedListRef.current,
        completionStatus: 'partial',
      });
      await clearActiveWorkoutState(workout.id);
    }

    onComplete(sessionIdRef.current);
  }, [workout, onComplete]);

  const dismissBackgroundWarning = useCallback(() => {
    setBackgroundWarning(false);
  }, []);

  return {
    timerState,
    isStarted,
    start,
    pause,
    resume,
    skipInterval,
    skipRound,
    restartRound,
    endWorkout,
    sessionId,
    backgroundWarning,
    dismissBackgroundWarning,
    savedStateFound,
    resumeSavedState,
    discardSavedState,
  };
}
