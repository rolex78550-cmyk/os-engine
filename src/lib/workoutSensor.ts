/**
 * workoutSensor.ts — Phone-sensor based workout detection library
 *
 * Pure JavaScript, no AI, no camera, no tokens. Uses DeviceMotion API
 * (accelerometer + gyroscope) and DeviceOrientation API.
 *
 * Supported workouts:
 *  - Push-ups:    phone chest pocket, Z-axis gravity flip
 *  - Squats:      phone front pocket, Y-axis + tilt
 *  - Plank:       phone on back, stillness timer
 *  - Walking:     phone pocket, browser StepCounter (Pedometer API)
 *  - Meditation:  phone face-up, gyro stillness detection
 *
 * Each detector returns:
 *  - { type, count, valid, durationMs, paceMs, validRep, ... }
 *  - events fired per rep via callback
 */

export type WorkoutType = "pushup" | "squat" | "plank" | "walking" | "meditation";

export interface DetectorConfig {
  targetReps: number;
  targetDurationMs?: number; // for plank / meditation
  onRep?: (state: RepState) => void;
  onTick?: (state: RepState) => void;
}

export interface RepState {
  type: WorkoutType;
  count: number;
  valid: boolean;
  durationMs: number;
  paceMs: number | null;
  lastRepMs: number | null;
  rejected: number;
  metadata: Record<string, any>;
}

// =============================================================
// GENERIC SENSOR MANAGER
// =============================================================
export class SensorManager {
  private listeners: { [key: string]: (e: any) => void } = {};
  private active = false;

  start() {
    if (this.active) return;
    this.active = true;
  }

  stop() {
    if (!this.active) return;
    Object.keys(this.listeners).forEach((k) => {
      if (k === "devicemotion") window.removeEventListener("devicemotion", this.listeners[k]);
      if (k === "deviceorientation") window.removeEventListener("deviceorientation", this.listeners[k]);
    });
    this.listeners = {};
    this.active = false;
  }

  onMotion(handler: (e: DeviceMotionEvent) => void) {
    this.listeners["devicemotion"] = handler;
    window.addEventListener("devicemotion", handler, { passive: true });
  }

  onOrientation(handler: (e: DeviceOrientationEvent) => void) {
    this.listeners["deviceorientation"] = handler;
    window.addEventListener("deviceorientation", handler, { passive: true });
  }
}

// =============================================================
// PUSH-UP DETECTOR
//   - Phone chest pocket OR phone on back (during push-ups)
//   - Z-axis gravity flips (face-up → face-down per rep)
//   - v2: loosened thresholds + 2-axis detection for reliability
// =============================================================
export class PushupDetector {
  private state: "ready" | "descending" | "bottom" | "ascending" = "ready";
  private repStart = 0;
  private phaseStart = 0;
  private lastMag = 9.8;
  private lastRepTs = 0;
  private count = 0;
  private rejected = 0;
  private recentPaces: number[] = [];
  private recentPace = 0;
  private lastRepMs: number | null = null;
  private baselineZ: number | null = null;
  private calibrated = false;

  // LOOSENED v2 thresholds — pocket-friendly, accept smaller movements
  private readonly THRESHOLD_DOWN = 8.5;    // was 7.5 (harder to reach)
  private readonly THRESHOLD_UP = 9.0;      // was 9.2 (slightly more forgiving)
  private readonly THRESHOLD_BOTTOM = 7.0;  // was 5.5 (much easier to reach)
  private readonly THRESHOLD_TOP = 9.4;     // was 9.5
  private readonly MIN_REP_MS = 600;        // was 800 (faster reps allowed)
  private readonly MAX_REP_MS = 10000;      // was 8000
  private readonly MIN_VARIANCE = 0.2;      // was 0.5 (smaller delta counts)
  private readonly COOLDOWN_MS = 300;       // was 400 (debounce per rep)

  process(e: DeviceMotionEvent, onRep?: (s: RepState) => void): void {
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.z === null) return;

    const z = Math.abs(accel.z);
    const mag = Math.sqrt(
      (accel.x || 0) ** 2 + (accel.y || 0) ** 2 + (accel.z || 0) ** 2
    );
    const variance = Math.abs(mag - this.lastMag);
    this.lastMag = mag;
    const now = Date.now();

    // Calibrate baseline on first reading
    if (!this.calibrated) {
      this.baselineZ = z;
      this.calibrated = true;
      this.state = "ready";
      return;
    }

