// ============================================================
// COACHING LIBRARY — Exercise OS
// Specialized coaching cue libraries from product specification
// ============================================================

import type { CoachingCategory } from '../types';

export const BOXING_COACHING: string[] = [
  'Keep your hands up.',
  'Stay on the balls of your feet.',
  'Keep moving.',
  "Don't stay stationary.",
  'Keep your chin tucked.',
  'Return your hands to guard.',
  'Maintain your breathing.',
  'Stay light on your feet.',
  'Keep your elbows in.',
  'Move your head.',
  "Don't admire your punches.",
  'Keep your combinations flowing.',
  'Stay relaxed.',
  'Rotate your hips.',
  'Keep your guard active.',
  'Work behind your jab.',
  'Maintain your distance.',
  'Stay explosive.',
];

export const BOXING_ENDURANCE_COACHING: string[] = [
  'Keep your hands up.',
  'Maintain a steady rhythm.',
  'Stay relaxed.',
  'Keep moving.',
  'Keep your breathing controlled.',
  'Work behind your jab.',
  "Don't rush combinations.",
  'Stay light on your feet.',
  'Maintain your guard.',
  'Keep your chin tucked.',
  'Focus on technique.',
  'Keep moving without exhausting yourself.',
];

export const BODYWEIGHT_COACHING: string[] = [
  'Focus on your form.',
  'Control the movement.',
  "Don't rush your repetitions.",
  'Keep your core engaged.',
  'Maintain a neutral spine.',
  'Keep your knees aligned.',
  'Control your breathing.',
  'Complete the movement properly.',
  'Stay consistent.',
  'Maintain good posture.',
  "Don't sacrifice form for speed.",
  'Keep your movements controlled.',
  'Focus on quality, not quantity.',
];

export const BODYWEIGHT_ENDURANCE_COACHING: string[] = [
  'Focus on controlled movement.',
  'Keep your core engaged.',
  'Maintain good posture.',
  'Breathe continuously.',
  'Keep your knees aligned.',
  "Don't rush the repetitions.",
  'Prioritize technique.',
];

export const AEROBIC_COACHING: string[] = [
  'Consistent pacing.',
  'Controlled breathing.',
  'Relaxed shoulders.',
  'Proper knee alignment.',
  'Controlled movement.',
  'Sustained aerobic effort.',
  'Maintaining a comfortable rhythm.',
  'Stay smooth and steady.',
  'Breathe continuously.',
  'Keep your cadence steady.',
];

export const WARMUP_COACHING: string[] = [
  'Start gradually.',
  'Mobilize your shoulders.',
  'Get your body moving.',
  'Focus on breathing.',
  'Wake up your joints.',
  'Nice and easy — warm up slowly.',
  'Increase your range of motion gradually.',
  'Prepare your body for the workout ahead.',
];

export const COOLDOWN_COACHING: string[] = [
  'Slow down.',
  'Control your breathing.',
  'Relax your shoulders.',
  'Let your heart rate recover gradually.',
  'Breathe deeply.',
  'Great work today.',
  'Ease gently into your stretches.',
  'Let your muscles relax.',
];

export function getCoachingLibrary(category: CoachingCategory): string[] {
  switch (category) {
    case 'boxing':
      return BOXING_COACHING;
    case 'bodyweight':
      return BODYWEIGHT_COACHING;
    case 'aerobic':
      return AEROBIC_COACHING;
    case 'warmup':
      return WARMUP_COACHING;
    case 'cooldown':
      return COOLDOWN_COACHING;
    default:
      return AEROBIC_COACHING;
  }
}

export function getRandomCue(library: string[], lastCue: string | null): string {
  if (library.length === 0) return '';
  if (library.length === 1) return library[0];

  let candidates = library.filter(c => c !== lastCue);
  if (candidates.length === 0) candidates = library;

  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}
