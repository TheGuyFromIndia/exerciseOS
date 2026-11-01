// ============================================================
// WORKOUT DEFINITIONS — Exercise OS
// Preloaded weekly workout configurations
// Durations:
//   Monday:   56:30 (3390s)
//   Tuesday:  45:00 (2700s)
//   Thursday: 60:00 (3600s)
//   Friday:   30:40 (1840s) - warmup + exact video ladder + cooldown
// ============================================================

import type { WorkoutDefinition, WorkoutPhase } from '../types';
import {
  BOXING_COACHING,
  BOXING_ENDURANCE_COACHING,
  BODYWEIGHT_COACHING,
  BODYWEIGHT_ENDURANCE_COACHING,
  AEROBIC_COACHING,
  WARMUP_COACHING,
  COOLDOWN_COACHING,
} from './coachingLibrary';

// ============================================================
// MONDAY: Boxing + Full Body Conditioning
// Total planned duration: 56 minutes 30 seconds (3390 seconds)
// Phase 1 Warmup: 10:00 (600s)
// Phase 2 Boxing: 3 rounds x 3m (540s) + 2 rests x 60s (120s) = 11:00 (660s)
// Phase 3 Transition Rest: 2:00 (120s)
// Phase 4 Full Body: 6 rounds x 3m (1080s) + 5 rests x 90s (450s) = 25:30 (1530s)
// Phase 5 Cooldown: 8:00 (480s) -> 600+660+120+1530+480 = 3390s = 56:30
// ============================================================

export const MONDAY_WORKOUT: WorkoutDefinition = {
  id: 'monday-boxing-conditioning',
  name: 'Boxing + Full Body Conditioning',
  shortName: 'Boxing & Conditioning',
  day: 'monday',
  category: 'boxing',
  durationSeconds: 3390, // 56:30
  purpose: 'Build technical boxing capacity and full-body conditioning through intensive shadowboxing rounds followed by compound bodyweight conditioning.',
  equipment: ['Open training space', 'Optional: Hand wraps or light gloves'],
  intensityLabel: '7–8/10',
  version: 1,
  phases: [
    {
      id: 'mon-phase-1-warmup',
      name: 'Warmup',
      displayLabel: 'WARMUP',
      type: 'warmup',
      durationSeconds: 600, // 10 minutes continuous
      coachingCategory: 'warmup',
      coachingCues: [
        'Start gradually.',
        'Mobilize your shoulders.',
        'Get your body moving.',
        'Focus on breathing.',
        'Wake up your joints.',
        'Keep footwork relaxed and rhythmic.',
      ],
      notes: '10 minutes continuous dynamic warmup',
    },
    {
      id: 'mon-phase-2-boxing',
      name: 'Boxing',
      displayLabel: 'BOXING',
      type: 'work',
      durationSeconds: 660, // 11 minutes total
      rounds: 3,
      roundDurationSeconds: 180, // 3 minutes
      restDurationSeconds: 60,   // 60 seconds rest between rounds
      restAfterLastRound: false, // 2 rest periods total
      coachingCategory: 'boxing',
      coachingCues: BOXING_COACHING,
      notes: '3 rounds x 3 mins with 60s rest between rounds',
    },
    {
      id: 'mon-phase-3-transition',
      name: 'Transition Rest',
      displayLabel: 'REST & PREPARE',
      type: 'transition',
      durationSeconds: 120, // 2 minutes
      coachingCategory: 'warmup',
      coachingCues: [
        'Catch your breath.',
        'Sip some water.',
        'Shake out your arms and shoulders.',
        'Prepare your mind for bodyweight conditioning.',
      ],
      notes: 'Recover after boxing and prepare for bodyweight training',
    },
    {
      id: 'mon-phase-4-fullbody',
      name: 'Full Body Conditioning',
      displayLabel: 'FULL BODY',
      type: 'work',
      durationSeconds: 1530, // 25 minutes 30 seconds
      rounds: 6,
      roundDurationSeconds: 180, // 3 minutes
      restDurationSeconds: 90,   // 90 seconds rest between rounds
      restAfterLastRound: false, // 5 rest periods total
      coachingCategory: 'bodyweight',
      coachingCues: BODYWEIGHT_COACHING,
      notes: '6 rounds x 3 mins with 90s rest between rounds',
    },
    {
      id: 'mon-phase-5-cooldown',
      name: 'Cooldown',
      displayLabel: 'COOLDOWN',
      type: 'cooldown',
      durationSeconds: 480, // 8 minutes (brings total to exactly 56:30)
      coachingCategory: 'cooldown',
      coachingCues: COOLDOWN_COACHING,
      notes: 'Continuous cooldown: slow down, control breathing, relax shoulders, heart rate recovery',
    },
  ],
};

