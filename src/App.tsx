// ============================================================
// App.tsx — Exercise OS Main Application
// Single-page navigation controller with clean state transitions
// ============================================================

import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { WorkoutOverview } from './components/WorkoutOverview';
import { WorkoutScreen } from './components/WorkoutScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { getWorkoutById } from './data/workoutDefinitions';
import { useSettings } from './hooks/useSettings';
import type { AppScreen } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  const { settings, isLoading, updateSettings, updateVoiceSettings } = useSettings();

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Loading Exercise OS...
        </p>
      </div>
    );
  }

  const selectedWorkout = activeWorkoutId ? getWorkoutById(activeWorkoutId) ?? null : null;

  switch (currentScreen) {
    case 'home':
      return (
        <HomeScreen
          onSelectWorkout={(id) => {
            setActiveWorkoutId(id);
            setCurrentScreen('overview');
          }}
          onOpenSettings={() => setCurrentScreen('settings')}
          onOpenHistory={() => setCurrentScreen('history')}
        />
      );

    case 'overview':
      if (!selectedWorkout) {
        setCurrentScreen('home');
        return null;
      }
      return (
        <WorkoutOverview
          workout={selectedWorkout}
          onStart={() => setCurrentScreen('workout')}
          onBack={() => setCurrentScreen('home')}
        />
      );

    case 'workout':
      if (!selectedWorkout) {
        setCurrentScreen('home');
        return null;
      }
      return (
        <WorkoutScreen
          workout={selectedWorkout}
          settings={settings}
          onComplete={() => setCurrentScreen('home')}
          onBack={() => setCurrentScreen('overview')}
        />
      );

    case 'history':
      return (
        <HistoryScreen
          onBack={() => setCurrentScreen('home')}
        />
      );

    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          onUpdate={updateSettings}
          onUpdateVoice={updateVoiceSettings}
          onBack={() => setCurrentScreen('home')}
        />
      );

    default:
      return null;
  }
}
