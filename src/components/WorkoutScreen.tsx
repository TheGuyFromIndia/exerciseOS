// ============================================================
// WorkoutScreen — Live workout execution screen
// Prominent BLUE for active exercise; DARK GREY for rest;
// Absolute top total remaining timer; large readable digits
// ============================================================

import { useState } from 'react';
import type { WorkoutDefinition, AppSettings } from '../types';
import { useWorkout } from '../hooks/useWorkout';
import { formatTime } from '../utils';
import {
  Pause,
  Play,
  SkipForward,
  RotateCcw,
  Square,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface WorkoutScreenProps {
  workout: WorkoutDefinition;
  settings: AppSettings;
  onComplete: (sessionId: number | null) => void;
  onBack: () => void;
}

export function WorkoutScreen({ workout, settings, onComplete, onBack }: WorkoutScreenProps) {
  const [showEndModal, setShowEndModal] = useState(false);

  const {
    timerState,
    isStarted,
    start,
    pause,
    resume,
    skipInterval,
    skipRound,
    restartRound,
    endWorkout,
    backgroundWarning,
    dismissBackgroundWarning,
    savedStateFound,
    resumeSavedState,
    discardSavedState,
  } = useWorkout(workout, settings, onComplete);

  const current = timerState?.currentInterval;
  const isRest = current?.isRest === true;
  const isTransition = current?.isTransition === true;
  const isPaused = timerState?.isPaused ?? false;
  const isFinished = timerState?.isFinished ?? false;

  // Background visual mode:
  // Active Work: Prominent Blue (#1d4ed8 / #1e40af)
  // Rest / Transition: Dark Grey (#1f2937 / #111827)
  // Warmup: Teal tint (#0f766e)
  // Cooldown: Purple tint (#581c87)
  let screenBgClass = 'bg-blue-600';
  if (isRest || isTransition) {
    screenBgClass = 'bg-slate-900';
  } else if (current?.phaseType === 'warmup') {
    screenBgClass = 'bg-teal-700';
  } else if (current?.phaseType === 'cooldown') {
    screenBgClass = 'bg-purple-800';
  }

  // Pre-start screen if user has not tapped Start
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6">
        {/* Header */}
        <div className="pt-safe-top text-center space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400">
            {workout.day.toUpperCase()} SESSION
          </span>
          <h1 className="text-2xl font-black">{workout.name}</h1>
          <p className="font-mono text-slate-400 text-sm">
            Total Duration: {formatTime(workout.durationSeconds)}
          </p>
        </div>

        {/* Reload Recovery Notice */}
        {savedStateFound ? (
          <div className="bg-blue-950/80 border border-blue-600/60 rounded-3xl p-6 text-center space-y-4 max-w-sm mx-auto shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mx-auto text-blue-300">
              <RotateCcw size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Previous Session Detected</h2>
              <p className="text-xs text-slate-300 mt-1">
                You have an in-progress workout state saved. Would you like to resume from where you left off?
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={resumeSavedState}
                className="w-full py-3.5 bg-blue-600 active:bg-blue-700 text-white font-black text-sm rounded-xl tracking-wider"
              >
                RESUME SESSION
              </button>
              <button
                type="button"
                onClick={discardSavedState}
                className="w-full py-3 bg-slate-800 active:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-blue-400">
              <Play size={24} fill="currentColor" />
            </div>
            <h2 className="text-base font-bold text-white">Ready to Train?</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tapping Start initializes the audio engine, locks the screen awake and begins the live coaching timer.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-safe-bottom max-w-sm mx-auto w-full">
          {!savedStateFound && (
            <button
              type="button"
              onClick={start}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-[0.985] transition-all"
            >
              <Play size={26} fill="currentColor" />
              START NOW
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 text-slate-500 font-bold text-xs uppercase tracking-wider"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    );
  }

  // Workout Completed Screen
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          ✓
        </div>
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
            Workout Finished
          </span>
          <h1 className="text-3xl font-black text-white">{workout.name}</h1>
          <p className="text-sm text-slate-400">
            Completed in{' '}
            <span className="font-mono text-emerald-400 font-bold">
              {timerState ? formatTime(timerState.elapsedSeconds) : '--:--'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onComplete(null)}
          className="w-full max-w-xs py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-base tracking-wider active:scale-95 transition-all shadow-lg"
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${screenBgClass} text-white flex flex-col justify-between transition-colors duration-500 select-none overflow-hidden`}
    >
      {/* Background Suspension Warning */}
      {backgroundWarning && (
        <div className="bg-amber-950/95 border-b border-amber-600 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
            <span>App was backgrounded. Timers accurately recovered from clock.</span>
          </div>
          <button
            type="button"
            onClick={dismissBackgroundWarning}
            className="text-amber-400 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP HEADER: Total workout countdown & overall progress */}
      <header className="pt-safe-top px-5 pt-3 pb-2 z-10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-md mx-auto space-y-1.5">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold">
            <span className="text-white/70">Total Workout Remaining</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white/50 text-[11px]">
                Target: {formatTime(workout.durationSeconds)}
              </span>
              <span className="text-white font-mono text-base font-black">
                {timerState ? formatTime(timerState.totalRemainingSeconds) : '--:--'}
              </span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${timerState ? timerState.progressPercent : 0}%` }}
            />
          </div>
        </div>
      </header>

      {/* CENTER AREA: Phase, Round & Large Countdown Timer */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center my-auto">
        <div className="max-w-md w-full space-y-4">
          {/* Phase & Round Banner */}
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white/80 block">
              {current?.phaseName ?? ''}
            </span>

            {/* Exercise or Phase Name */}
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
              {isRest
                ? 'REST'
                : current?.exerciseName ?? current?.label ?? workout.name}
            </h2>

            {/* Alternative (low-impact) hint */}
            {!isRest && current?.alternativeName && (
              <p className="text-xs text-white/70 font-semibold italic">
                Alt: {current.alternativeName}
              </p>
            )}

            {/* Round info if present */}
            {current?.roundNumber && current.totalRounds && current.totalRounds > 1 && (
              <div className="inline-block mt-1">
                <span className="px-3 py-1 rounded-full bg-black/30 border border-white/20 text-xs sm:text-sm font-black tracking-wider uppercase">
                  Round {current.roundNumber} of {current.totalRounds}
                </span>
              </div>
            )}
          </div>

          {/* GIANT COUNTDOWN TIMER */}
          <div className="py-2">
            <span
              className="font-mono font-black tracking-tighter text-white tabular-nums drop-shadow-2xl leading-none block"
              style={{ fontSize: 'clamp(5rem, 24vw, 8.5rem)' }}
            >
              {timerState ? formatTime(timerState.intervalRemainingSeconds) : '--:--'}
            </span>
          </div>

          {/* Up Next Preview */}
          {timerState?.nextInterval && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-xs font-semibold text-white/80 max-w-xs truncate">
              <span className="text-white/50 uppercase text-[10px] tracking-wider">Next:</span>
              <span className="truncate">
                {timerState.nextInterval.isRest
                  ? 'Rest Period'
                  : timerState.nextInterval.exerciseName ?? timerState.nextInterval.label}
              </span>
              <ArrowRight size={12} className="text-white/60 flex-shrink-0" />
            </div>
          )}

          {/* Paused indicator */}
          {isPaused && (
            <div className="animate-pulse inline-block">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-widest">
                PAUSED
              </span>
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM CONTROLS: Large touch-friendly controls */}
      <footer className="pb-safe-bottom px-5 pb-5 pt-3 z-10 bg-black/30 backdrop-blur-md">
        <div className="max-w-md mx-auto space-y-3">
          {/* Primary Action Row */}
          <div className="flex items-center justify-center gap-5">
            {/* Restart Round */}
            <button
              type="button"
              onClick={restartRound}
              className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all"
              aria-label="Restart current round"
              title="Restart Round"
            >
              <RotateCcw size={22} />
            </button>

            {/* Big Play / Pause Toggle */}
            <button
              type="button"
              onClick={isPaused ? resume : pause}
              className="w-20 h-20 rounded-3xl bg-white text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 transition-all"
              aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
            >
              {isPaused ? (
                <Play size={34} fill="currentColor" className="ml-1" />
              ) : (
                <Pause size={34} fill="currentColor" />
              )}
            </button>

            {/* Skip Interval */}
            <button
              type="button"
              onClick={skipInterval}
              className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all"
              aria-label="Skip interval"
              title="Skip Interval"
            >
              <SkipForward size={22} />
            </button>
          </div>

          {/* Secondary Controls Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={skipRound}
              className="py-2.5 px-3 rounded-xl bg-black/30 hover:bg-black/40 active:bg-black/50 border border-white/10 text-xs font-bold text-white/90 active:scale-95 transition-all"
            >
              Skip Round
            </button>

            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 active:bg-red-900/80 border border-red-700/50 text-xs font-bold text-red-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Square size={13} fill="currentColor" />
              End Workout
            </button>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal Before Ending Workout */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-700/60 flex items-center justify-center mx-auto text-red-400">
              <Square size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">End Workout Early?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your completed rounds and time elapsed will be saved to your workout history as a partial session.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setShowEndModal(false);
                  await endWorkout();
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all"
              >
                Yes, End Session
              </button>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all"
              >
                Keep Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
