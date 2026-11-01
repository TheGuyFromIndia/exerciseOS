// ============================================================
// VOICE COACH — Exercise OS
// Web Speech API coaching engine with priority scheduling
// Priority:
//   1: Phase transitions & workout completion
//   2: Rest countdowns ("Get ready" @ 30s) & 10s/5s warnings
//   3: Minute completed announcements
//   4: Random coaching technique reminders
// ============================================================

import type { VoiceSettings } from '../types';
import { getCoachingLibrary, getRandomCue } from '../data/coachingLibrary';
import type { FlatInterval } from './TimerEngine';

type SpeechPriority = 1 | 2 | 3 | 4;

interface QueueItem {
  text: string;
  priority: SpeechPriority;
}

export class VoiceCoach {
  private settings: VoiceSettings;
  private isSpeaking: boolean = false;
  private speechQueue: QueueItem[] = [];
  private lastSpokenCue: string | null = null;
  private randomCoachingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private announced30sRest: boolean = false;
  private announcedMinutes: Set<number> = new Set();
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

    // Never queue random coaching (priority 4) if higher priority items are pending
    if (priority === 4 && this.speechQueue.some(item => item.priority < 4)) {
      return;
    }

    this.speechQueue.push({ text, priority });
    this.speechQueue.sort((a, b) => a.priority - b.priority);
    this.pumpQueue();
  }

  private pumpQueue(): void {
    if (this.isSpeaking || this.speechQueue.length === 0 || !this.isAvailable) return;

    const item = this.speechQueue.shift();
    if (!item) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = Math.max(0.7, Math.min(1.6, this.settings.speechRate));
    utterance.volume = 1.0;

    if (this.settings.voiceURI) {
      const allVoices = window.speechSynthesis.getVoices();
      const match = allVoices.find(v => v.voiceURI === this.settings.voiceURI);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      this.pumpQueue();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.pumpQueue();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      this.pumpQueue();
    }
  }

  cancelAllSpeech(): void {
    this.speechQueue = [];
    this.clearCoachingTimer();
    this.isSpeaking = false;
    if (this.isAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    }
  }

  private clearCoachingTimer(): void {
    if (this.randomCoachingTimeoutId !== null) {
      clearTimeout(this.randomCoachingTimeoutId);
      this.randomCoachingTimeoutId = null;
    }
  }

  // ---- Lifecycle Event Handlers ----

  onIntervalStart(interval: FlatInterval): void {
    this.announced30sRest = false;
    this.announcedMinutes.clear();
    this.clearCoachingTimer();

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

      if (this.settings.randomCoaching) {
        this.scheduleNextRandomCue(interval);
      }
    }
  }

  onIntervalComplete(completed: FlatInterval, next: FlatInterval | null): void {
    this.clearCoachingTimer();

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
      if (remainingSeconds === 10 && this.settings.countdownAt10) {
        this.enqueueSpeech('Ten seconds.', 2);
      }
      if (remainingSeconds === 5 && this.settings.countdownAt5) {
        this.enqueueSpeech('Five seconds.', 2);
      }
      return;
    }

    // ACTIVE intervals: Minute completed announcements
    if (interval.roundNumber && this.settings.minuteAnnouncements) {
      const elapsedSeconds = durationSeconds - remainingSeconds;
      const completedMinute = Math.floor(elapsedSeconds / 60);

      if (completedMinute > 0 && elapsedSeconds % 60 === 0 && !this.announcedMinutes.has(completedMinute)) {
        this.announcedMinutes.add(completedMinute);
        const numberWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
        const word = numberWords[completedMinute - 1] ?? `${completedMinute}`;
        this.enqueueSpeech(`${word} minute${completedMinute > 1 ? 's' : ''} completed.`, 3);
      }
    }

    // Interval end countdown warnings
    if (remainingSeconds === 10 && this.settings.countdownAt10) {
      this.enqueueSpeech('Ten seconds.', 2);
    }
    if (remainingSeconds === 5 && this.settings.countdownAt5) {
      this.enqueueSpeech('Five seconds.', 2);
    }
  }

  private scheduleNextRandomCue(interval: FlatInterval): void {
    this.clearCoachingTimer();
    if (!this.settings.randomCoaching || interval.isRest) return;

    // Randomize within 25–40s (or around configured frequency)
    const baseFreq = this.settings.coachingFrequencySeconds || 30;
    const jitter = Math.floor((Math.random() - 0.5) * 12);
    const delayMs = Math.max(18, baseFreq + jitter) * 1000;

    this.randomCoachingTimeoutId = setTimeout(() => {
      this.deliverRandomCoachingCue(interval);
      this.scheduleNextRandomCue(interval);
    }, delayMs);
  }

  private deliverRandomCoachingCue(interval: FlatInterval): void {
    if (interval.isRest || !this.settings.randomCoaching) return;

    // Don't interrupt higher-priority announcements
    if (this.speechQueue.some(item => item.priority <= 3)) return;

    const cues =
      interval.coachingCues && interval.coachingCues.length > 0
        ? interval.coachingCues
        : getCoachingLibrary(interval.coachingCategory as never);

    const cue = getRandomCue(cues, this.lastSpokenCue);
    if (cue) {
      this.lastSpokenCue = cue;
      this.enqueueSpeech(cue, 4);
    }
  }

  onWorkoutStart(): void {
    this.enqueueSpeech('Starting workout.', 1);
  }

  onWorkoutComplete(): void {
    this.clearCoachingTimer();
    this.cancelAllSpeech();
    this.enqueueSpeech('Workout complete. Outstanding effort!', 1);
  }

  onWorkoutPaused(): void {
    this.clearCoachingTimer();
    this.cancelAllSpeech();
    this.enqueueSpeech('Workout paused.', 1);
  }

  onWorkoutResumed(): void {
    this.enqueueSpeech('Resuming workout.', 1);
  }
}
