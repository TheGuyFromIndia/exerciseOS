// ============================================================
// useSettings Hook — Exercise OS
// ============================================================

import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import { loadSettings, saveSettings } from '../db/database';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings().then(loaded => {
      setSettings(loaded);
      setIsLoading(false);
    });
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const merged: AppSettings = { ...settings, ...updates };
    setSettings(merged);
    await saveSettings(merged);
  };

  const updateVoiceSettings = async (voiceUpdates: Partial<AppSettings['voice']>) => {
    if (!settings) return;
    const merged: AppSettings = {
      ...settings,
      voice: { ...settings.voice, ...voiceUpdates },
    };
    setSettings(merged);
    await saveSettings(merged);
  };

  return { settings, isLoading, updateSettings, updateVoiceSettings };
}