// ============================================================
// TUESDAY: Low Impact Aerobic Endurance
// Total planned duration: 45 minutes (2700 seconds)
// Phase 1 Warmup: 8:00 (480s)
// Phase 2 Aerobic Circuit: 5 rounds x 5 exercises (60s each) + 4 rests (60s) = 29:00 (1740s)
// Phase 3 Cooldown: 8:00 (480s)
// Total = 480 + 1740 + 480 = 2700s = 45:00
// ============================================================

export const TUESDAY_WORKOUT: WorkoutDefinition = {
  id: 'tuesday-aerobic-endurance',
  name: 'Low Impact Aerobic Endurance',
  shortName: 'Aerobic Endurance',
  day: 'tuesday',
  category: 'aerobic',
  durationSeconds: 2700, // 45:00
  purpose: 'Improve general aerobic endurance, sustained movement capacity and cardiovascular conditioning. Zero jumping, running or explosive impacts.',
  equipment: ['Open floor space', 'Comfortable footwear'],
  intensityLabel: '4–5/10',
  version: 1,
  phases: [
    {
      id: 'tue-phase-1-warmup',
      name: 'Warmup',
      displayLabel: 'WARMUP',
      type: 'warmup',
      durationSeconds: 480, // 8 minutes
      coachingCategory: 'warmup',
      exercises: [
        { name: 'Easy marching in place', durationSeconds: 120 },
        { name: 'Shoulder circles and arm swings', durationSeconds: 60 },
        { name: 'Gentle side steps', durationSeconds: 120 },
        { name: 'Alternating heel digs', durationSeconds: 60 },
        { name: 'Controlled calf raises', durationSeconds: 60 },
        { name: 'Gentle hip mobility', durationSeconds: 60 },
      ],
      coachingCues: WARMUP_COACHING,
      notes: 'Structured 8-minute progressive mobility warmup',
    },
    {
      id: 'tue-phase-2-aerobic-circuit',
      name: 'Aerobic Circuit',
      displayLabel: 'AEROBIC CIRCUIT',
      type: 'work',
      durationSeconds: 1740, // 29 minutes
      rounds: 5,
      roundDurationSeconds: 300, // 5 exercises x 60s
      restDurationSeconds: 60,   // 60s between rounds
      restAfterLastRound: false, // 4 rest periods total; no rest after round 5
      coachingCategory: 'aerobic',
      exercises: [
        { name: 'Marching in place', durationSeconds: 60 },
        { name: 'Side step and touch', durationSeconds: 60 },
        { name: 'Alternating heel digs', durationSeconds: 60 },
        { name: 'Low alternating knee raises', durationSeconds: 60 },
        { name: 'Alternating backward toe taps', durationSeconds: 60 },
      ],
      coachingCues: AEROBIC_COACHING,
      notes: '5 rounds x 5 exercises (60s each) with 60s rest between rounds. No rest after round 5.',
    },
    {
      id: 'tue-phase-3-cooldown',
      name: 'Cooldown',
      displayLabel: 'COOLDOWN',
      type: 'cooldown',
      durationSeconds: 480, // 8 minutes
      coachingCategory: 'cooldown',
      exercises: [
        { name: 'Slow marching', durationSeconds: 120 },
        { name: 'Gentle calf stretch', durationSeconds: 60 },
        { name: 'Hamstring stretch', durationSeconds: 60 },
        { name: 'Hip flexor stretch', durationSeconds: 60 },
        { name: 'Chest and shoulder stretch', durationSeconds: 60 },
        { name: 'Slow breathing and relaxation', durationSeconds: 120 },
      ],
      coachingCues: COOLDOWN_COACHING,
      notes: 'Structured 8-minute recovery and flexibility sequence',
    },
  ],
};

