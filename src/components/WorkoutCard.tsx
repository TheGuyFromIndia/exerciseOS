// ============================================================
// WorkoutCard — Home screen weekly card
// Distinct visual treatments for Boxing, Aerobic, HIIT, Recovery
// ============================================================

import type { WorkoutDefinition } from '../types';
import { formatDurationLong, isToday, DAY_DISPLAY_NAMES } from '../utils';

interface WorkoutCardProps {
  day: string;
  workout: WorkoutDefinition | null;
  isCompleted: boolean;
  onClick: () => void;
}

const CATEGORY_STYLES = {
  boxing: {
    bg: 'bg-blue-950/40 hover:bg-blue-950/60 active:bg-blue-900/50',
    border: 'border-blue-600/40',
    accentText: 'text-blue-400',
    dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-700/40',
  },
  aerobic: {
    bg: 'bg-teal-950/40 hover:bg-teal-950/60 active:bg-teal-900/50',
    border: 'border-teal-600/40',
    accentText: 'text-teal-400',
    dot: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
    badge: 'bg-teal-900/60 text-teal-300 border border-teal-700/40',
  },
  hiit: {
    bg: 'bg-amber-950/40 hover:bg-amber-950/60 active:bg-amber-900/50',
    border: 'border-amber-600/40',
    accentText: 'text-amber-400',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    badge: 'bg-amber-900/60 text-amber-300 border border-amber-700/40',
  },
  recovery: {
    bg: 'bg-slate-900/30',
    border: 'border-slate-800/40',
    accentText: 'text-slate-500',
    dot: 'bg-slate-600',
    badge: 'bg-slate-800/60 text-slate-400 border border-slate-700/30',
  },
};

export function WorkoutCard({ day, workout, isCompleted, onClick }: WorkoutCardProps) {
  const today = isToday(day);
  const isTrainingDay = workout !== null;
  const style = CATEGORY_STYLES[workout?.category ?? 'recovery'];

  return (
    <button
      type="button"
      onClick={isTrainingDay ? onClick : undefined}
      className={`
        w-full text-left rounded-2xl border transition-all duration-200 select-none
        ${style.bg} ${style.border}
        ${isTrainingDay ? 'cursor-pointer active:scale-[0.985]' : 'cursor-default opacity-50'}
        ${today ? 'ring-2 ring-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''}
        p-4 sm:p-5
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className={`text-xs font-black uppercase tracking-widest ${today ? 'text-blue-400' : 'text-slate-400'}`}>
            {DAY_DISPLAY_NAMES[day]}
          </span>
          {today && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Today
            </span>
          )}
        </div>
        {isCompleted && (
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            ✓ Done
          </span>
        )}
      </div>

      {isTrainingDay && workout ? (
        <div className="space-y-2">
          <p className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
            {workout.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${style.badge}`}>
              {workout.category}
            </span>
            <span className="font-mono text-slate-300">
              {formatDurationLong(workout.durationSeconds)}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-medium">
              Intensity: {workout.intensityLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-1">
          <p className="text-sm font-semibold text-slate-500">Recovery / Rest</p>
          <p className="text-xs text-slate-600 mt-0.5">Active recovery, mobility or total rest</p>
        </div>
      )}
    </button>
  );
}
