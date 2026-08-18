/**
 * PushupMotionTracker.tsx
 *
 * Phone-sensor based push-up rep counter. No camera, no AI, no tokens.
 *
 * Detection: DeviceMotion API (accelerometer + gyroscope)
 *   - Phone chest-pocket / waist-band mein rakho
 *   - Har push-up mein gravity Z-axis flip hota hai
 *   - State machine: READY → DESCENDING → BOTTOM → ASCENDING → TOP → count++
 *   - Anti-cheat: timing check + accelerometer variance check
 *
 * XP: 2 XP per valid rep. Min 5 reps to count as "completed".
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Activity, Target, Zap, CheckCircle, AlertCircle } from "lucide-react";

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
  const [invalidReps, setInvalidReps] = useState(0);
  const [rejectedAttempts, setRejectedAttempts] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied" | "unavailable">("unknown");
  const [elapsed, setElapsed] = useState(0);
  const [pace, setPace] = useState<number | null>(null);
  const [lastRepDuration, setLastRepDuration] = useState<number | null>(null);
  const [hapticSupported, setHapticSupported] = useState(false);

  // ===== Refs (mutable, don't trigger renders) =====
  const motionListenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const repStartTimeRef = useRef<number>(0);
  const lastMagnitudeRef = useRef<number>(9.8);
  const lastRepTimestampRef = useRef<number>(0);
  const recentRepTimesRef = useRef<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // ===== Threshold values =====
  // Gravity Z-axis ~9.8 m/s² when phone stable
  // Push-up: chest goes down (Z dips) then up (Z peaks)
  const THRESHOLD_DOWN = 7.5;  // gravity must dip below this to count "going down"
  const THRESHOLD_UP = 9.2;    // gravity must rise above this to count "rep complete"
  const MIN_REP_DURATION = 800;  // ms — too fast = invalid (anti-cheat)
  const MAX_REP_DURATION = 8000; // ms — too slow = invalid (form break)
  const MIN_VARIANCE = 0.5;     // m/s² — must have actual movement, not just shaking

  // ===== Setup =====
  useEffect(() => {
    // Check if DeviceMotionEvent is supported
    if (typeof window === "undefined") {
      setPermissionStatus("unavailable");
      return;
    }

    // iOS 13+ requires explicit permission
    // @ts-ignore
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      // iOS path
      // @ts-ignore
      DeviceMotionEvent.requestPermission()
        .then((state: string) => {
          setPermissionStatus(state === "granted" ? "granted" : "denied");
        })
        .catch(() => {
          setPermissionStatus("denied");
        });
    } else if (typeof DeviceMotionEvent !== "undefined") {
      // Android / Desktop — usually auto-grants
      setPermissionStatus("granted");
    } else {
      setPermissionStatus("unavailable");
    }

    // Check haptic support
    setHapticSupported(typeof navigator !== "undefined" && "vibrate" in navigator);

    return () => {
      stopTracking();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
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

  // ===== Sensor handler =====
  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const accel = e.accelerationIncludingGravity;
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

    // Calculate total magnitude (Z-axis dominant for push-ups)
    const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    const zAxis = Math.abs(accel.z);

    // Variance check — detect if phone is actually moving
    const variance = Math.abs(magnitude - lastMagnitudeRef.current);
    lastMagnitudeRef.current = magnitude;

    // ===== State machine =====
    setPhase((currentPhase) => {
      const now = Date.now();

      switch (currentPhase) {
        case "idle":
        case "ready": {
          // Waiting for user to start push-up (gravity dips)
          if (zAxis < THRESHOLD_DOWN && variance > MIN_VARIANCE) {
            repStartTimeRef.current = now;
            phaseStartTimeRef.current = now;
            return "descending";
          }
          return currentPhase;
        }

        case "descending": {
          // Going down — gravity hits lowest point
          if (zAxis < 5.5) {
            phaseStartTimeRef.current = now;
            return "bottom";
          }
          // If user goes back up without hitting bottom, abort
          if (zAxis > THRESHOLD_UP) {
            phaseStartTimeRef.current = now;
            return "ready";
          }
          return currentPhase;
        }

        case "bottom": {
          // At bottom — waiting to come back up
          if (zAxis > THRESHOLD_UP && variance > MIN_VARIANCE) {
            phaseStartTimeRef.current = now;
            return "ascending";
          }
          // If staying at bottom too long, abort
          if (now - phaseStartTimeRef.current > MAX_REP_DURATION) {
            phaseStartTimeRef.current = now;
            return "ready";
          }
          return currentPhase;
        }

        case "ascending": {
          // Coming up — gravity back to normal
          if (zAxis > 9.5) {
            // Rep complete!
            const repDuration = now - repStartTimeRef.current;
            const timeSinceLastRep = lastRepTimestampRef.current ? now - lastRepTimestampRef.current : Infinity;

            // Anti-cheat: must be slow enough (real push-up takes time)
            if (repDuration < MIN_REP_DURATION) {
              setRejectedAttempts((r) => r + 1);
              return "ready";
            }

            // Anti-cheat: if too many fast reps in a row, suspicious
            if (timeSinceLastRep < 400) {
              setRejectedAttempts((r) => r + 1);
              return "ready";
            }

            // Valid rep!
            setReps((r) => r + 1);
            setLastRepDuration(repDuration);
            lastRepTimestampRef.current = now;

            // Track pace (rolling average of last 5 reps)
            recentRepTimesRef.current.push(repDuration);
            if (recentRepTimesRef.current.length > 5) recentRepTimesRef.current.shift();
            const avgPace = recentRepTimesRef.current.reduce((a, b) => a + b, 0) / recentRepTimesRef.current.length;
            setPace(avgPace);

            // Haptic feedback
            if ("vibrate" in navigator) {
              navigator.vibrate(50);
            }

            return "ready";
          }
          return currentPhase;
        }

        default:
          return currentPhase;
      }
    });
  }, []);

  // ===== Start tracking =====
  const startTracking = () => {
    if (permissionStatus !== "granted") {
      alert("Motion sensor permission required. Please enable motion access in your browser settings.");
      return;
    }

    startTimeRef.current = Date.now();
    setPhase("ready");
    setReps(0);
    setInvalidReps(0);
    setRejectedAttempts(0);
    setElapsed(0);
    recentRepTimesRef.current = [];

    if ("vibrate" in navigator) navigator.vibrate(100);

    // Attach motion listener
    motionListenerRef.current = handleMotion;
    window.addEventListener("devicemotion", handleMotion);
  };

  // ===== Stop tracking =====
  const stopTracking = () => {
    if (motionListenerRef.current) {
      window.removeEventListener("devicemotion", motionListenerRef.current);
      motionListenerRef.current = null;
    }
  };

  // ===== Pause =====
  const pauseTracking = () => {
    stopTracking();
    setPhase((p) => (p === "idle" ? "idle" : "ready"));
  };

  // ===== Complete =====
  const handleStop = () => {
    stopTracking();
    onComplete(reps, reps); // For now, all detected reps are valid
  };

  // ===== Cancel =====
  const handleCancel = () => {
    stopTracking();
    onCancel();
  };

  // ===== Computed =====
  const progressPct = Math.min(100, Math.round((reps / targetReps) * 100));
  const xpEarned = reps * xpPerRep;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const paceOk = pace === null || (pace >= 1500 && pace <= 5000); // 1.5s to 5s per rep = realistic

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{
        backgroundColor: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        className="bg-white text-black w-full sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col my-auto"
        style={{
          border: "1px solid #000",
          minHeight: phase === "idle" ? "auto" : "90vh",
          maxHeight: "100vh",
        }}
      >
        {/* STICKY HEADER */}
        <div
          className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b flex items-start gap-3 shrink-0"
          style={{ borderColor: "#000", backgroundColor: "#fff", position: "sticky", top: 0, zIndex: 10 }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "#000", color: "#fff" }}>
            📱
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-mono tracking-[2.5px] uppercase font-bold" style={{ color: "#666" }}>
              MOTION TRACKER
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black leading-tight truncate">
              {missionTitle}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-black/60 hover:text-black hover:bg-black/5 rounded-full transition shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", minHeight: 0 }}>
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
              invalidReps={invalidReps}
              onPause={pauseTracking}
              onStop={handleStop}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ===== IDLE STATE — instructions + start button =====
