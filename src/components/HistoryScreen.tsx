// ============================================================
// HistoryScreen — Locally stored workout history
// ============================================================

import { useState, useEffect, type ChangeEvent } from 'react';
import type { WorkoutSession } from '../types';
import {
  loadAllSessions,
  exportUserData,
  importUserData,
  validateImportPayload,
  type ExportDataPayload,
} from '../db/database';
import { formatTime, downloadJsonFile, DAY_DISPLAY_NAMES } from '../utils';
import { ArrowLeft, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface HistoryScreenProps {
  onBack: () => void;
}

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Import flow state
  const [pendingPayload, setPendingPayload] = useState<ExportDataPayload | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const refreshList = async () => {
    const list = await loadAllSessions();
    setSessions(list);
    setLoading(false);
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleExport = async () => {
    try {
      const data = await exportUserData();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadJsonFile(data, `exercise-os-backup-${dateStr}.json`);
      setNotification('Workout history exported successfully.');
    } catch (err) {
      setNotification('Failed to export data.');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!validateImportPayload(parsed)) {
          setNotification('Invalid Exercise OS backup file.');
          return;
        }
        setPendingPayload(parsed);
        setShowImportConfirm(true);
      } catch {
        setNotification('Error reading file. Ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeImport = async (overwrite: boolean) => {
    if (!pendingPayload) return;
    try {
      const result = await importUserData(pendingPayload, overwrite);
      setShowImportConfirm(false);
      setPendingPayload(null);
      await refreshList();
      setNotification(
        `Imported ${result.importedCount} session(s)${result.skippedCount > 0 ? ` (${result.skippedCount} skipped)` : ''}.`
      );
    } catch {
      setNotification('Failed to import records.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 pt-safe-top">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-black text-white">Workout History</h1>
              <p className="text-[11px] text-slate-500 font-semibold">Local Session Records</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer active:scale-95 transition-all">
              <Upload size={18} />
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleExport}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
              aria-label="Export backup"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 space-y-3 flex-1">
        {notification && (
          <div className="bg-blue-950/60 border border-blue-700/50 rounded-2xl p-3 flex items-center justify-between text-xs text-blue-200">
            <span>{notification}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-blue-400 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            Loading session records...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-base font-bold text-slate-400">No Recorded Sessions Yet</p>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Completed or partially completed workouts will appear here automatically with zero cloud storage.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map(s => {
              const isComp = s.completionStatus === 'completed';
              const startDate = new Date(s.startTime);
              const timeFormatted = startDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/60 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        {isComp ? (
                          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
                        )}
                        <h2 className="text-sm font-bold text-white truncate">
                          {s.workoutName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 pl-6">
                        {DAY_DISPLAY_NAMES[s.workoutDay]} · {s.date} at {timeFormatted}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isComp
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                      }`}
                    >
                      {s.completionStatus}
                    </span>
                  </div>

                  <div className="pl-6 pt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      Duration:{' '}
                      <strong className="text-white">
                        {formatTime(s.actualDurationSeconds ?? s.plannedDurationSeconds)}
                      </strong>{' '}
                      / {formatTime(s.plannedDurationSeconds)}
                    </span>
                    {s.completedRounds > 0 && (
                      <span>{s.completedRounds} rounds completed</span>
                    )}
                  </div>

                  {s.skippedIntervals && s.skippedIntervals.length > 0 && (
                    <div className="pl-6 text-[11px] text-amber-400/80">
                      Skipped intervals: {s.skippedIntervals.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Modal for Import */}
      {showImportConfirm && pendingPayload && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Import Workout Data</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Found <strong>{pendingPayload.sessions.length}</strong> workout session record(s) in backup.
              Choose whether to merge with your existing records or overwrite everything.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => executeImport(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all"
              >
                Merge (Keep Existing)
              </button>
              <button
                type="button"
                onClick={() => executeImport(true)}
                className="w-full py-3 bg-red-950/80 hover:bg-red-900 active:bg-red-800 text-red-200 border border-red-700/60 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all"
              >
                Overwrite All Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportConfirm(false);
                  setPendingPayload(null);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