    // Use relative delta from baseline so any phone position works
    const dz = this.baselineZ !== null ? z - this.baselineZ : 0;
    const goingDown = dz < -0.8; // z drops by 0.8+ m/s² from baseline
    const goingUp = dz > 0.5;    // z rises by 0.5+ m/s² from baseline

    switch (this.state) {
      case "ready":
        // Trigger when z drops OR variance spikes
        if ((z < this.THRESHOLD_DOWN || goingDown) &&
            (variance > this.MIN_VARIANCE || z < this.THRESHOLD_DOWN)) {
          this.repStart = now;
          this.phaseStart = now;
          this.state = "descending";
        }
        break;

      case "descending":
        // Hit the bottom of the rep
        if (z < this.THRESHOLD_BOTTOM || (dz < -1.5)) {
          this.phaseStart = now;
          this.state = "bottom";
        } else if (z > this.THRESHOLD_UP && goingUp) {
          // Bounced back up too fast — abort rep
          this.state = "ready";
          this.repStart = now;
        }
        break;

      case "bottom":
        // Push back up
        if ((z > this.THRESHOLD_UP || goingUp) && variance > this.MIN_VARIANCE * 0.5) {
          this.phaseStart = now;
          this.state = "ascending";
        } else if (now - this.phaseStart > this.MAX_REP_MS) {
          // Held at bottom too long — abort
          this.state = "ready";
          this.repStart = now;
        }
        break;

      case "ascending":
        // Top of the rep reached
        if (z > this.THRESHOLD_TOP || (goingUp && z > 9.0)) {
          const repDuration = now - this.repStart;
          const timeSinceLast = this.lastRepTs ? now - this.lastRepTs : Infinity;

          if (
            repDuration >= this.MIN_REP_MS &&
            timeSinceLast >= this.COOLDOWN_MS
          ) {
            this.count++;
            this.lastRepMs = repDuration;
            this.lastRepTs = now;
            this.recentPaces.push(repDuration);
            if (this.recentPaces.length > 5) this.recentPaces.shift();
            this.recentPace =
              this.recentPaces.reduce((a, b) => a + b, 0) /
              this.recentPaces.length;
            if ("vibrate" in navigator) navigator.vibrate(40);
            onRep?.(this.snapshot());
          } else {
            this.rejected++;
          }
          this.state = "ready";
        }
        break;
    }
  }

  /**
   * Manual rep — fallback for when sensor misses. Tap to count.
   * Validates timing so user can't spam-tap.
   */
  manualRep(onRep?: (s: RepState) => void): boolean {
    const now = Date.now();
    const timeSinceLast = this.lastRepTs ? now - this.lastRepTs : Infinity;
    if (timeSinceLast < this.COOLDOWN_MS) return false;

    this.count++;
    this.lastRepMs = timeSinceLast === Infinity ? 1000 : timeSinceLast;
    this.lastRepTs = now;
    this.recentPaces.push(this.lastRepMs);
    if (this.recentPaces.length > 5) this.recentPaces.shift();
    this.recentPace =
      this.recentPaces.reduce((a, b) => a + b, 0) / this.recentPaces.length;
    if ("vibrate" in navigator) navigator.vibrate(40);
    onRep?.(this.snapshot());
    return true;
  }

  snapshot(): RepState {
    return {
      type: "pushup",
      count: this.count,
      valid: this.count > 0,
      durationMs: this.lastRepMs ?? 0,
      paceMs: this.recentPace || null,
      lastRepMs: this.lastRepMs,
      rejected: this.rejected,
      metadata: { calibrated: this.calibrated, baselineZ: this.baselineZ },
    };
  }

  reset() {
    this.state = "ready";
    this.count = 0;
    this.rejected = 0;
    this.recentPaces = [];
    this.calibrated = false;
    this.baselineZ = null;
  }

  recalibrate(z: number) {
    this.baselineZ = z;
    this.calibrated = true;
  }
}

// =============================================================
// SQUAT DETECTOR
//   - Phone front pocket
//   - Y-axis (vertical) drop + Z-axis tilt forward
//   - Squat = phone goes down + leans forward
// =============================================================
export class SquatDetector {
  private state: "standing" | "squatting" | "rising" = "standing";
  private repStart = 0;
  private phaseStart = 0;
  private baselineY = 0;
  private baselineZ = 0;
  private calibrated = false;
  private lastMag = 9.8;
  private count = 0;
  private rejected = 0;
  private lastRepMs: number | null = null;
  private recentPaces: number[] = [];
  private recentPace = 0;

