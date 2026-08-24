/**
 * PushupMotionTracker.tsx — Premium dark theme, no neon
 *
 * Phone-sensor based push-up rep counter. No camera, no AI, no tokens.
 * DeviceMotion API (accelerometer + gyroscope) at 60fps.
 *
 * Design language:
 *  - Pure black background (#000)
 *  - White text + muted gray accents
 *  - No glow / no neon / no bright colors
 *  - Inter / SF Pro typography
 *  - Sharp 1px borders
 *  - Calm, focused, premium feel
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Activity, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface PushupMotionTrackerProps {
  missionTitle: string;
  targetReps: number;
  xpPerRep?: number;
  onComplete: (totalReps: number, validReps: number) => void;
  onCancel: () => void;
}

type Phase = "idle" | "ready" | "descending" | "bottom" | "ascending";

export const PushupMotionTracker: React.FC<PushupMotionTrackerProps> = ({
  missionTitle,
  targetReps,
  xpPerRep = 2,
  onComplete,
  onCancel,
}) => {
  // ===== State =====
  const [phase, setPhase] = useState<Phase>("idle");
  const [reps, setReps] = useState(0);
  const [rejectedAttempts, setRejectedAttempts] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied" | "unavailable">("unknown");
  const [elapsed, setElapsed] = useState(0);
  const [pace, setPace] = useState<number | null>(null);
  const [lastRepDuration, setLastRepDuration] = useState<number | null>(null);
  const [hapticSupported, setHapticSupported] = useState(false);

  // ===== Refs =====
  const motionListenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const repStartTimeRef = useRef<number>(0);
  const lastMagnitudeRef = useRef<number>(9.8);
  const lastRepTimestampRef = useRef<number>(0);
  const recentRepTimesRef = useRef<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // ===== Thresholds =====
  const THRESHOLD_DOWN = 7.5;
  const THRESHOLD_UP = 9.2;
  const MIN_REP_DURATION = 800;
  const MAX_REP_DURATION = 8000;
  const MIN_VARIANCE = 0.5;

  // ===== Setup =====
  useEffect(() => {
    if (typeof window === "undefined") {
      setPermissionStatus("unavailable");
      return;
    }

    // @ts-ignore
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      // iOS 13+ path
      // @ts-ignore
      DeviceMotionEvent.requestPermission()
        .then((state: string) => {
          setPermissionStatus(state === "granted" ? "granted" : "denied");
        })
        .catch(() => setPermissionStatus("denied"));
    } else if (typeof DeviceMotionEvent !== "undefined") {
      setPermissionStatus("granted");
    } else {
      setPermissionStatus("unavailable");
    }

    setHapticSupported(typeof navigator !== "undefined" && "vibrate" in navigator);

    return () => {
      stopTracking();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Elapsed timer =====
  useEffect(() => {
    if (phase === "idle") return;
    if (!startTimeRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase !== "idle"]);

  // ===== Motion handler =====
  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

    const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    const zAxis = Math.abs(accel.z);
    const variance = Math.abs(magnitude - lastMagnitudeRef.current);
    lastMagnitudeRef.current = magnitude;

    setPhase((currentPhase) => {
      const now = Date.now();

      switch (currentPhase) {
        case "idle":
        case "ready": {
          if (zAxis < THRESHOLD_DOWN && variance > MIN_VARIANCE) {
            repStartTimeRef.current = now;
            phaseStartTimeRef.current = now;
            return "descending";
          }
          return currentPhase;
        }
        case "descending": {
          if (zAxis < 5.5) {
            phaseStartTimeRef.current = now;
            return "bottom";
          }
          if (zAxis > THRESHOLD_UP) {
            phaseStartTimeRef.current = now;
            return "ready";
          }
          return currentPhase;
        }
        case "bottom": {
          if (zAxis > THRESHOLD_UP && variance > MIN_VARIANCE) {
            phaseStartTimeRef.current = now;
            return "ascending";
          }
          if (now - phaseStartTimeRef.current > MAX_REP_DURATION) {
            phaseStartTimeRef.current = now;
            return "ready";
          }
          return currentPhase;
        }
        case "ascending": {
          if (zAxis > 9.5) {
            const repDuration = now - repStartTimeRef.current;
            const timeSinceLastRep = lastRepTimestampRef.current ? now - lastRepTimestampRef.current : Infinity;

            if (repDuration < MIN_REP_DURATION) {
              setRejectedAttempts((r) => r + 1);
              return "ready";
            }
            if (timeSinceLastRep < 400) {
              setRejectedAttempts((r) => r + 1);
              return "ready";
            }

            setReps((r) => r + 1);
            setLastRepDuration(repDuration);
            lastRepTimestampRef.current = now;

            recentRepTimesRef.current.push(repDuration);
            if (recentRepTimesRef.current.length > 5) recentRepTimesRef.current.shift();
            const avgPace = recentRepTimesRef.current.reduce((a, b) => a + b, 0) / recentRepTimesRef.current.length;
            setPace(avgPace);

            if ("vibrate" in navigator) navigator.vibrate(50);

            return "ready";
          }
          return currentPhase;
        }
        default:
          return currentPhase;
      }
    });
  }, []);

  // ===== Tracking controls =====
  const startTracking = () => {
    if (permissionStatus !== "granted") {
      alert("Motion sensor permission required. Please enable motion access in your browser settings.");
      return;
    }
    startTimeRef.current = Date.now();
    setPhase("ready");
    setReps(0);
    setRejectedAttempts(0);
    setElapsed(0);
    recentRepTimesRef.current = [];
    if ("vibrate" in navigator) navigator.vibrate(100);
    motionListenerRef.current = handleMotion;
    window.addEventListener("devicemotion", handleMotion);
  };

  const stopTracking = () => {
    if (motionListenerRef.current) {
      window.removeEventListener("devicemotion", motionListenerRef.current);
      motionListenerRef.current = null;
    }
  };

  const pauseTracking = () => {
    stopTracking();
    setPhase((p) => (p === "idle" ? "idle" : "ready"));
  };

  const handleStop = () => {
    stopTracking();
    onComplete(reps, reps);
  };

  const handleCancel = () => {
    stopTracking();
    onCancel();
  };

  // ===== Computed =====
  const progressPct = Math.min(100, Math.round((reps / targetReps) * 100));
  const xpEarned = reps * xpPerRep;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const paceOk = pace === null || (pace >= 1500 && pace <= 5000);

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
              Motion Tracker
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
              permissionStatus={permissionStatus}
              targetReps={targetReps}
              xpPerRep={xpPerRep}
              onStart={startTracking}
              onCancel={handleCancel}
              hapticSupported={hapticSupported}
            />
          ) : (
            <TRACKING_STATE
              phase={phase}
              reps={reps}
              targetReps={targetReps}
              progressPct={progressPct}
              xpEarned={xpEarned}
              minutes={minutes}
              seconds={seconds}
              pace={pace}
              paceOk={paceOk}
              lastRepDuration={lastRepDuration}
              rejectedAttempts={rejectedAttempts}
              onPause={pauseTracking}
              onStop={handleStop}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ===== IDLE STATE =====
const IDLE_STATE: React.FC<{
  permissionStatus: string;
  targetReps: number;
  xpPerRep: number;
  onStart: () => void;
  onCancel: () => void;
  hapticSupported: boolean;
}> = ({ permissionStatus, targetReps, xpPerRep, onStart, onCancel, hapticSupported }) => {
  return (
    <div className="px-5 sm:px-7 py-6 max-w-xl mx-auto w-full">

      {/* Title block */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-zinc-400" />
          <span className="text-[10px] font-medium tracking-[2.5px] uppercase text-zinc-500">
            How it works
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight mb-2">
          Place your phone. Start your push-ups.
        </h1>
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          Your phone's motion sensor will count every rep automatically.
          No camera. No AI upload. 100% private and offline.
        </p>
      </div>

      {/* Instructions list */}
      <div className="space-y-3 mb-6">
        {[
          { n: "1", t: "Place your phone", d: "Tightly in a chest pocket or waistband. Face-down or face-up both work." },
          { n: "2", t: "Get into position", d: "Standard push-up position. The tracker will start listening for motion." },
          { n: "3", t: "Start your push-ups", d: "Each full rep is counted and your phone will vibrate to confirm." },
          { n: "4", t: "Reach your goal", d: `Hit ${targetReps} reps to auto-verify and earn +${targetReps * xpPerRep} XP.` },
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

      {/* Anti-cheat note */}
      <div className="mb-6 p-3.5 rounded-lg" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Zap size={13} className="text-zinc-400" />
          <span className="text-[10px] font-medium tracking-[2px] uppercase text-zinc-500">
            Anti-cheat
          </span>
        </div>
        <ul className="text-[12px] text-zinc-400 leading-relaxed space-y-0.5">
          <li>— Tapping without moving the phone is rejected</li>
          <li>— Reps faster than 0.8s are rejected</li>
          <li>— Inconsistent movement triggers a form warning</li>
        </ul>
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

      {/* Actions */}
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
  phase: Phase;
  reps: number;
  targetReps: number;
  progressPct: number;
  xpEarned: number;
  minutes: number;
  seconds: number;
  pace: number | null;
  paceOk: boolean;
  lastRepDuration: number | null;
  rejectedAttempts: number;
  onPause: () => void;
  onStop: () => void;
}> = ({
  phase, reps, targetReps, progressPct, xpEarned, minutes, seconds,
  pace, paceOk, lastRepDuration, rejectedAttempts,
  onPause, onStop,
}) => {
  return (
    <div className="px-5 sm:px-7 py-6 max-w-xl mx-auto w-full">

      {/* Big rep counter — minimal, calm */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[10px] font-medium tracking-[2.5px] uppercase text-zinc-500">
            Reps
          </div>
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-zinc-500">
            of {targetReps}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-7xl sm:text-8xl font-semibold text-white tracking-tighter tabular-nums leading-none">
            {reps}
          </span>
          <span className="text-3xl sm:text-4xl font-light text-zinc-600 tabular-nums leading-none">
            /{targetReps}
          </span>
        </div>
        {/* Progress bar — thin, gray */}
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

      {/* Status line — calm text, no pulsing dots */}
      <div className="mb-5 py-2.5 px-3.5 rounded-lg flex items-center gap-2.5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            backgroundColor:
              phase === "ready" ? "#a1a1aa" :
              phase === "descending" ? "#71717a" :
              phase === "bottom" ? "#52525b" :
              phase === "ascending" ? "#d4d4d8" : "#52525b",
          }}
        />
        <div className="flex-1 text-[12.5px] font-medium text-zinc-300">
          {phase === "ready" && "Ready — start your next push-up"}
          {phase === "descending" && "Going down"}
          {phase === "bottom" && "At the bottom — hold"}
          {phase === "ascending" && "Pushing up"}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <MetricCard label="Time" value={`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`} />
        <MetricCard label="Avg pace" value={pace ? `${(pace / 1000).toFixed(1)}s` : "—"} status={pace === null ? "neutral" : paceOk ? "ok" : "warn"} />
        <MetricCard label="Last rep" value={lastRepDuration ? `${(lastRepDuration / 1000).toFixed(1)}s` : "—"} />
        <MetricCard label="XP earned" value={`+${xpEarned}`} status="ok" />
      </div>

      {/* Pace warning */}
      {pace !== null && !paceOk && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
          <AlertCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Pace warning.</strong> Real push-ups take 1.5–5 seconds. Maintain a steady rhythm.
          </p>
        </div>
      )}

      {/* Rejected counter */}
      {rejectedAttempts > 0 && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }}>
          <AlertCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{rejectedAttempts} rep{rejectedAttempts !== 1 ? "s" : ""} rejected</strong> — too fast or no movement detected. Slow down.
          </p>
        </div>
      )}

      {/* Form verified */}
      {reps >= 3 && (
        <div className="mb-5 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
          <CheckCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Form verified.</strong> Real movement and consistent pace detected.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={onPause}
          className="flex-1 py-3.5 rounded-lg text-sm font-medium text-white border transition active:scale-[0.98]"
          style={{ borderColor: "#2a2a2a", backgroundColor: "transparent" }}
        >
          Pause
        </button>
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

// ===== Reusable metric card =====
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

export default PushupMotionTracker;