// ============================================================
// THURSDAY: Boxing Endurance
// Total planned duration: 60 minutes (3600 seconds)
// Phase 1 Warmup: 10:00 (600s)
// Phase 2 Boxing Endurance: 6 rounds x 3m (1080s) + 5 rests x 60s (300s) = 23:00 (1380s)
// Phase 3 Transition Rest: 2:00 (120s)
// Phase 4 Full Body Circuit: 4 rounds x 3m (720s) + 3 rests x 60s (180s) = 15:00 (900s)
// Phase 5 Cooldown: 10:00 (600s)
// Total = 600 + 1380 + 120 + 900 + 600 = 3600s = 60:00
// ============================================================

export const THURSDAY_WORKOUT: WorkoutDefinition = {
  id: 'thursday-boxing-endurance',
  name: 'Boxing Endurance',
  shortName: 'Boxing Endurance',
  day: 'thursday',
  category: 'boxing',
  durationSeconds: 3600, // 60:00
  purpose: 'Build boxing-specific cardiovascular endurance and continuous rhythm without maximal explosive fatigue. Noticeably less intense than Monday.',
  equipment: ['Open floor space', 'Optional: Exercise mat for floor work'],
  intensityLabel: '5–6/10',
  version: 1,
  phases: [
    {
      id: 'thu-phase-1-warmup',
      name: 'Warmup',
      displayLabel: 'WARMUP',
      type: 'warmup',
      durationSeconds: 600, // 10 minutes
      coachingCategory: 'warmup',
      coachingCues: [
        'Gentle mobility to start.',
        'March lightly on the balls of your feet.',
        'Rotate shoulders forward and back.',
        'Flow through easy footwork.',
        'Focus on deep diaphragmatic breathing.',
      ],
      notes: 'Mobility, marching, shoulder movements, gentle footwork and dynamic warmup',
    },
    {
      id: 'thu-phase-2-boxing',
      name: 'Boxing Endurance',
      displayLabel: 'BOXING ENDURANCE',
      type: 'work',
      durationSeconds: 1380, // 23 minutes
      rounds: 6,
      roundDurationSeconds: 180, // 3 minutes
      restDurationSeconds: 60,   // 60 seconds rest between rounds
      restAfterLastRound: false, // 5 rest periods total
      coachingCategory: 'boxing',
      coachingCues: BOXING_ENDURANCE_COACHING,
      notes: '6 rounds x 3 mins with 60s rest between rounds. Steady rhythm, continuous flow.',
    },
    {
      id: 'thu-phase-3-transition',
      name: 'Transition Rest',
      displayLabel: 'HYDRATE & RECOVER',
      type: 'transition',
      durationSeconds: 120, // 2 minutes
      coachingCategory: 'warmup',
      coachingCues: [
        'Hydrate and recover.',
        'Catch your breath completely.',
        'Prepare your mat for the endurance circuit.',
      ],
      notes: '2-minute hydration and posture transition',
    },
    {
      id: 'thu-phase-4-fullbody',
      name: 'Full Body Endurance Circuit',
      displayLabel: 'ENDURANCE CIRCUIT',
      type: 'work',
      durationSeconds: 900, // 15 minutes
      rounds: 4,
      roundDurationSeconds: 180, // 3 minutes per round
      restDurationSeconds: 60,   // 60s rest between rounds
      restAfterLastRound: false, // 3 rest periods total
      coachingCategory: 'bodyweight',
      exercises: [
        { name: 'Controlled squats / sit-to-stands', durationSeconds: 45 },
        { name: 'Incline pushups', durationSeconds: 45 },
        { name: 'Glute bridges', durationSeconds: 45 },
        { name: 'Dead bugs', durationSeconds: 45 },
      ],
      coachingCues: BODYWEIGHT_ENDURANCE_COACHING,
      notes: '4 rounds of 4 exercises (45s each) with 60s rest between rounds',
    },
    {
      id: 'thu-phase-5-cooldown',
      name: 'Cooldown',
      displayLabel: 'COOLDOWN',
      type: 'cooldown',
      durationSeconds: 600, // 10 minutes
      coachingCategory: 'cooldown',
      coachingCues: COOLDOWN_COACHING,
      notes: '10 minutes gradual recovery, gentle mobility, breathing and stretching',
    },
  ],
};