  // Thresholds (delta from standing baseline)
  private readonly SQUAT_DEPTH_Y = 1.5;    // m/s² drop on Y axis
  private readonly SQUAT_TILT_Z = 1.0;    // m/s² forward shift on Z
  private readonly MIN_REP_MS = 1500;     // squats are slower than pushups
  private readonly MAX_REP_MS = 6000;
  private readonly VARIANCE_THRESHOLD = 0.3;

  process(e: DeviceMotionEvent, onRep?: (s: RepState) => void): void {
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.y === null || accel.z === null) return;

    const y = accel.y;
    const z = accel.z;
    const mag = Math.sqrt(accel.x! * accel.x! + y * y + z * z);
    const variance = Math.abs(mag - this.lastMag);
    this.lastMag = mag;
    const now = Date.now();

    // Calibrate baseline from first reading
    if (!this.calibrated) {
      this.baselineY = y;
      this.baselineZ = z;
      this.calibrated = true;
      return;
    }

    const dy = this.baselineY - y; // positive when squatting (Y decreases)
    const dz = z - this.baselineZ; // positive when leaning forward (Z increases)

    switch (this.state) {
      case "standing":
        // User starts squatting down
        if (dy > this.SQUAT_DEPTH_Y && dz > this.SQUAT_TILT_Z * 0.5 && variance > this.VARIANCE_THRESHOLD) {
          this.repStart = now;
          this.phaseStart = now;
          this.state = "squatting";
        }
        break;

      case "squatting":
        // Bottom of squat — wait for minimum time
        if (now - this.phaseStart > 300) {
          this.state = "rising";
        }
        // Abort if user goes back up too quickly
        if (dy < 0.5 && now - this.phaseStart > 100) {
          this.state = "standing";
          this.repStart = now;
        }
        break;

      case "rising":
        // User has returned to standing position
        if (dy < 0.5 && variance < this.VARIANCE_THRESHOLD) {
          const repDuration = now - this.repStart;
          if (repDuration >= this.MIN_REP_MS && repDuration <= this.MAX_REP_MS) {
            this.count++;
            this.lastRepMs = repDuration;
            this.recentPaces.push(repDuration);
            if (this.recentPaces.length > 5) this.recentPaces.shift();
            this.recentPace = this.recentPaces.reduce((a, b) => a + b, 0) / this.recentPaces.length;
            if ("vibrate" in navigator) navigator.vibrate(60);
            onRep?.(this.snapshot());
          } else {
            this.rejected++;
          }
          this.state = "standing";
        }
        break;
    }
  }

  snapshot(): RepState {
    return {
      type: "squat",
      count: this.count,
      valid: this.count > 0,
      durationMs: this.lastRepMs ?? 0,
      paceMs: this.recentPace || null,
      lastRepMs: this.lastRepMs,
      rejected: this.rejected,
      metadata: {},
    };
  }

  /**
   * Manual rep — fallback for when sensor misses. Tap to count.
   */
  manualRep(onRep?: (s: RepState) => void): boolean {
    const now = Date.now();
    const timeSinceLast = this.lastRepMs ? now - this.lastRepMs : Infinity;
    // Squats need at least 1500ms between reps (they're slower than pushups)
    if (timeSinceLast < 1500) return false;

    this.count++;
    this.lastRepMs = timeSinceLast === Infinity ? 2000 : timeSinceLast;
    this.recentPaces.push(this.lastRepMs);
    if (this.recentPaces.length > 5) this.recentPaces.shift();
    this.recentPace =
      this.recentPaces.reduce((a, b) => a + b, 0) / this.recentPaces.length;
    if ("vibrate" in navigator) navigator.vibrate(40);
    onRep?.(this.snapshot());
    return true;
  }

  reset() {
    this.state = "standing";
    this.count = 0;
    this.rejected = 0;
    this.calibrated = false;
    this.recentPaces = [];
  }
}

// =============================================================
// PLANK DETECTOR
//   - Phone on back (lying face-up on floor)
//   - Stillness timer (no major movement)
//   - If user moves too much = break in plank = invalid
// =============================================================
export class PlankDetector {
  private startTime = 0;
  private duration = 0;
  private lastMovement = 0;
  private breaks = 0;
  private maxStillnessGap = 0;
  private currentStillnessStart = 0;
  private valid = true;
  private tickInterval: any = null;
  private onTick?: (s: RepState) => void;

  // Thresholds
  private readonly MOVE_THRESHOLD = 1.5; // m/s² — anything more = movement
  private readonly MAX_BREAKS = 2;        // tolerate 2 small movements

