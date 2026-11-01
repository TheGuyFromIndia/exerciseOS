// Pure ESM test script for workout definitions and timer interval logic

function flattenWorkout(workout) {
  const intervals = [];
  let index = 0;

  for (const phase of workout.phases) {
    if (phase.type === 'warmup' || phase.type === 'cooldown' || phase.type === 'transition') {
      if (phase.exercises && phase.exercises.length > 0) {
        phase.exercises.forEach((ex, exIdx) => {
          intervals.push({
            id: `${phase.id}-ex-${exIdx}`,
            index: index++,
            phaseId: phase.id,
            durationSeconds: ex.durationSeconds,
            isRest: false,
          });
        });
      } else {
        intervals.push({
          id: `${phase.id}-single`,
          index: index++,
          phaseId: phase.id,
          durationSeconds: phase.durationSeconds,
          isRest: false,
        });
      }
    } else if (phase.type === 'work') {
      const rounds = phase.rounds ?? 1;
      const roundDuration = phase.roundDurationSeconds ?? phase.durationSeconds;
      const restDuration = phase.restDurationSeconds ?? 0;
      const exercises = phase.exercises;

      for (let r = 0; r < rounds; r++) {
        const roundNumber = r + 1;
        const isLastRound = r === rounds - 1;

        if (exercises && exercises.length > 0) {
          exercises.forEach((ex, exIdx) => {
            intervals.push({
              id: `${phase.id}-r${roundNumber}-ex${exIdx}`,
              index: index++,
              phaseId: phase.id,
              durationSeconds: ex.durationSeconds,
              isRest: false,
            });
          });
        } else {
          intervals.push({
            id: `${phase.id}-r${roundNumber}`,
            index: index++,
            phaseId: phase.id,
            durationSeconds: roundDuration,
            isRest: false,
          });
        }

        const includeRest = !isLastRound || phase.restAfterLastRound === true;
        if (includeRest && restDuration > 0) {
          intervals.push({
            id: `${phase.id}-r${roundNumber}-rest`,
            index: index++,
            phaseId: `${phase.id}-rest`,
            durationSeconds: restDuration,
            isRest: true,
          });
        }
      }
    }
  }

  return intervals;
}

function computeTotalDuration(intervals) {
  return intervals.reduce((acc, curr) => acc + curr.durationSeconds, 0);
}

function formatMMS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`✓ PASS: ${name} ${details ? '(' + details + ')' : ''}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

console.log('\n=== RUNNING SPECIFICATION VERIFICATION ===\n');

// Monday Workout Structure
const monday = {
  id: 'monday-boxing-conditioning',
  durationSeconds: 3390,
  phases: [
    { id: 'mon-p1', type: 'warmup', durationSeconds: 600 },
    { id: 'mon-p2', type: 'work', durationSeconds: 660, rounds: 3, roundDurationSeconds: 180, restDurationSeconds: 60, restAfterLastRound: false },
    { id: 'mon-p3', type: 'transition', durationSeconds: 120 },
    { id: 'mon-p4', type: 'work', durationSeconds: 1530, rounds: 6, roundDurationSeconds: 180, restDurationSeconds: 90, restAfterLastRound: false },
    { id: 'mon-p5', type: 'cooldown', durationSeconds: 480 },
  ],
};

const monIv = flattenWorkout(monday);
const monTotal = computeTotalDuration(monIv);
assert(monTotal === 3390, 'Monday duration calculates to 56:30', `Total: ${monTotal}s = ${formatMMS(monTotal)}`);

// Tuesday Workout Structure
const tuesday = {
  id: 'tuesday-aerobic-endurance',
  durationSeconds: 2700,
  phases: [
    {
      id: 'tue-p1',
      type: 'warmup',
      durationSeconds: 480,
      exercises: [
        { durationSeconds: 120 },
        { durationSeconds: 60 },
        { durationSeconds: 120 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
      ],
    },
    {
      id: 'tue-p2',
      type: 'work',
      durationSeconds: 1740,
      rounds: 5,
      roundDurationSeconds: 300,
      restDurationSeconds: 60,
      restAfterLastRound: false,
      exercises: [
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
      ],
    },
    {
      id: 'tue-p3',
      type: 'cooldown',
      durationSeconds: 480,
      exercises: [
        { durationSeconds: 120 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 60 },
        { durationSeconds: 120 },
      ],
    },
  ],
};

const tueIv = flattenWorkout(tuesday);
const tueTotal = computeTotalDuration(tueIv);
assert(tueTotal === 2700, 'Tuesday duration calculates to 45:00', `Total: ${tueTotal}s = ${formatMMS(tueTotal)}`);

// Thursday Workout Structure
const thursday = {
  id: 'thursday-boxing-endurance',
  durationSeconds: 3600,
  phases: [
    { id: 'thu-p1', type: 'warmup', durationSeconds: 600 },
    { id: 'thu-p2', type: 'work', durationSeconds: 1380, rounds: 6, roundDurationSeconds: 180, restDurationSeconds: 60, restAfterLastRound: false },
    { id: 'thu-p3', type: 'transition', durationSeconds: 120 },
    {
      id: 'thu-p4',
      type: 'work',
      durationSeconds: 900,
      rounds: 4,
      roundDurationSeconds: 180,
      restDurationSeconds: 60,
      restAfterLastRound: false,
      exercises: [
        { durationSeconds: 45 },
        { durationSeconds: 45 },
        { durationSeconds: 45 },
        { durationSeconds: 45 },
      ],
    },
    { id: 'thu-p5', type: 'cooldown', durationSeconds: 600 },
  ],
};

const thuIv = flattenWorkout(thursday);
const thuTotal = computeTotalDuration(thuIv);
assert(thuTotal === 3600, 'Thursday duration calculates to 60:00', `Total: ${thuTotal}s = ${formatMMS(thuTotal)}`);

// Friday Workout Structure (HIIT Ladder)
const ladderRounds = [
  { round: 1, work: 60, rest: 20, last: false },
  { round: 2, work: 50, rest: 20, last: false },
  { round: 3, work: 40, rest: 20, last: false },
  { round: 4, work: 30, rest: 20, last: false },
  { round: 5, work: 20, rest: 20, last: false },
  { round: 6, work: 10, rest: 0, last: true },
];

const friLadderPhases = ladderRounds.map(r => ({
  id: `fri-ladder-${r.round}`,
  type: 'work',
  durationSeconds: r.work * 4 + r.rest,
  rounds: 1,
  roundDurationSeconds: r.work * 4,
  restDurationSeconds: r.rest,
  restAfterLastRound: !r.last,
  exercises: [
    { durationSeconds: r.work },
    { durationSeconds: r.work },
    { durationSeconds: r.work },
    { durationSeconds: r.work },
  ],
}));

const friday = {
  id: 'friday-hiit',
  phases: [
    { id: 'fri-p1', type: 'warmup', durationSeconds: 300 },
    ...friLadderPhases,
    { id: 'fri-p3', type: 'cooldown', durationSeconds: 600 },
  ],
};

const friIv = flattenWorkout(friday);
const friTotal = computeTotalDuration(friIv);
assert(friTotal === 1840, 'Friday duration reflects warmup (300s) + HIIT ladder (940s) + cooldown (600s)', `Total: ${friTotal}s = ${formatMMS(friTotal)}`);

console.log(`\nTests Summary: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) process.exit(1);
