// ============================================================
// SettingsScreen — Voice Coach & System Settings
// ============================================================

import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import { ArrowLeft, Volume2, Mic, Smartphone, Info } from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onUpdateVoice: (updates: Partial<AppSettings['voice']>) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onUpdate, onUpdateVoice, onBack }: SettingsScreenProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const fetchVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) setAvailableVoices(voices);
      };
      fetchVoices();
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  const testVoiceSample = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('Keep your hands up. One minute completed.');
    utt.rate = settings.voice.speechRate;
    if (settings.voice.voiceURI) {
      const match = availableVoices.find(v => v.voiceURI === settings.voice.voiceURI);
      if (match) utt.voice = match;
    }
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 pt-safe-top">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-black text-white">System Settings</h1>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {/* Voice Coaching Section */}
        <section className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={18} className="text-blue-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                Voice Coach Engine
              </h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voice.enabled}
                onChange={e => onUpdateVoice({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {settings.voice.enabled && (
            <div className="space-y-4 pt-2 border-t border-slate-800/60">
              {/* Voice Selector */}
              {availableVoices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Synthesizer Voice
                  </label>
                  <select
                    value={settings.voice.voiceURI ?? ''}
                    onChange={e => onUpdateVoice({ voiceURI: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Default (Auto-picks Best Natural Voice)</option>
                    {availableVoices.map(v => {
                      const isHighQuality = /(natural|enhanced|premium|siri|neural|google)/i.test(v.name);
                      return (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang}) {isHighQuality ? '★ Natural / Enhanced' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Speech Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-bold text-slate-300">Speech Rate</label>
                  <span className="font-mono text-blue-400 font-bold">
                    {settings.voice.speechRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={settings.voice.speechRate}
                  onChange={e => onUpdateVoice({ speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Announcement Toggles */}
              <div className="space-y-2.5 pt-2">
                <ToggleItem
                  title="Minute Announcements"
                  subtitle="Announce 'One minute completed', 'Two minutes completed'"
                  checked={settings.voice.minuteAnnouncements}
                  onChange={v => onUpdateVoice({ minuteAnnouncements: v })}
                />

                <ToggleItem
                  title="Halfway Announcements"
                  subtitle="Announce 'Halfway' at the midpoint of rounds"
                  checked={settings.voice.halfwayAnnouncements ?? true}
                  onChange={v => onUpdateVoice({ halfwayAnnouncements: v })}
                />

                <ToggleItem
                  title="Rest Alerts ('Get Ready')"
                  subtitle="Spoken warning at 30 seconds remaining in rest"
                  checked={settings.voice.restAnnouncements}
                  onChange={v => onUpdateVoice({ restAnnouncements: v })}
                />

                <ToggleItem
                  title="Countdown Warnings (5s)"
                  subtitle="Voice countdown during the last 5 seconds"
                  checked={settings.voice.countdownAt5}
                  onChange={v => onUpdateVoice({ countdownAt5: v })}
                />
              </div>

              {/* Spotify / Background Audio Ducking Notice */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 text-xs font-bold">
                  <span>🎵</span>
                  <span>Spotify & Music Playback</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Exercise OS uses iOS audio ducking. Your Spotify or music app will continue playing uninterrupted during training, automatically lowering in volume only when countdowns or announcements speak.
                </p>
              </div>

              {/* Test Voice Button */}
              <button
                type="button"
                onClick={testVoiceSample}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Volume2 size={15} />
                Test Voice Announcements
              </button>
            </div>
          )}
        </section>

        {/* Display & System Section */}
        <section className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/60 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={18} className="text-teal-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              iPhone & Device Controls
            </h2>
          </div>

          <ToggleItem
            title="Screen Wake Lock"
            subtitle="Prevents device display from sleeping during an active workout"
            checked={settings.keepScreenAwake}
            onChange={v => onUpdate({ keepScreenAwake: v })}
          />

          <ToggleItem
            title="Confirmation on Skip"
            subtitle="Ask for confirmation before skipping intervals"
            checked={settings.showSkipConfirmation}
            onChange={v => onUpdate({ showSkipConfirmation: v })}
          />
        </section>

        {/* iOS Notice Box */}
        <section className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Info size={16} />
            <h3 className="text-xs font-black uppercase tracking-wider">
              iOS PWA Behaviour Notice
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            iOS Safari limits background JavaScript timers and audio synthesis when your iPhone is locked or switched to another app. Exercise OS requests Screen Wake Lock and automatically resynchronizes timing from hardware clocks when reopened. For optimal training execution, keep the workout screen visible.
          </p>
        </section>
      </main>
    </div>
  );
}

function ToggleItem({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-slate-200">{title}</p>
        <p className="text-[11px] text-slate-500 leading-tight">{subtitle}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
      </label>
    </div>
  );
}
