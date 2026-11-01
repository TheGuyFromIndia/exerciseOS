// ============================================================
// HomeScreen — Weekly dashboard
// ============================================================

import { useState, useEffect } from 'react';
import { WorkoutCard } from './WorkoutCard';
import { ALL_WORKOUTS, getWorkoutByDay } from '../data/workoutDefinitions';
import { loadSessionsForWeek, loadAllSessions } from '../db/database';
import type { WorkoutSession } from '../types';
import { DAYS_ORDER, getWeekDates } from '../utils';
import { Settings, History, Dumbbell } from 'lucide-react';

interface HomeScreenProps {
  onSelectWorkout: (workoutId: string) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export function HomeScreen({ onSelectWorkout, onOpenSettings, onOpenHistory }: HomeScreenProps) {
  const [completedThisWeek, setCompletedThisWeek] = useState<Set<string>>(new Set());
  const [totalSessionsLogged, setTotalSessionsLogged] = useState(0);

  useEffect(() => {
    const { startStr, endStr } = getWeekDates();
    loadSessionsForWeek(startStr, endStr).then((sessions: WorkoutSession[]) => {
      const completedDays = new Set(
        sessions
          .filter(s => s.completionStatus === 'completed')
          .map(s => s.workoutDay.toLowerCase())
      );
      setCompletedThisWeek(completedDays);
    });

    loadAllSessions().then(all => {
      setTotalSessionsLogged(all.length);
    });
  }, []);

  const totalTrainingDays = ALL_WORKOUTS.length;
  const completedCount = [...completedThisWeek].filter(day =>
    ALL_WORKOUTS.some(w => w.day.toLowerCase() === day)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 pt-safe-top">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.5)]">
              <Dumbbell size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white">EXERCISE OS</h1>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Workout Execution System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenHistory}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
              aria-label="Workout history"
            >
              <History size={18} />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {/* Weekly Completion Card */}
        <section className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Weekly Progress</p>
              <p className="text-xl font-black text-white mt-0.5">
                {completedCount} of {totalTrainingDays} Completed
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/40">
              {Math.round((completedCount / totalTrainingDays) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalTrainingDays) * 100}%` }}
            />
          </div>

          {totalSessionsLogged > 0 && (
            <p className="text-[11px] text-slate-500">
              {totalSessionsLogged} total lifetime session{totalSessionsLogged > 1 ? 's' : ''} saved locally.
            </p>
          )}
        </section>

        {/* Weekly Day Cards */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            7-Day Program
          </h2>
          {DAYS_ORDER.map(day => {
            const workout = getWorkoutByDay(day) ?? null;
            const isCompleted = completedThisWeek.has(day.toLowerCase());
            return (
              <WorkoutCard
                key={day}
                day={day}
                workout={workout}
                isCompleted={isCompleted}
                onClick={() => workout && onSelectWorkout(workout.id)}
              />
            );
          })}
        </section>
      </main>

      <footer className="text-center pt-6 text-[11px] text-slate-600 font-medium">
        Exercise OS V1 · Offline-first PWA · Pure Local Storage
      </footer>
    </div>
  );
}
