// ============================================================
// VOICE COACH — Exercise OS
// Web Speech API coaching engine with priority scheduling
// Priority:
//   1: Phase transitions, 5s countdowns & workout completion
//   2: Rest countdowns ("Get ready" @ 30s) & 10s warnings
//   3: Minute completed announcements
// ============================================================

import type { VoiceSettings } from '../types';
import type { FlatInterval } from './TimerEngine';

type SpeechPriority = 1 | 2 | 3;

interface QueueItem {
  text: string;
  priority: SpeechPriority;
}

export class VoiceCoach {
  private settings: VoiceSettings;
  private isSpeaking: boolean = false;
  private currentlySpeakingPriority: SpeechPriority | null = null;
  private speechQueue: QueueItem[] = [];
  private announced30sRest: boolean = false;
  private announced10s: boolean = false;
  private announcedMinutes: Set<number> = new Set();
  private announcedCountdownSeconds: Set<number> = new Set();
  private isAvailable: boolean = false;

  constructor(settings: VoiceSettings) {
    this.settings = settings;
    this.isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  updateSettings(settings: VoiceSettings): void {
    this.settings = settings;
    if (!settings.enabled) {
      this.cancelAllSpeech();
    }
  }

  isSpeechSupported(): boolean {
    return this.isAvailable;
  }

  initOnUserGesture(): void {
    if (!this.isAvailable) return;
    try {
      window.speechSynthesis.cancel();
      const primingUtterance = new SpeechSynthesisUtterance(' ');
      primingUtterance.volume = 0.01;
      window.speechSynthesis.speak(primingUtterance);
    } catch {
      // Ignored if blocked
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isAvailable) return [];
    return window.speechSynthesis.getVoices();
  }

  private enqueueSpeech(text: string, priority: SpeechPriority): void {
    if (!this.isAvailable || !this.settings.enabled) return;

    this.speechQueue.push({ text, priority });
    this.speechQueue.sort((a, b) => a.priority - b.priority);
    this.pumpQueue();
  }

  private pumpQueue(): void {
    if (this.isSpeaking || this.speechQueue.length === 0 || !this.isAvailable) return;

    const item = this.speechQueue.shift();
    if (!item) return;

    this.isSpeaking = true;
    this.currentlySpeakingPriority = item.priority;
    const utterance = new SpeechSynthesisUtterance(item.text);
    const baseRate = Math.max(0.7, Math.min(1.6, this.settings.speechRate));
    // For countdown cues, speak slightly crisper so each second's announcement completes comfortably
    utterance.rate = item.priority === 1 && /^\d+ second/.test(item.text) ? Math.max(1.15, baseRate) : baseRate;
    utterance.volume = 1.0;

    if (this.settings.voiceURI) {
      const allVoices = window.speechSynthesis.getVoices();
      const match = allVoices.find(v => v.voiceURI === this.settings.voiceURI);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentlySpeakingPriority = null;
      this.pumpQueue();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentlySpeakingPriority = null;
      this.pumpQueue();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      this.currentlySpeakingPriority = null;
      this.pumpQueue();
    }
  }

  cancelAllSpeech(): void {
    this.speechQueue = [];
    this.isSpeaking = false;
    this.currentlySpeakingPriority = null;
    if (this.isAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    }
  }

  // ---- Lifecycle Event Handlers ----

  onIntervalStart(interval: FlatInterval): void {
    this.announced30sRest = false;
    this.announced10s = false;
    this.announcedMinutes.clear();
    this.announcedCountdownSeconds.clear();

    if (interval.isRest) {
      if (this.settings.restAnnouncements) {
        this.enqueueSpeech('Rest.', 1);
      }
    } else {
      const exerciseOrLabel = interval.exerciseName ?? interval.label;
      const roundSuffix =
        interval.roundNumber && interval.totalRounds && interval.totalRounds > 1
          ? ` Round ${interval.roundNumber}.`
          : '.';
      this.enqueueSpeech(`${exerciseOrLabel}${roundSuffix}`, 1);
    }
  }

  onIntervalComplete(completed: FlatInterval, next: FlatInterval | null): void {
    if (!completed.isRest && completed.roundNumber && completed.totalRounds && completed.totalRounds > 1) {
      this.enqueueSpeech('Round complete.', 1);
    }

    if (next && !next.isRest) {
      const nextName = next.exerciseName ?? next.label;
      setTimeout(() => {
        this.enqueueSpeech(`Next: ${nextName}.`, 2);
      }, 400);
    }
  }

  onTick(remainingSeconds: number, durationSeconds: number, interval: FlatInterval): void {
    if (!this.settings.enabled) return;

    // REST intervals: "Get ready" at exactly 30s remaining
    if (interval.isRest) {
      if (remainingSeconds === 30 && !this.announced30sRest && this.settings.restAnnouncements) {
        this.announced30sRest = true;
        this.enqueueSpeech('Get ready.', 2);
      }
    } else {
      // ACTIVE intervals: Minute completed announcements
      // Call out whenever a minute has passed in any workout interval (e.g. 1m, 2m, 3m...)
      if (this.settings.minuteAnnouncements) {
        const elapsedSeconds = durationSeconds - remainingSeconds;
        const completedMinute = Math.floor(elapsedSeconds / 60);

        if (completedMinute > 0 && remainingSeconds > 5 && !this.announcedMinutes.has(completedMinute)) {
          this.announcedMinutes.add(completedMinute);
          const numberWords = [
            'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'
          ];
          const word = completedMinute <= 20 ? numberWords[completedMinute - 1] : `${completedMinute}`;
          this.enqueueSpeech(`${word} minute${completedMinute > 1 ? 's' : ''} completed.`, 3);
        }
      }
    }

    // Interval 10-second warning (for both work and rest)
    if (remainingSeconds === 10 && this.settings.countdownAt10 && !this.announced10s) {
      this.announced10s = true;
      this.enqueueSpeech('Ten seconds.', 2);
    }

    // Last 5 seconds countdown: 5 seconds, 4 seconds, 3 seconds, 2 seconds, 1 second (for both work and rest)
    if (remainingSeconds <= 5 && remainingSeconds >= 1 && this.settings.countdownAt5) {
      if (!this.announcedCountdownSeconds.has(remainingSeconds)) {
        this.announcedCountdownSeconds.add(remainingSeconds);

        // Discard low priority queue items to prevent any lag
        this.speechQueue = this.speechQueue.filter(item => item.priority <= 1);

        // If currently speaking a lower priority cue, cancel it immediately so countdown fires on time
        if (this.isSpeaking && this.currentlySpeakingPriority !== null && this.currentlySpeakingPriority > 1) {
          if (this.isAvailable) {
            try {
              window.speechSynthesis.cancel();
            } catch {
              // Ignored
            }
          }
          this.isSpeaking = false;
          this.currentlySpeakingPriority = null;
        }

        const countText = remainingSeconds === 1 ? '1 second' : `${remainingSeconds} seconds`;
        this.enqueueSpeech(countText, 1);
      }
    }
  }

  onWorkoutStart(): void {
    this.enqueueSpeech('Starting workout.', 1);
  }

  onWorkoutComplete(): void {
    this.cancelAllSpeech();
    this.enqueueSpeech('Workout complete. Outstanding effort!', 1);
  }

  onWorkoutPaused(): void {
    this.cancelAllSpeech();
    this.enqueueSpeech('Workout paused.', 1);
  }

  onWorkoutResumed(): void {
    this.enqueueSpeech('Resuming workout.', 1);
  }
}
