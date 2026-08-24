/**
 * WorkoutTracker.tsx — Unified motion-based workout tracker
 *
 * Handles all 5 workout types: push-ups, squats, plank, walking, meditation.
 * Each has its own sensor detection strategy (see workoutSensor.ts).
 *
 * NO camera, NO AI, NO tokens. 100% private, works offline.
 *
 * Premium dark theme — no neon, refined typography.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Activity, Zap, CheckCircle, AlertCircle, Footprints, Clock } from "lucide-react";
import {
  WorkoutType, WORKOUT_CONFIG, PushupDetector, SquatDetector, PlankDetector,
  StepDetector, MeditationDetector, SensorManager, RepState, detectWorkoutType,
} from "../../lib/workoutSensor";

interface WorkoutTrackerProps {
  workoutType: WorkoutType;
  missionTitle: string;
  targetValue: number; // reps OR duration in seconds (we'll auto-detect)
  onComplete: (state: RepState) => void;
  onCancel: () => void;
}

type Phase = "idle" | "running" | "paused" | "done";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatCountdown(targetSec: number): string {
  const m = Math.floor(targetSec / 60);
  const s = targetSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({
  workoutType,
  missionTitle,
  targetValue,
  onComplete,
  onCancel,
}) => {
  const config = WORKOUT_CONFIG[workoutType];
  const isTimeBased = config.isTimeBased;
  const xpPerRep = config.xpPerRep;

  // ===== State =====
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paceMs, setPaceMs] = useState<number | null>(null);
  const [lastEventMs, setLastEventMs] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied" | "unavailable">("unknown");
  const [hapticSupported, setHapticSupported] = useState(false);

  // ===== Refs =====
  const sensorRef = useRef<SensorManager | null>(null);
  const detectorRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const lastSnapshotRef = useRef<RepState | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  // ===== Permission =====
  useEffect(() => {
    if (typeof window === "undefined") {
      setPermissionStatus("unavailable");
      return;
    }
    // @ts-ignore
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      // @ts-ignore
      DeviceMotionEvent.requestPermission()
        .then((state: string) => setPermissionStatus(state === "granted" ? "granted" : "denied"))
        .catch(() => setPermissionStatus("denied"));
    } else if (typeof DeviceMotionEvent !== "undefined") {
      setPermissionStatus("granted");
    } else {
      setPermissionStatus("unavailable");
    }
    setHapticSupported(typeof navigator !== "undefined" && "vibrate" in navigator);
    return () => stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Init detector =====
  const initDetector = useCallback(() => {
    switch (workoutType) {
      case "pushup": return new PushupDetector();
      case "squat": return new SquatDetector();
      case "plank": return new PlankDetector();
      case "walking": return new StepDetector();
      case "meditation": return new MeditationDetector();
    }
  }, [workoutType]);

  // ===== Start =====
  const startTracking = () => {
    if (permissionStatus !== "granted") {
      alert("Motion sensor permission required. Please enable motion access in your browser settings.");
      return;
    }
    startTimeRef.current = Date.now();
    setCount(0);
    setRejected(0);
    setElapsedMs(0);
    setPaceMs(null);
    setLastEventMs(null);
    setPhase("running");
    if ("vibrate" in navigator) navigator.vibrate(80);

    const sensor = new SensorManager();
    sensorRef.current = sensor;
    const detector = initDetector();
    detectorRef.current = detector;

    // For plank/meditation, start internal timer
    if (workoutType === "plank" || workoutType === "meditation") {
      (detector as any).start((s: RepState) => {
        setCount(0); // not used
        setElapsedMs(s.durationMs);
        lastSnapshotRef.current = s;
        setRejected(s.rejected);
      });
    }

    sensor.onMotion((e: DeviceMotionEvent) => {
      const det = detectorRef.current;
      if (!det) return;
      const onRep = (s: RepState) => {
        setCount(s.count);
        setPaceMs(s.paceMs);
        setLastEventMs(s.lastRepMs);
        lastSnapshotRef.current = s;
      };
      // Time-based detectors don't count "reps", they tick
      if (workoutType === "plank" || workoutType === "meditation") {
        det.processMotion?.(e);
      } else {
        det.process(e, onRep);
      }
    });

    if (workoutType === "meditation") {
      sensor.onOrientation((e: DeviceOrientationEvent) => {
        detectorRef.current?.processOrientation?.(e);
      });
    }

    // Tick for time-based UI updates
    if (isTimeBased) {
      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 250);
    }
  };

  // ===== Stop =====
  const stopTracking = () => {
    if (sensorRef.current) {
      sensorRef.current.stop();
      sensorRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (detectorRef.current && (workoutType === "plank" || workoutType === "meditation")) {
      detectorRef.current.stop();
    }
  };

  // ===== Manual rep — fallback for when sensor misses =====
  // Calls the detector's manualRep() which validates timing and counts.
  const handleManualRep = () => {
    if (phase !== "running") return;
    const det = detectorRef.current;
    if (!det) return;
    // Only pushup / squat detectors have manualRep — time-based don't
    if (typeof det.manualRep !== "function") return;

    const onRep = (s: RepState) => {
      setCount(s.count);
      setPaceMs(s.paceMs);
      setLastEventMs(s.lastRepMs);
      lastSnapshotRef.current = s;
    };
    const ok = det.manualRep(onRep);
    if (ok && "vibrate" in navigator) navigator.vibrate(40);
  };

  const handlePause = () => {
    stopTracking();
    setPhase("paused");
  };

  const handleResume = () => {
    setPhase("running");
    // Restart tracking (re-init sensor)
    startTracking();
  };

  const handleStopAndSave = () => {
    stopTracking();
    const det = detectorRef.current;
    let snapshot: RepState;
    if (isTimeBased && det) {
      snapshot = det.stop();
      // Override count with elapsed seconds for time-based workouts
      snapshot.count = Math.floor(snapshot.durationMs / 1000);
    } else if (lastSnapshotRef.current) {
      snapshot = lastSnapshotRef.current;
    } else {
      snapshot = {
        type: workoutType,
        count,
        valid: count > 0,
        durationMs: elapsedMs,
        paceMs,
        lastRepMs: lastEventMs,
        rejected,
        metadata: {},
      };
    }
    setPhase("done");
    onComplete(snapshot);
  };

  const handleCancel = () => {
    stopTracking();
    onCancel();
  };

  // ===== Computed =====
  const progressPct = isTimeBased
    ? Math.min(100, Math.round((elapsedMs / 1000 / targetValue) * 100))
    : Math.min(100, Math.round((count / targetValue) * 100));

  const xpEarned = isTimeBased
    ? Math.floor(elapsedMs / 60000) * 5  // 5 XP per minute
    : count * xpPerRep;

  const isComplete = isTimeBased
    ? Math.floor(elapsedMs / 1000) >= targetValue
    : count >= targetValue;

  const paceOk = paceMs === null || (paceMs >= 800 && paceMs <= 5000);

  return (
    <div
      className="fixed inset-0 z-[500] flex bg-black text-white overflow-y-auto"
      style={{
        WebkitOverflowScrolling: "touch",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div className="w-full flex flex-col min-h-dvh">

        {/* HEADER */}
        <div
          className="px-5 sm:px-7 py-4 border-b flex items-center gap-3 shrink-0"
          style={{ borderColor: "#1a1a1a", backgroundColor: "#0a0a0a" }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium tracking-[3px] uppercase text-zinc-500">
              {config.label} Tracker
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-tight truncate mt-0.5">
              {missionTitle}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1">
          {phase === "idle" ? (
            <IDLE_STATE
              config={config}
              workoutType={workoutType}
              permissionStatus={permissionStatus}
              targetValue={targetValue}
              xpPerRep={xpPerRep}
              xpEarned={xpEarned}
              isTimeBased={isTimeBased}
              hapticSupported={hapticSupported}
              onStart={startTracking}
              onCancel={handleCancel}
            />
          ) : (
            <TRACKING_STATE
              config={config}
              isTimeBased={isTimeBased}
              phase={phase}
              count={count}
              targetValue={targetValue}
              progressPct={progressPct}
              xpEarned={xpEarned}
              elapsedMs={elapsedMs}
              paceMs={paceMs}
              paceOk={paceOk}
              lastEventMs={lastEventMs}
              rejected={rejected}
              isComplete={isComplete}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStopAndSave}
              onManualRep={handleManualRep}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ===== IDLE STATE =====
const IDLE_STATE: React.FC<{
  config: typeof WORKOUT_CONFIG[WorkoutType];
  workoutType: WorkoutType;
  permissionStatus: string;
  targetValue: number;
  xpPerRep: number;
  xpEarned: number;
  isTimeBased: boolean;
  hapticSupported: boolean;
  onStart: () => void;
  onCancel: () => void;
}> = ({ config, workoutType, permissionStatus, targetValue, xpPerRep, xpEarned, isTimeBased, hapticSupported, onStart, onCancel }) => {
  const targetDisplay = isTimeBased
    ? `${Math.floor(targetValue / 60)} min ${targetValue % 60} sec`
    : `${targetValue} ${isTimeBased ? "sec" : "reps"}`;

  return (
    <div className="px-5 sm:px-7 py-6 max-w-xl mx-auto w-full">
      {/* Title */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-zinc-400" />
          <span className="text-[10px] font-medium tracking-[2.5px] uppercase text-zinc-500">
            How it works
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight mb-2">
          {config.icon} {isTimeBased ? "Hold the position" : "Place your phone. Get moving."}
        </h1>
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          Your phone's motion sensor will track every {isTimeBased ? "second" : "rep"} automatically.
          No camera. No AI upload. 100% private and offline.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {[
          { n: "1", t: config.phonePlacement.split(",")[0], d: config.phonePlacement.split(",").slice(1).join(",").trim() || "Tight fit for accurate sensor reading." },
          { n: "2", t: "Sensor will start", d: "Tap the button below to grant motion access and start tracking." },
          { n: "3", t: isTimeBased ? "Stay still" : "Begin your workout", d: isTimeBased ? "Minimize movement. The timer counts up while you hold the position." : "Each rep is detected automatically via the motion sensor." },
          { n: "4", t: "Reach your goal", d: `Hit ${targetDisplay} to complete the mission and earn XP.` },
        ].map((step) => (
          <div key={step.n} className="flex items-start gap-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-zinc-400 shrink-0 border"
              style={{ borderColor: "#2a2a2a" }}
            >
              {step.n}
            </div>
            <div className="flex-1 pt-0.5">
              <div className="text-[13px] font-semibold text-white leading-snug">
                {step.t}
              </div>
              <div className="text-[12px] text-zinc-500 leading-relaxed mt-0.5">
                {step.d}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detection method callout */}
      <div className="mb-6 p-3.5 rounded-lg" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Zap size={13} className="text-zinc-400" />
          <span className="text-[10px] font-medium tracking-[2px] uppercase text-zinc-500">
            Detection method
          </span>
        </div>
        <p className="text-[12px] text-zinc-400 leading-relaxed">
          {config.detection}
        </p>
      </div>

      {/* Permission warnings */}
      {permissionStatus === "denied" && (
        <div className="mb-4 p-3.5 rounded-lg" style={{ backgroundColor: "#1a0d0d", border: "1px solid #2a1414" }}>
          <div className="flex items-start gap-2.5">
            <AlertCircle size={15} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-zinc-300 leading-relaxed">
              <strong className="text-white">Motion permission denied.</strong> Enable motion access in browser settings. (iOS: Settings → Safari → Motion &amp; Orientation Access)
            </div>
          </div>
        </div>
      )}

      {permissionStatus === "unavailable" && (
        <div className="mb-4 p-3.5 rounded-lg" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
          <div className="flex items-start gap-2.5">
            <AlertCircle size={15} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-zinc-300 leading-relaxed">
              <strong className="text-white">Motion sensor not available.</strong> Please use a mobile device with motion sensors.
            </div>
          </div>
        </div>
      )}

      {!hapticSupported && (
        <p className="text-[10.5px] text-zinc-600 text-center mb-3">
          Haptic feedback is not available on this device
        </p>
      )}

      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 rounded-lg text-sm font-medium text-white border transition active:scale-[0.98]"
          style={{ borderColor: "#2a2a2a", backgroundColor: "transparent" }}
        >
          Cancel
        </button>
        <button
          onClick={onStart}
          disabled={permissionStatus !== "granted"}
          className="flex-1 py-3.5 rounded-lg text-sm font-semibold text-black transition active:scale-[0.98] disabled:opacity-30"
          style={{ backgroundColor: "#ffffff" }}
        >
          {permissionStatus === "granted" ? "Start tracking" : "Permission required"}
        </button>
      </div>
    </div>
  );
};

// ===== TRACKING STATE =====
const TRACKING_STATE: React.FC<{
  config: typeof WORKOUT_CONFIG[WorkoutType];
  isTimeBased: boolean;
  phase: Phase;
  count: number;
  targetValue: number;
  progressPct: number;
  xpEarned: number;
  elapsedMs: number;
  paceMs: number | null;
  paceOk: boolean;
  lastEventMs: number | null;
  rejected: number;
  isComplete: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onManualRep: () => void;
}> = ({
  config, isTimeBased, phase, count, targetValue, progressPct, xpEarned,
  elapsedMs, paceMs, paceOk, lastEventMs, rejected, isComplete,
  onPause, onResume, onStop, onManualRep,
}) => {
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const targetSec = isTimeBased ? targetValue : 0;
  const remainingSec = Math.max(0, targetSec - elapsedSec);

  return (
    <div className="px-5 sm:px-7 py-6 max-w-xl mx-auto w-full">

      {/* Big counter — different layout for time vs reps */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[10px] font-medium tracking-[2.5px] uppercase text-zinc-500">
            {isTimeBased ? "Time elapsed" : "Reps"}
          </div>
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-zinc-500">
            {isTimeBased
              ? `Target: ${formatCountdown(targetSec)}`
              : `of ${targetValue}`}
          </div>
        </div>

        {isTimeBased ? (
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-7xl sm:text-8xl font-semibold text-white tracking-tighter tabular-nums leading-none">
              {formatTime(elapsedMs)}
            </span>
            {remainingSec > 0 && (
              <span className="text-2xl sm:text-3xl font-light text-zinc-600 tabular-nums leading-none">
                /{formatCountdown(targetSec)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-7xl sm:text-8xl font-semibold text-white tracking-tighter tabular-nums leading-none">
              {count}
            </span>
            <span className="text-3xl sm:text-4xl font-light text-zinc-600 tabular-nums leading-none">
              /{targetValue}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-zinc-500 font-medium tabular-nums">
            {progressPct}% complete
          </span>
          <span className="text-[11px] text-zinc-500 font-medium tabular-nums">
            +{xpEarned} XP
          </span>
        </div>
      </div>

      {/* Status indicator for rep-based */}
      {!isTimeBased && (
        <div className="mb-5 py-2.5 px-3.5 rounded-lg flex items-center gap-2.5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: phase === "paused" ? "#52525b" : "#a1a1aa" }}
          />
          <div className="flex-1 text-[12.5px] font-medium text-zinc-300">
            {phase === "paused" ? "Paused" : isComplete ? "Goal reached — keep going or stop" : "Listening for motion..."}
          </div>
        </div>
      )}

      {/* Time-based still message */}
      {isTimeBased && (
        <div className="mb-5 py-2.5 px-3.5 rounded-lg flex items-center gap-2.5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
          <Clock size={14} className="text-zinc-400 shrink-0" />
          <div className="flex-1 text-[12.5px] font-medium text-zinc-300">
            {phase === "paused" ? "Paused — timer is on hold" : isComplete ? "Time's up! Save to earn XP." : "Hold the position. Minimize movement."}
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {isTimeBased ? (
          <>
            <MetricCard label="Time" value={formatTime(elapsedMs)} />
            <MetricCard label="Goal" value={formatCountdown(targetSec)} />
            <MetricCard label="Movements" value={String(rejected)} status={rejected > 3 ? "warn" : "neutral"} />
            <MetricCard label="XP earned" value={`+${xpEarned}`} />
          </>
        ) : (
          <>
            <MetricCard label="Pace" value={paceMs ? `${(paceMs / 1000).toFixed(1)}s` : "—"} status={paceMs === null ? "neutral" : paceOk ? "ok" : "warn"} />
            <MetricCard label="Last rep" value={lastEventMs ? `${(lastEventMs / 1000).toFixed(1)}s` : "—"} />
            <MetricCard label="Rejected" value={String(rejected)} status={rejected > 0 ? "warn" : "neutral"} />
            <MetricCard label="XP earned" value={`+${xpEarned}`} />
          </>
        )}
      </div>

      {/* Pace warning (rep only) */}
      {!isTimeBased && paceMs !== null && !paceOk && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
          <AlertCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Pace warning.</strong> Maintain a steady rhythm. Rushed reps are rejected as anti-cheat.
          </p>
        </div>
      )}

      {/* Rejected counter (rep only) */}
      {!isTimeBased && rejected > 0 && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
          <AlertCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{rejected} rep{rejected !== 1 ? "s" : ""} rejected</strong> — too fast or no movement detected. Slow down.
          </p>
        </div>
      )}

      {/* Movement warning (time only) */}
      {isTimeBased && rejected > 3 && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
          <AlertCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{rejected} movements detected.</strong> Hold the position more still to maximize XP.
          </p>
        </div>
      )}

      {/* Form verified */}
      {((!isTimeBased && count >= 3) || (isTimeBased && elapsedSec >= 10)) && (
        <div className="mb-5 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
          <CheckCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Form verified.</strong> Real movement and consistent pace detected.
          </p>
        </div>
      )}

      {/* Manual tap-to-count button (rep-based workouts only) */}
      {!isTimeBased && (
        <div className="mb-4">
          <button
            onClick={onManualRep}
            disabled={phase !== "running"}
            className="w-full py-5 rounded-2xl text-base font-extrabold text-black transition active:scale-[0.97] disabled:opacity-30"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 8px 24px rgba(255,255,255,0.15)",
            }}
          >
            +1 REP
          </button>
          <p
            className="text-[10.5px] text-center mt-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Sensor auto-counts. Tap button if it misses a rep.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        {phase === "running" ? (
          <button
            onClick={onPause}
            className="flex-1 py-3.5 rounded-lg text-sm font-medium text-white border transition active:scale-[0.98]"
            style={{ borderColor: "#2a2a2a", backgroundColor: "transparent" }}
          >
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            className="flex-1 py-3.5 rounded-lg text-sm font-medium text-white border transition active:scale-[0.98]"
            style={{ borderColor: "#2a2a2a", backgroundColor: "transparent" }}
          >
            Resume
          </button>
        )}
        <button
          onClick={onStop}
          className="flex-1 py-3.5 rounded-lg text-sm font-semibold text-black transition active:scale-[0.98]"
          style={{ backgroundColor: "#ffffff" }}
        >
          Save session
        </button>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  status?: "ok" | "warn" | "neutral";
}> = ({ label, value, status = "neutral" }) => {
  const valueColor =
    status === "ok" ? "text-zinc-100" :
    status === "warn" ? "text-zinc-300" :
    "text-white";
  return (
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}
    >
      <div className="text-[10px] font-medium tracking-[2px] uppercase text-zinc-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-semibold tracking-tight tabular-nums ${valueColor}`}>
        {value}
      </div>
    </div>
  );
};

export default WorkoutTracker;