// ============================================================
// FRIDAY: Video-Based HIIT
// Reference: https://youtu.be/cZnsLVArIt8?si=ITV_QOYxXQtndTmp
// Fitness Blender "Brutal HIIT Ladder Workout - 20 Minute HIIT Workout at Home"
//
// Structured Format:
// A. Warmup: 5 minutes (300s)
// B. Video Workout: Descending ladder across 4 exercises
//    Exercises:
//      1. Flutter Kick Squats (Alt: Bodyweight Squats)
//      2. High Knees (Alt: Low High Knees / Marching)
//      3. Burpees (Alt: Squat + Step-Back)
//      4. Jumping Jacks (Alt: Step-Jacks)
//    Rounds:
//      Round 1: 60s each (240s) + 20s rest
//      Round 2: 50s each (200s) + 20s rest
//      Round 3: 40s each (160s) + 20s rest
//      Round 4: 30s each (120s) + 20s rest
//      Round 5: 20s each (80s)  + 20s rest
//      Round 6: 10s each (40s)  [no rest after final round]
//    Core HIIT: 840s work + 100s rest = 940s (15:40)
// C. Cooldown: 10 minutes (600s)
// Total Friday = 300 + 940 + 600 = 1840s (30 minutes 40 seconds)
// ============================================================

function createFridayHIITPhases(): WorkoutPhase[] {
  const ladderRounds = [
    { round: 1, workSeconds: 60, hasRest: true },
    { round: 2, workSeconds: 50, hasRest: true },
    { round: 3, workSeconds: 40, hasRest: true },
    { round: 4, workSeconds: 30, hasRest: true },
    { round: 5, workSeconds: 20, hasRest: true },
    { round: 6, workSeconds: 10, hasRest: false },
  ];

  return ladderRounds.map(({ round, workSeconds, hasRest }) => {
    const roundWork = workSeconds * 4;
    const restSecs = hasRest ? 20 : 0;
    return {
      id: `fri-phase-ladder-${round}`,
      name: `HIIT Ladder Round ${round}`,
      displayLabel: `HIIT R${round} (${workSeconds}s)`,
      type: 'work' as const,
      durationSeconds: roundWork + restSecs,
      rounds: 1,
      roundDurationSeconds: roundWork,
      restDurationSeconds: restSecs,
      restAfterLastRound: hasRest,
      coachingCategory: 'bodyweight' as const,
      exercises: [
        {
          name: 'Flutter Kick Squats',
          alternativeName: 'Bodyweight Squats (low-impact)',
          durationSeconds: workSeconds,
        },
        {
          name: 'High Knees',
          alternativeName: 'Marching in place (low-impact)',
          durationSeconds: workSeconds,
        },
        {
          name: 'Burpees',
          alternativeName: 'Squat + Step-Back (low-impact)',
          durationSeconds: workSeconds,
        },
        {
          name: 'Jumping Jacks',
          alternativeName: 'Step-Jacks (low-impact)',
          durationSeconds: workSeconds,
        },
      ],
      coachingCues: [
        'Push the pace — intervals get shorter every round!',
        'Control your form even as fatigue sets in.',
        'Stay explosive on each rep.',
        'Breathe rhythmically through the burn.',
      ],
      notes: `Round ${round} descending ladder: 4 exercises x ${workSeconds}s each${hasRest ? ' + 20s rest' : ' (finisher!)'}`,
    };
  });
}

