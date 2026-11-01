# Exercise OS (V1)
### Personal Workout Execution System · Offline PWA for iPhone

**Exercise OS** is a specialized, production-ready personal workout execution system designed primarily for iPhone (Safari and standalone PWA). It functions as a virtual workout coach, guiding the user through predefined weekly workouts with precision countdown timers, total workout time remaining, automatic phase/round transitions, synthesized voice announcements, randomized coaching cues, and 100% local persistence.

---

## 1. Project Architecture

The codebase is organized into modular single-responsibility components and domain services:

```
exerciseOS/
├── public/                       # PWA icons, manifest, favicon
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   ├── favicon.ico
│   └── icon.svg
├── src/
│   ├── types/                   # Unified TypeScript domain types
│   │   └── index.ts
│   ├── data/                    # Preloaded workout & coaching libraries
│   │   ├── coachingLibrary.ts   # Boxing, bodyweight, aerobic, warmup, cooldown cues
│   │   └── workoutDefinitions.ts # 4 Predefined weekly workout schedules & phases
│   ├── db/                      # Persistence layer (IndexedDB via Dexie.js)
│   │   └── database.ts          # Sessions, settings, recovery state, JSON export/import
│   ├── engine/                  # Core execution engines (headless logic)
│   │   ├── TimerEngine.ts       # Absolute timestamp-based countdown & phase progression
│   │   └── VoiceCoach.ts        # Priority-queued Web Speech API synthesizer
│   ├── hooks/                   # React integration hooks
│   │   ├── useWorkout.ts        # Coordinates TimerEngine, VoiceCoach, DB & Wake Lock
│   │   └── useSettings.ts       # Settings state and persistent DB synchronization
│   ├── utils/                   # Formatting, date calculations, file downloads
│   │   └── index.ts
│   ├── components/              # Athletic, minimalist, high-contrast dark UI
│   │   ├── WorkoutCard.tsx      # Day card with distinct category visual treatment
│   │   ├── HomeScreen.tsx       # 7-day program overview & weekly progress
│   │   ├── WorkoutOverview.tsx  # Pre-workout inspection, intervals & low-impact alts
│   │   ├── WorkoutScreen.tsx    # Live execution screen (Blue work / Grey rest)
│   │   ├── HistoryScreen.tsx    # Completed session logs, JSON export & import
│   │   └── SettingsScreen.tsx   # Voice selection, rate, coaching frequency, wake lock
│   ├── App.tsx                  # Root navigation controller (no router overhead)
│   ├── main.tsx                 # React DOM mount point
│   └── index.css                # Tailwind CSS & iPhone safe area variables
├── scripts/
│   ├── generateIcons.mjs        # Pure Node.js script to render PWA icons
│   └── verifySpec.mjs           # Unit test suite verifying all 4 workout durations
├── index.html                   # HTML entry point with iOS web-app meta tags
├── vite.config.ts               # Vite bundler & PWA service worker config
├── tailwind.config.js           # Athletic color palette & typography configuration
└── package.json
```

---

## 2. Weekly Training Schedule & Preloaded Workouts

Exercise OS includes 4 predefined weekly workouts defined in `src/data/workoutDefinitions.ts`:

| Day | Workout Session | Category | Target Duration | Calculated Duration | Intensity |
|---|---|---|---|---|---|
| **Monday** | Boxing + Full Body Conditioning | Boxing | 56:30 (3,390s) | **56:30** (3,390s) | 7–8 / 10 |
| **Tuesday** | Low Impact Aerobic Endurance | Aerobic | 45:00 (2,700s) | **45:00** (2,700s) | 4–5 / 10 |
| **Wednesday** | Recovery / Rest | Recovery | — | — | — |
| **Thursday** | Boxing Endurance | Boxing | 60:00 (3,600s) | **60:00** (3,600s) | 5–6 / 10 |
| **Friday** | Video-Based HIIT (Fitness Blender) | HIIT | 30:40 (1,840s) | **30:40** (1,840s) | 8–9 / 10 |
| **Saturday** | Recovery / Rest | Recovery | — | — | — |
| **Sunday** | Recovery / Rest | Recovery | — | — | — |

### Detailed Workout Breakdowns

1. **Monday — Boxing + Full Body Conditioning (56:30)**
   - **Phase 1 (Warmup)**: 10:00 continuous dynamic movement
   - **Phase 2 (Boxing)**: 3 rounds × 3:00 work (9:00) + 2 rests × 60s (2:00) = 11:00
   - **Phase 3 (Transition Rest)**: 2:00 hydration and recovery
   - **Phase 4 (Full Body Conditioning)**: 6 rounds × 3:00 work (18:00) + 5 rests × 90s (7:30) = 25:30
   - **Phase 5 (Cooldown)**: 8:00 continuous heart rate recovery
   - *Total calculated: 600 + 660 + 120 + 1530 + 480 = 3,390s = 56:30*

