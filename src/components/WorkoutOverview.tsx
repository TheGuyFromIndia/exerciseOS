// ============================================================
// WorkoutOverview — Pre-workout inspection screen
// ============================================================

import type { WorkoutDefinition } from '../types';
import { formatTime, formatDurationLong, DAY_DISPLAY_NAMES } from '../utils';
import { ArrowLeft, Play, ExternalLink, ShieldCheck, Flame, Dumbbell } from 'lucide-react';

interface WorkoutOverviewProps {
  workout: WorkoutDefinition;
  onStart: () => void;
  onBack: () => void;
}

const CATEGORY_STYLES = {
  boxing: {
    accentText: 'text-blue-400',
    badge: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  },
  aerobic: {
    accentText: 'text-teal-400',
    badge: 'bg-teal-900/40 text-teal-300 border-teal-700/40',
  },
  hiit: {
    accentText: 'text-amber-400',
    badge: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
  },
  recovery: {
    accentText: 'text-slate-400',
    badge: 'bg-slate-800/40 text-slate-300 border-slate-700/40',
  },
};

export function WorkoutOverview({ workout, onStart, onBack }: WorkoutOverviewProps) {
  const catStyle = CATEGORY_STYLES[workout.category];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 pt-safe-top">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${catStyle.accentText}`}>
              {DAY_DISPLAY_NAMES[workout.day]} · {workout.category}
            </span>
            <h1 className="text-base font-black text-white truncate leading-tight">
              {workout.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {/* At-a-Glance Stat Pills */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/60 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Duration
            </span>
            <span className="text-lg font-black font-mono text-white block">
              {formatTime(workout.durationSeconds)}
            </span>
            <span className="text-[11px] text-slate-500">
              {formatDurationLong(workout.durationSeconds)}
            </span>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/60 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame size={12} className={catStyle.accentText} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Intensity
              </span>
            </div>
            <span className={`text-lg font-black block ${catStyle.accentText}`}>
              {workout.intensityLabel}
            </span>
            <span className="text-[11px] text-slate-500">RPE scale</span>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/60 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dumbbell size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phases
              </span>
            </div>
            <span className="text-lg font-black text-white block">
              {workout.phases.length}
            </span>
            <span className="text-[11px] text-slate-500">Interval blocks</span>
          </div>
        </section>

        {/* Purpose */}
        <section className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/60 space-y-1.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Session Purpose</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{workout.purpose}</p>
        </section>

        {/* Equipment */}
        <section className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/60 space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Equipment</h2>
          <ul className="space-y-1">
            {workout.equipment.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Reference Video Card (Friday) */}
        {workout.referenceVideoUrl && (
          <section className="bg-amber-950/30 rounded-2xl p-4 border border-amber-600/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Reference Video
              </h2>
              <span className="text-[10px] font-bold bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-700/40">
                Fitness Blender HIIT Ladder
              </span>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              {workout.referenceVideoNote}
            </p>
            <a
              href={workout.referenceVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 hover:text-amber-200 bg-amber-900/40 border border-amber-700/50 px-3 py-2 rounded-xl active:scale-95 transition-all"
            >
              <ExternalLink size={14} />
              Open Reference YouTube Video
            </a>
          </section>
        )}

        {/* Phase Breakdown */}
        <section className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Phase Breakdown
            </h2>
            <span className="text-xs font-mono font-bold text-slate-400">
              Total: {formatTime(workout.durationSeconds)}
            </span>
          </div>

          <div className="space-y-2">
            {workout.phases.map((phase, pIdx) => {
              const isWork = phase.type === 'work';
              const isWarm = phase.type === 'warmup';
              const isCool = phase.type === 'cooldown';

              const badgeColor = isWarm
                ? 'bg-teal-950/60 text-teal-300 border-teal-800/50'
                : isCool
                ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                : isWork
                ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/50';

              return (
                <div
                  key={phase.id}
                  className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        0{pIdx + 1}
                      </span>
                      <p className="text-sm font-bold text-white truncate">
                        {phase.name}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeColor}`}>
                        {phase.displayLabel ?? phase.type}
                      </span>
                    </div>

                    {phase.notes && (
                      <p className="text-xs text-slate-400 pl-6 leading-tight">
                        {phase.notes}
                      </p>
                    )}

                    {phase.exercises && phase.exercises.length > 0 && (
                      <div className="pl-6 pt-1 space-y-0.5">
                        {phase.exercises.map((ex, exI) => (
                          <div key={exI} className="text-xs text-slate-400 flex items-center justify-between">
                            <span className="truncate pr-2">• {ex.name}</span>
                            <span className="font-mono text-slate-500 flex-shrink-0">
                              {formatTime(ex.durationSeconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-black font-mono text-slate-200 block">
                      {formatTime(phase.durationSeconds)}
                    </span>
                    {phase.rounds && phase.rounds > 1 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {phase.rounds} rounds
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Low Impact Alternatives Note (HIIT) */}
        {workout.category === 'hiit' && (
          <section className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck size={16} className="text-teal-400" />
              <h2 className="text-xs font-black uppercase tracking-wider">
                Low-Impact Alternative Options
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40">
                <p className="font-bold text-slate-300">Flutter Kick Squats</p>
                <p className="text-teal-400">↳ Regular bodyweight squats</p>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40">
                <p className="font-bold text-slate-300">High Knees</p>
                <p className="text-teal-400">↳ Low marching in place</p>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40">
                <p className="font-bold text-slate-300">Burpees</p>
                <p className="text-teal-400">↳ Squat + step-back (no jump)</p>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40">
                <p className="font-bold text-slate-300">Jumping Jacks</p>
                <p className="text-teal-400">↳ Step-jacks (no jump)</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-30 pb-safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={onStart}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-lg tracking-wider flex items-center justify-center gap-3 shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-[0.985] transition-all"
          >
            <Play size={22} fill="currentColor" />
            START WORKOUT
          </button>
        </div>
      </div>
    </div>
  );
}