const fridayWarmup: WorkoutPhase = {
  id: 'fri-phase-1-warmup',
  name: 'Dynamic Warmup',
  displayLabel: 'WARMUP',
  type: 'warmup',
  durationSeconds: 300, // 5 minutes
  coachingCategory: 'warmup',
  exercises: [
    { name: 'Leg swings (alternating)', durationSeconds: 60 },
    { name: 'Knee up torso twists', durationSeconds: 60 },
    { name: 'Squat with toe touch', durationSeconds: 60 },
    { name: 'Log jumps', alternativeName: 'Side steps (low-impact)', durationSeconds: 60 },
    { name: 'Jumping jacks', alternativeName: 'Step-jacks (low-impact)', durationSeconds: 60 },
  ],
  coachingCues: WARMUP_COACHING,
  notes: 'Dynamic warmup sequence preparing for the ladder intervals',
};

const fridayCooldown: WorkoutPhase = {
  id: 'fri-phase-cooldown',
  name: 'Cooldown & Stretch',
  displayLabel: 'COOLDOWN',
  type: 'cooldown',
  durationSeconds: 600, // 10 minutes
  coachingCategory: 'cooldown',
  coachingCues: COOLDOWN_COACHING,
  notes: 'Full recovery stretch and heart rate normalization',
};

const fridayLadderPhases = createFridayHIITPhases();
const fridayTotalDuration = 300 + fridayLadderPhases.reduce((acc, p) => acc + p.durationSeconds, 0) + 600;

export const FRIDAY_WORKOUT: WorkoutDefinition = {
  id: 'friday-hiit',
  name: 'Video-Based HIIT',
  shortName: 'HIIT Ladder',
  day: 'friday',
  category: 'hiit',
  durationSeconds: fridayTotalDuration, // 1840 seconds = 30:40
  purpose: 'High-intensity interval ladder training based on the Fitness Blender Brutal HIIT Ladder Workout. 6 descending rounds (60s down to 10s per exercise) with short 20s recoveries.',
  equipment: ['Open floor space', 'Optional: Exercise mat for burpees'],
  intensityLabel: '8–9/10',
  referenceVideoUrl: 'https://youtu.be/cZnsLVArIt8?si=ITV_QOYxXQtndTmp',
  referenceVideoNote: 'This workout is executed independently by Exercise OS. The timers and instructions mirror the Fitness Blender Brutal HIIT Ladder Workout. Tap to view the video demonstration.',
  version: 1,
  phases: [
    fridayWarmup,
    ...fridayLadderPhases,
    fridayCooldown,
  ],
};

// ============================================================
// ALL WORKOUTS EXPORT
// ============================================================

export const ALL_WORKOUTS: WorkoutDefinition[] = [
  MONDAY_WORKOUT,
  TUESDAY_WORKOUT,
  THURSDAY_WORKOUT,
  FRIDAY_WORKOUT,
];

export function getWorkoutById(id: string): WorkoutDefinition | undefined {
  return ALL_WORKOUTS.find(w => w.id === id);
}

export function getWorkoutByDay(day: string): WorkoutDefinition | undefined {
  return ALL_WORKOUTS.find(w => w.day.toLowerCase() === day.toLowerCase());
}