2. **Tuesday — Low Impact Aerobic Endurance (45:00)**
   - **Phase 1 (Warmup)**: 8:00 (Marching 2m, Shoulder circles 1m, Side steps 2m, Heel digs 1m, Calf raises 1m, Hip mobility 1m)
   - **Phase 2 (Aerobic Circuit)**: 5 rounds of 5 exercises (Marching, Side steps, Heel digs, Knee raises, Backward toe taps) × 60s each (1,500s work) + 4 rests between rounds × 60s (240s) = 29:00 (no rest after round 5)
   - **Phase 3 (Cooldown)**: 8:00 (Slow marching 2m, Calf stretch 1m, Hamstring 1m, Hip flexor 1m, Chest/shoulder 1m, Relaxation 2m)
   - *Total calculated: 480 + 1740 + 480 = 2,700s = 45:00*

3. **Thursday — Boxing Endurance (60:00)**
   - **Phase 1 (Warmup)**: 10:00 dynamic footwork and mobility
   - **Phase 2 (Boxing Endurance)**: 6 rounds × 3:00 (18:00 work) + 5 rests × 60s (5:00) = 23:00
   - **Phase 3 (Transition Rest)**: 2:00 hydration
   - **Phase 4 (Full Body Endurance)**: 4 rounds × 3:00 (Squats 45s, Incline pushups 45s, Glute bridges 45s, Dead bugs 45s) + 3 rests × 60s = 15:00
   - **Phase 5 (Cooldown)**: 10:00 gradual recovery
   - *Total calculated: 600 + 1380 + 120 + 900 + 600 = 3,600s = 60:00*

4. **Friday — Video-Based HIIT (30:40)**
   - *Reference*: Fitness Blender "Brutal HIIT Ladder Workout" (`https://youtu.be/cZnsLVArIt8`)
   - **Phase 1 (Warmup)**: 5:00 (Leg swings, Knee twists, Squat toe touch, Log jumps, Jumping jacks)
   - **Phase 2–7 (Descending Ladder Circuit)**:
     - 4 Core Exercises: *Flutter Kick Squats, High Knees, Burpees, Jumping Jacks*
     - Round 1: 60s each (240s) + 20s rest
     - Round 2: 50s each (200s) + 20s rest
     - Round 3: 40s each (160s) + 20s rest
     - Round 4: 30s each (120s) + 20s rest
     - Round 5: 20s each (80s) + 20s rest
     - Round 6: 10s each (40s) [finisher, no post-rest]
     - *HIIT Core Total: 840s work + 100s rest = 940s (15:40)*
   - **Phase 8 (Cooldown)**: 10:00 full-body flexibility stretch
   - *Total calculated: 300 + 940 + 600 = 1,840s = 30:40*
   - Includes documented low-impact exercise alternatives for all high-impact plyometrics.

---

## 3. Timer Engine Explanation

The timer engine (`src/engine/TimerEngine.ts`) was engineered specifically for mobile browser reliability:

1. **Absolute Timestamp Drift Prevention**:
   - Timing is **not** calculated by decrementing a variable every `setInterval`.
   - The engine stores absolute target timestamps: `intervalTargetTimestamp = Date.now() + durationSeconds * 1000`.
   - Remaining time is calculated as `Math.ceil((targetTimestamp - Date.now()) / 1000)`.
   - If JavaScript timers are throttled or delayed, zero drift accumulates.

2. **Total Remaining Time (Top of Screen)**:
   - Always computed from the single source of truth across all intervals: `currentIntervalRemaining + futureIntervalsSum`.
   - When any round or interval is skipped, the total remaining time updates immediately and accurately.

3. **Background Suspension Recovery**:
   - Listens to document `visibilitychange`.
   - When the user returns from backgrounding or locking their iPhone, `handleVisibilityChange()` fast-forwards through any intervals that expired while suspended and re-synchronizes the live clock.
   - A non-intrusive banner notifies the user that the timer recovered.

4. **Workout Controls**:
   - **Pause / Resume**: Preserves elapsed time and extends the target timestamp by the exact duration of the pause.
   - **Skip Interval**: Advances to the next interval; records the skipped interval to session history.
   - **Skip Round**: Intelligently skips all remaining exercises and rest within the current round.
   - **Restart Round**: Rewinds to the first exercise of the active round.
   - **End Workout**: Prompts for confirmation before saving as a partial session.

---