  start(onTick?: (s: RepState) => void) {
    this.startTime = Date.now();
    this.duration = 0;
    this.breaks = 0;
    this.lastMovement = Date.now();
    this.maxStillnessGap = 0;
    this.currentStillnessStart = Date.now();
    this.valid = true;
    this.onTick = onTick;

    // Tick every 500ms
    this.tickInterval = setInterval(() => {
      this.duration = Date.now() - this.startTime;
      this.onTick?.(this.snapshot());
    }, 500);
  }

  process(e: DeviceMotionEvent): void {
    if (!this.startTime) return;
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.x === null) return;

    const mag = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    const variance = Math.abs(mag - 9.8); // deviation from gravity

    if (variance > this.MOVE_THRESHOLD) {
      // Movement detected
      this.breaks++;
      this.lastMovement = Date.now();
      this.currentStillnessStart = Date.now();
      if (this.breaks > this.MAX_BREAKS) {
        this.valid = false;
      }
    } else {
      // Stillness
      const stillnessDuration = Date.now() - this.currentStillnessStart;
      if (stillnessDuration > this.maxStillnessGap) {
        this.maxStillnessGap = stillnessDuration;
      }
    }
  }

  stop(): RepState {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;
    this.duration = Date.now() - this.startTime;
    return this.snapshot();
  }

  snapshot(): RepState {
    return {
      type: "plank",
      count: 0,
      valid: this.valid && this.breaks <= this.MAX_BREAKS,
      durationMs: this.duration,
      paceMs: null,
      lastRepMs: null,
      rejected: this.breaks,
      metadata: { breaks: this.breaks, maxStillnessGap: this.maxStillnessGap },
    };
  }

  reset() {
    this.startTime = 0;
    this.duration = 0;
    this.breaks = 0;
    this.valid = true;
  }
}

// =============================================================
// WALKING / STEP COUNTER
//   - Phone in pocket
//   - Uses DeviceMotion acceleration peaks to detect steps
//   - Browser-native pedometer (where available)
// =============================================================
export class StepDetector {
  private lastStepTime = 0;
  private stepCount = 0;
  private magHistory: number[] = [];
  private baseline = 9.8;
  private recentIntervals: number[] = [];
  private recentPace = 0;

  // Thresholds
  private readonly PEAK_THRESHOLD = 1.2; // m/s² above baseline
  private readonly MIN_STEP_MS = 350;     // ~170 steps/min max
  private readonly MAX_STEP_MS = 2000;    // ~30 steps/min min
  private readonly HISTORY_SIZE = 10;

  process(e: DeviceMotionEvent, onRep?: (s: RepState) => void): void {
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.x === null) return;

    const mag = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    this.magHistory.push(mag);
    if (this.magHistory.length > this.HISTORY_SIZE) this.magHistory.shift();

    // Adaptive baseline = smoothed magnitude
    if (this.magHistory.length >= 3) {
      this.baseline = this.magHistory.reduce((a, b) => a + b, 0) / this.magHistory.length;
    }

    const deviation = mag - this.baseline;
    const now = Date.now();
    const timeSinceLastStep = now - this.lastStepTime;

    // Detect peak: deviation crosses threshold after being low
    if (
      deviation > this.PEAK_THRESHOLD &&
      timeSinceLastStep > this.MIN_STEP_MS &&
      timeSinceLastStep < this.MAX_STEP_MS
    ) {
      this.stepCount++;
      this.lastStepTime = now;
      this.recentIntervals.push(timeSinceLastStep);
      if (this.recentIntervals.length > 5) this.recentIntervals.shift();
      this.recentPace = this.recentIntervals.reduce((a, b) => a + b, 0) / this.recentIntervals.length;
      if ("vibrate" in navigator) navigator.vibrate(20);
      onRep?.(this.snapshot());
    }
  }

  snapshot(): RepState {
    return {
      type: "walking",
      count: this.stepCount,
      valid: this.stepCount > 0,
      durationMs: 0,
      paceMs: this.recentPace || null,
      lastRepMs: null,
      rejected: 0,
      metadata: { cadence: this.recentPace ? Math.round(60000 / this.recentPace) : 0 },
    };
  }

  reset() {
    this.stepCount = 0;
    this.magHistory = [];
    this.recentIntervals = [];
  }
}

// =============================================================
// MEDITATION DETECTOR
//   - Phone face-up (lying on chest or beside user)
//   - Gyro stillness detection
//   - Timer with micro-movement tolerance
// =============================================================
export class MeditationDetector {
  private startTime = 0;
  private duration = 0;
  private microMovements = 0;
  private lastMovement = 0;
  private stillnessStart = 0;
  private maxStillness = 0;
  private tickInterval: any = null;
  private onTick?: (s: RepState) => void;
  private valid = true;