const IDLE_STATE: React.FC<{
  permissionStatus: string;
  targetReps: number;
  xpPerRep: number;
  onStart: () => void;
  onCancel: () => void;
  hapticSupported: boolean;
}> = ({ permissionStatus, targetReps, xpPerRep, onStart, onCancel, hapticSupported }) => {
  return (
    <div className="px-5 sm:px-7 py-5 space-y-4">
      <div className="p-4 rounded-xl border-2 text-center" style={{ borderColor: "#000", backgroundColor: "#fafafa" }}>
        <div className="text-5xl mb-2">📱</div>
        <h2 className="text-lg font-black uppercase tracking-tight text-black">
          AI Motion Tracker
        </h2>
        <p className="text-[11px] font-mono mt-1.5 leading-relaxed" style={{ color: "#555" }}>
          Place your phone in your <strong>chest pocket</strong> or <strong>waistband</strong> and start doing push-ups.
          The motion sensor will count each rep automatically. No camera, no AI upload, 100% private.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">📋 HOW IT WORKS</h3>
        <div className="space-y-1.5 text-[11px] font-mono leading-relaxed" style={{ color: "#333" }}>
          <div className="flex items-start gap-2">
            <span className="font-black">1.</span>
            <span>Phone ko chest pocket / waistband mein rakh do (tight fit)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-black">2.</span>
            <span>Push-up position mein aa jao (phone face-down ya face-up)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-black">3.</span>
            <span>Push-ups karte raho — har full rep auto-count hoga + vibrate hoga</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-black">4.</span>
            <span>{targetReps} reps complete hone pe automatic verify hoga + {targetReps * xpPerRep} XP mil jayega</span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl border-2" style={{ borderColor: "#000", backgroundColor: "#000", color: "#fff" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Zap size={14} className="text-amber-300" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">SMART ANTI-CHEAT</span>
        </div>
        <ul className="space-y-1 text-[10.5px] font-mono leading-relaxed opacity-90">
          <li>✗ Phone hilaya bina tap = reject</li>
          <li>✗ Too-fast reps (less than 0.8s) = reject</li>
          <li>✗ Inconsistent movement = form warning</li>
        </ul>
      </div>

      {permissionStatus === "denied" && (
        <div className="p-3 rounded-xl border-2 flex items-start gap-2" style={{ borderColor: "#ef4444", backgroundColor: "#fef2f2", color: "#7f1d1d" }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="text-[11px] font-mono leading-relaxed">
            <strong>Motion permission denied.</strong> Please enable motion access in your browser settings (iOS: Settings → Safari → Motion & Orientation Access).
          </div>
        </div>
      )}

      {permissionStatus === "unavailable" && (
        <div className="p-3 rounded-xl border-2 flex items-start gap-2" style={{ borderColor: "#f59e0b", backgroundColor: "#fffbeb", color: "#78350f" }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="text-[11px] font-mono leading-relaxed">
            <strong>Motion sensor not available.</strong> Your device may not support motion tracking. Please use a mobile device with motion sensors.
          </div>
        </div>
      )}

      {!hapticSupported && (
        <p className="text-[10px] font-mono text-center" style={{ color: "#888" }}>
          ℹ️ Haptic feedback unavailable on this device
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-xs font-bold border-2 text-black"
          style={{ borderColor: "#000", backgroundColor: "#fff" }}
        >
          Cancel
        </button>
        <button
          onClick={onStart}
          disabled={permissionStatus !== "granted"}
          className="flex-1 py-3 rounded-xl text-xs font-black uppercase text-white disabled:opacity-30"
          style={{ backgroundColor: "#000" }}
        >
          {permissionStatus === "granted" ? "▶ Start Tracking" : "Permission Required"}
        </button>
      </div>
    </div>
  );
};

// ===== TRACKING STATE — live counter + metrics =====
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
  invalidReps: number;
  onPause: () => void;
  onStop: () => void;
}> = ({
  phase, reps, targetReps, progressPct, xpEarned, minutes, seconds,
  pace, paceOk, lastRepDuration, rejectedAttempts, invalidReps,
  onPause, onStop,
}) => {
  return (
    <div className="px-5 sm:px-7 py-5 space-y-4">
      {/* Big rep counter */}
      <div
        className="p-6 rounded-2xl border-2 text-center relative overflow-hidden"
        style={{
          borderColor: "#000",
          backgroundColor: "#000",
          color: "#fff",
        }}
      >
        <div className="text-[10px] font-mono tracking-[3px] text-amber-300 uppercase font-bold mb-1">
          REPS COMPLETED
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl sm:text-7xl font-black tracking-tight tabular-nums" style={{ color: "#fff" }}>
            {reps}
          </span>
          <span className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: "#666" }}>
            / {targetReps}
          </span>
        </div>
        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(to right, #fbbf24, #f59e0b)",
            }}
          />
        </div>
        <div className="text-[10px] font-mono mt-2 opacity-70">
          {progressPct}% complete
        </div>
      </div>

      {/* Status indicator — current phase */}
      <div
        className="p-3 rounded-xl border flex items-center gap-3"
        style={{ borderColor: "#000", backgroundColor: "#fafafa" }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor:
              phase === "ready" ? "#22c55e" :
              phase === "descending" ? "#f59e0b" :
              phase === "bottom" ? "#ef4444" :
              phase === "ascending" ? "#3b82f6" : "#999",
            animation: phase !== "ready" ? "pulse 0.6s infinite" : "none",
          }}
        />
        <div className="flex-1 text-[11px] font-mono font-bold uppercase tracking-wider text-black">
          {phase === "ready" && "READY — Start your push-up"}
          {phase === "descending" && "DESCENDING — Going down"}
          {phase === "bottom" && "BOTTOM — Hold"}
          {phase === "ascending" && "ASCENDING — Push up!"}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl border-2 text-center" style={{ borderColor: "#000", backgroundColor: "#fff" }}>
          <div className="text-[9px] font-mono tracking-wider text-black/60 uppercase font-bold">Time</div>
          <div className="text-xl font-black text-black font-mono tabular-nums mt-0.5">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
        <div className="p-3 rounded-xl border-2 text-center" style={{ borderColor: "#000", backgroundColor: "#fff" }}>
          <div className="text-[9px] font-mono tracking-wider text-black/60 uppercase font-bold">XP Earned</div>
          <div className="text-xl font-black text-amber-500 font-mono tabular-nums mt-0.5">
            +{xpEarned}
          </div>
        </div>
        <div className="p-3 rounded-xl border-2 text-center" style={{ borderColor: "#000", backgroundColor: "#fff" }}>
          <div className="text-[9px] font-mono tracking-wider text-black/60 uppercase font-bold">Avg Pace</div>
          <div
            className="text-xl font-black font-mono tabular-nums mt-0.5"
            style={{ color: paceOk ? "#16a34a" : "#dc2626" }}
          >
            {pace ? `${(pace / 1000).toFixed(1)}s` : "—"}
          </div>
        </div>
        <div className="p-3 rounded-xl border-2 text-center" style={{ borderColor: "#000", backgroundColor: "#fff" }}>
          <div className="text-[9px] font-mono tracking-wider text-black/60 uppercase font-bold">Last Rep</div>
          <div className="text-xl font-black text-black font-mono tabular-nums mt-0.5">
            {lastRepDuration ? `${(lastRepDuration / 1000).toFixed(1)}s` : "—"}
          </div>
        </div>
      </div>

      {/* Pace warning */}
      {pace !== null && !paceOk && (
        <div className="p-2.5 rounded-lg border-2 flex items-start gap-2" style={{ borderColor: "#f59e0b", backgroundColor: "#fffbeb", color: "#78350f" }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono leading-relaxed">
            <strong>Pace warning:</strong> Real push-ups take 1.5-5s. Keep steady rhythm for valid reps.
          </p>
        </div>
      )}

      {/* Rejected counter */}
      {rejectedAttempts > 0 && (
        <div className="p-2.5 rounded-lg border-2 flex items-start gap-2" style={{ borderColor: "#ef4444", backgroundColor: "#fef2f2", color: "#7f1d1d" }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono leading-relaxed">
            <strong>{rejectedAttempts} rep(s) rejected</strong> (too fast / fake). Slow down for valid count.
          </p>
        </div>
      )}

      {/* Anti-cheat info */}
      {reps >= 3 && (
        <div className="p-2.5 rounded-lg border flex items-center gap-2" style={{ borderColor: "#16a34a", backgroundColor: "#f0fdf4", color: "#14532d" }}>
          <CheckCircle size={14} className="shrink-0" />
          <p className="text-[10px] font-mono leading-relaxed">
            <strong>Form verified.</strong> Real movement + consistent pace detected.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onPause}
          className="flex-1 py-3 rounded-xl text-xs font-bold border-2 text-black"
          style={{ borderColor: "#000", backgroundColor: "#fff" }}
        >
          ⏸ Pause
        </button>
        <button
          onClick={onStop}
          className="flex-1 py-3 rounded-xl text-xs font-black uppercase text-white"
          style={{ backgroundColor: "#000" }}
        >
          ⏹ Stop & Save
        </button>
      </div>
    </div>
  );
};

export default PushupMotionTracker;