## 4. Voice Coaching Engine

The voice engine (`src/engine/VoiceCoach.ts`) wraps the browser `Web Speech API`:

1. **iOS Gesture Unlocking**:
   - Speech synthesis is primed on the explicit user tap of "Start Workout", complying with iOS audio policies.

2. **Priority Queue**:
   Speech items are queued and executed strictly by priority:
   - **Priority 1**: Phase transitions, round starts, "Round complete", workout finish.
   - **Priority 2**: Rest countdown alert (**"Get ready" at exactly 30s remaining**), 10s / 5s countdown alerts.
   - **Priority 3**: Minute announcements (**"One minute completed"**, **"Two minutes completed"**).
   - **Priority 4**: Random coaching technique instructions.
   - *Speech never overlaps; higher-priority countdowns suppress lower-priority technique cues.*

3. **Random Coaching System**:
   - Draws from categorized cue libraries (Boxing, Bodyweight, Aerobic, Warmup, Cooldown).
   - Dispatches instructions with pseudo-random jitter (default ~25–40 seconds).
   - Never repeats the same instruction consecutively.
   - Disables random coaching completely during rest periods.

---

## 5. Local Persistence & Database Structure

Stored locally via **Dexie.js** (IndexedDB wrapper) in `ExerciseOSDB`:

### Tables:
1. `sessions` (`++id, workoutId, workoutDay, date, completionStatus, startTime`)
   - Stores session records: workout name, date, start/end timestamps, planned vs actual duration, completed rounds, skipped intervals list, completion status (`completed` | `partial`).
2. `settings` (`key`)
   - Stores user preferences: voice enabled, selected voice URI, speech rate, announcement toggles, coaching frequency, and screen wake lock preference.
3. `activeState` (`workoutId`)
   - Automatically snapshots the active interval, round index, target timestamp, and pause accumulation on every interval transition.
   - If Safari or the PWA is accidentally reloaded, the app detects this record and displays an instant **"Resume Session"** prompt.

### JSON Export & Import:
- Available on the Workout History screen.
- Exports complete sessions and user preferences as formatted JSON.
- Validates imported schema and prompts the user to either **Merge** (preserving existing records) or **Overwrite**.

---

## 6. Installation & Development Commands

### Requirements:
- Node.js 18+ (tested on Node v24)
- npm 8+

### Setup:
```bash
# Clone the repository
git clone https://github.com/your-username/exercise-os.git
cd exercise-os

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build:
```bash
# Compile TypeScript and bundle with Vite
npm run build

# Preview production build locally
npm run preview
```

### Verification Suite:
```bash
# Runs acceptance criteria test verifying all 4 workout durations
node scripts/verifySpec.mjs
```

---

## 7. Cloudflare Pages Deployment Guide

Deploying Exercise OS to Cloudflare Pages is 100% free with unlimited bandwidth and automatic HTTPS:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Exercise OS V1 release"
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/exercise-os.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
   - In the sidebar, navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
   - Select your `exercise-os` repository.

3. **Configure Build Settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank)

4. **Deploy**:
   - Click **Save and Deploy**.
   - Cloudflare will clone, build, and deploy the app to a custom `*.pages.dev` domain with SSL.

---

## 8. iPhone PWA Installation Instructions

1. Open your Cloudflare Pages deployment URL in **Safari on your iPhone**.
2. Tap the **Share** button (the square with an arrow pointing upward at the bottom of the screen).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name **Exercise OS** and tap **Add**.
5. Close Safari and launch **Exercise OS** directly from your Home Screen icon.
6. The app launches in standalone, fullscreen mode without Safari URL bars or bottom navigation.
7. You can now use Exercise OS completely offline in airplane mode or gym basements without internet connectivity.

---

## 9. How to Add New Workouts in Future Versions

Workout definitions are decoupled from the timer engine in `src/data/workoutDefinitions.ts`. To add a new workout:

1. Add your workout configuration to `ALL_WORKOUTS`:
   ```typescript
   export const SATURDAY_WORKOUT: WorkoutDefinition = {
     id: 'saturday-kettlebell',
     name: 'Kettlebell Strength & Power',
     shortName: 'Kettlebell',
     day: 'saturday',
     category: 'bodyweight',
     durationSeconds: 2400, // 40 minutes
     purpose: 'Full-body functional strength and hip power.',
     equipment: ['1x Kettlebell'],
     intensityLabel: '7/10',
     version: 1,
     phases: [
       // Define warmup, work rounds with restDurationSeconds, and cooldown
     ],
   };
   ```
2. The timer engine, UI dashboard, and session recorder will automatically support the new session without modifying any engine code.