  // Thresholds — meditation allows small breath-induced movement
  private readonly GYRO_THRESHOLD = 0.3;  // rad/s
  private readonly ACCEL_THRESHOLD = 0.6; // m/s² deviation from gravity
  private readonly MAX_MICRO_MOVEMENTS = 5; // tolerate 5 small adjustments

  start(onTick?: (s: RepState) => void) {
    this.startTime = Date.now();
    this.duration = 0;
    this.microMovements = 0;
    this.lastMovement = Date.now();
    this.stillnessStart = Date.now();
    this.maxStillness = 0;
    this.valid = true;
    this.onTick = onTick;

    this.tickInterval = setInterval(() => {
      this.duration = Date.now() - this.startTime;
      this.onTick?.(this.snapshot());
    }, 1000);
  }

  processMotion(e: DeviceMotionEvent): void {
    if (!this.startTime) return;
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.x === null) return;

    const mag = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    const variance = Math.abs(mag - 9.8);

    if (variance > this.ACCEL_THRESHOLD) {
      this.microMovements++;
      this.lastMovement = Date.now();
      this.stillnessStart = Date.now();
      if (this.microMovements > this.MAX_MICRO_MOVEMENTS) {
        this.valid = false;
      }
    } else {
      const stillnessDur = Date.now() - this.stillnessStart;
      if (stillnessDur > this.maxStillness) this.maxStillness = stillnessDur;
    }
  }

  processOrientation(e: DeviceOrientationEvent): void {
    if (!this.startTime) return;
    const rot = (e.alpha || 0) + (e.beta || 0) + (e.gamma || 0);
    // Detect rotation — very low threshold for meditation
    if (Math.abs(rot) > this.GYRO_THRESHOLD * 10) {
      this.microMovements++;
    }
  }

  stop(): RepState {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;
    this.duration = Date.now() - this.startTime;
    return this.snapshot();
  }

  snapshot(): RepState {
    return {
      type: "meditation",
      count: 0,
      valid: this.valid && this.microMovements <= this.MAX_MICRO_MOVEMENTS,
      durationMs: this.duration,
      paceMs: null,
      lastRepMs: null,
      rejected: this.microMovements,
      metadata: { microMovements: this.microMovements, maxStillness: this.maxStillness },
    };
  }

  reset() {
    this.startTime = 0;
    this.duration = 0;
    this.microMovements = 0;
    this.valid = true;
  }
}

// =============================================================
// DETECT WORKOUT TYPE FROM MISSION TITLE
// =============================================================
export function detectWorkoutType(title: string): WorkoutType | null {
  const t = title.toLowerCase();
  if (/push[\s-]?up/.test(t)) return "pushup";
  if (/squat/.test(t)) return "squat";
  if (/plank/.test(t)) return "plank";
  if (/walk|run|step/.test(t)) return "walking";
  if (/meditat|breath|mindful/.test(t)) return "meditation";
  return null;
}

// =============================================================
// CONFIG — workout metadata
// =============================================================
export const WORKOUT_CONFIG: Record<WorkoutType, {
  label: string;
  icon: string;
  phonePlacement: string;
  detection: string;
  xpPerRep: number;
  isTimeBased: boolean;
  unit: string;
}> = {
  pushup: {
    label: "Push-ups",
    icon: "💪",
    phonePlacement: "Phone in chest pocket, tight fit",
    detection: "Z-axis gravity flip (face-up → face-down per rep)",
    xpPerRep: 2,
    isTimeBased: false,
    unit: "reps",
  },
  squat: {
    label: "Squats",
    icon: "🦵",
    phonePlacement: "Phone in front pocket",
    detection: "Y-axis drop + Z-axis forward tilt",
    xpPerRep: 3,
    isTimeBased: false,
    unit: "reps",
  },
  plank: {
    label: "Plank",
    icon: "🧘",
    phonePlacement: "Phone on your back (lying face-up)",
    detection: "Stillness timer with movement tolerance",
    xpPerRep: 0,
    isTimeBased: true,
    unit: "seconds",
  },
  walking: {
    label: "Walking",
    icon: "🚶",
    phonePlacement: "Phone in pocket (any)",
    detection: "Step peaks from accelerometer magnitude",
    xpPerRep: 1,
    isTimeBased: false,
    unit: "steps",
  },
  meditation: {
    label: "Meditation",
    icon: "🧠",
    phonePlacement: "Phone face-up beside you",
    detection: "Gyro stillness + accelerometer calm",
    xpPerRep: 0,
    isTimeBased: true,
    unit: "seconds",
  },
};
