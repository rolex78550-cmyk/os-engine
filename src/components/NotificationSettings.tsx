/**
 * NotificationSettings.tsx — I AM Affirmation + Task Reminder UI
 *
 * Lets the user:
 *  - Grant notification permission (one-tap)
 *  - Schedule daily I AM affirmation at a chosen time
 *  - Schedule a task reminder at a chosen time
 *  - See all currently scheduled reminders
 *  - Cancel individual reminders
 *  - Send a test notification (5-second delay)
 *
 * Mounted as a card inside the Solo Dominion page (or as a
 * floating panel from the bell icon). Self-contained — manages its
 * own state, persists to localStorage via notificationService.
 */

import React, { useEffect, useState } from "react";
import {
  Bell, Sparkles, Clock, X, Plus, CheckCircle2, AlertCircle, Trash2, Send, TestTube2, ListChecks
} from "lucide-react";
import {
  isSupported,
  isServiceWorkerSupported,
  isIOSPWA,
  getPermissionState,
  requestPermission,
  loadUserSchedule,
  scheduleIAMAffirmation,
  scheduleTaskReminder,
  cancelByTag,
  testNotificationIn,
  type NotificationPermissionState,
  type ScheduledNotification,
} from "../lib/notificationService";

interface NotificationSettingsProps {
  /** Whether to render as a compact card (used in pages) or full
   *  panel (when opened from bell). Default compact. */
  variant?: "card" | "panel";
  /** Optional close handler (used when opened as overlay) */
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  variant = "card",
  onClose,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [supported, setSupported] = useState(true);
  const [swReady, setSwReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [schedule, setSchedule] = useState<ScheduledNotification[]>([]);
  const [iamTime, setIamTime] = useState("08:00");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("18:00");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    setSupported(isSupported());
    setSwReady(isServiceWorkerSupported());
    setIsIOS(isIOSPWA());
    setPermission(getPermissionState());
    setSchedule(loadUserSchedule());
  }, []);

  // Re-check permission on visibility change (user may toggle in browser)
  useEffect(() => {
    const handler = () => {
      setPermission(getPermissionState());
      setSchedule(loadUserSchedule());
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const showToast = (msg: string, kind: "ok" | "err" = "ok") => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRequestPermission = async () => {
    setBusy(true);
    const result = await requestPermission();
    setPermission(result);
    setBusy(false);
    if (result === "granted") showToast("🔔 Notifications enabled!");
    else if (result === "denied") showToast("❌ Blocked in browser settings", "err");
    else showToast("⚠️ Permission dismissed", "err");
  };

  const handleScheduleIAM = async () => {
    if (permission !== "granted") {
      showToast("🔔 Enable notifications first", "err");
      return;
    }
    setBusy(true);
    await scheduleIAMAffirmation(undefined, iamTime);
    setSchedule(loadUserSchedule());
    setBusy(false);
    showToast(`✨ I AM affirmation scheduled at ${iamTime}`);
  };

  const handleScheduleTask = async () => {
    if (permission !== "granted") {
      showToast("🔔 Enable notifications first", "err");
      return;
    }
    if (!taskTitle.trim()) {
      showToast("📝 Enter a task name", "err");
      return;
    }
    setBusy(true);
    await scheduleTaskReminder(
      taskTitle.trim(),
      "Don't forget to complete this quest today.",
      taskTime
    );
    setSchedule(loadUserSchedule());
    setTaskTitle("");
    setBusy(false);
    showToast(`📋 Reminder set at ${taskTime}`);
  };

  const handleTest = async () => {
    if (permission !== "granted") {
      showToast("🔔 Enable notifications first", "err");
      return;
    }
    await testNotificationIn(5);
    showToast("🧪 Test fires in 5 seconds…");
  };

  const handleCancel = async (item: ScheduledNotification) => {
    await cancelByTag(item.tag);
    const next = loadUserSchedule().filter((n) => n.id !== item.id);
    saveUserScheduleLocal(next);
    setSchedule(next);
    showToast("🗑 Reminder removed");
  };

  // Helper to save local schedule (avoids circular import)
  const saveUserScheduleLocal = (items: ScheduledNotification[]) => {
    try {
      localStorage.setItem("menifest_notification_schedule_v1", JSON.stringify(items));
    } catch {}
  };

  // Unavailable on this device
  if (!supported) {
    return (
      <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06] text-center text-[12px] text-white/40">
        Notifications aren't supported on this device/browser.
      </div>
    );
  }

  const iOSHint = isIOS ? (
    <div className="text-[10px] text-amber-300/80 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-2 leading-relaxed">
      📱 <strong>iOS tip:</strong> For background notifications, tap Share → "Add to Home Screen", then open from there.
    </div>
  ) : null;

  // ========== RENDER ==========
  return (
    <div
      className={
        variant === "card"
          ? "rounded-2xl bg-black/40 border border-white/[0.06] p-4 space-y-3"
          : "fixed inset-0 z-[400] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md"
      }
    >
      {variant === "panel" ? (
        <div
          className="w-full max-w-md rounded-3xl bg-[#0a0b10] border border-white/[0.08] shadow-2xl flex flex-col"
          style={{ maxHeight: "min(720px, calc(100vh - 32px))" }}
        >
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3 sticky top-0 bg-[#0a0b10] rounded-t-3xl z-10">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Bell size={15} className="text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-white tracking-tight">Notifications</h3>
              <p className="text-[10px] text-white/45">I AM affirmations · Task reminders</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/55 hover:text-white rounded-full hover:bg-white/[0.06]"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {renderBody()}
          </div>
        </div>
      ) : (
        renderBody()
      )}
    </div>
  );

  function renderBody() {
    return (
      <>
        {/* Toast */}
        {toast && (
          <div
            className="text-[11px] font-medium px-3 py-1.5 rounded-full text-center mx-auto"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: toast.includes("❌") || toast.includes("⚠️") ? "#fca5a5" : "#86efac",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {toast}
          </div>
        )}

        {/* Permission card */}
        <div
          className="rounded-2xl p-3.5 border"
          style={{
            backgroundColor:
              permission === "granted"
                ? "rgba(16,185,129,0.06)"
                : permission === "denied"
                ? "rgba(239,68,68,0.06)"
                : "rgba(255,255,255,0.03)",
            borderColor:
              permission === "granted"
                ? "rgba(16,185,129,0.25)"
                : permission === "denied"
                ? "rgba(239,68,68,0.25)"
                : "rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor:
                  permission === "granted" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
              }}
            >
              {permission === "granted" ? (
                <CheckCircle2 size={17} className="text-emerald-400" />
              ) : permission === "denied" ? (
                <AlertCircle size={17} className="text-rose-400" />
              ) : (
                <Bell size={17} className="text-white/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-white tracking-tight">
                {permission === "granted"
                  ? "Notifications enabled"
                  : permission === "denied"
                  ? "Notifications blocked"
                  : "Enable push notifications"}
              </div>
              <div className="text-[10.5px] text-white/45 leading-snug mt-0.5">
                {permission === "granted"
                  ? "I AM affirmations + task reminders will arrive on time."
                  : permission === "denied"
                  ? "Open browser settings to allow notifications."
                  : "Tap below to allow. We'll only ping for affirmations + tasks."}
              </div>
            </div>
            {permission !== "granted" && (
              <button
                onClick={handleRequestPermission}
                disabled={busy}
                className="px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {permission === "denied" ? "Retry" : "Allow"}
              </button>
            )}
          </div>
        </div>

        {iOSHint}

        {/* I AM affirmation scheduler */}
        <div
          className="rounded-2xl p-3.5 border border-white/[0.06] space-y-2.5"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-300" />
            <span className="text-[12px] font-semibold text-white">I AM Affirmation</span>
            <span className="ml-auto text-[10px] text-white/40">Daily</span>
          </div>
          <p className="text-[10.5px] text-white/50 leading-snug">
            Receive a powerful I AM statement every morning to align your identity with your goals.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 bg-white/[0.04] rounded-lg px-2.5 py-2">
              <Clock size={12} className="text-white/45" />
              <input
                type="time"
                value={iamTime}
                onChange={(e) => setIamTime(e.target.value)}
                className="bg-transparent text-[12px] text-white outline-none flex-1"
              />
            </div>
            <button
              onClick={handleScheduleIAM}
              disabled={busy || permission !== "granted"}
              className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] font-semibold hover:bg-amber-500/25 transition-colors disabled:opacity-40"
            >
              Schedule
            </button>
          </div>
        </div>

        {/* Task reminder */}
        <div
          className="rounded-2xl p-3.5 border border-white/[0.06] space-y-2.5"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-2">
            <ListChecks size={14} className="text-emerald-300" />
            <span className="text-[12px] font-semibold text-white">Task Reminder</span>
            <span className="ml-auto text-[10px] text-white/40">Daily</span>
          </div>
          <p className="text-[10.5px] text-white/50 leading-snug">
            Get a daily nudge to complete your most important quest.
          </p>
          <input
            type="text"
            placeholder="e.g. 50 push-ups"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full bg-white/[0.04] rounded-lg px-3 py-2 text-[12px] text-white placeholder-white/30 outline-none focus:bg-white/[0.06]"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 bg-white/[0.04] rounded-lg px-2.5 py-2">
              <Clock size={12} className="text-white/45" />
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="bg-transparent text-[12px] text-white outline-none flex-1"
              />
            </div>
            <button
              onClick={handleScheduleTask}
              disabled={busy || permission !== "granted" || !taskTitle.trim()}
              className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11px] font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
            >
              Schedule
            </button>
          </div>
        </div>

        {/* Active schedule list */}
        {schedule.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold text-white/55 tracking-widest uppercase">
                Active ({schedule.length})
              </span>
              <button
                onClick={handleTest}
                disabled={permission !== "granted"}
                className="text-[10px] text-white/45 hover:text-white flex items-center gap-1 disabled:opacity-30"
                title="Send a test notification in 5s"
              >
                <TestTube2 size={10} /> Test
              </button>
            </div>
            {schedule.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/[0.06]"
                style={{ backgroundColor: "rgba(255,255,255,0.025)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      item.type === "iam" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                  }}
                >
                  {item.type === "iam" ? (
                    <Sparkles size={12} className="text-amber-300" />
                  ) : (
                    <ListChecks size={12} className="text-emerald-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-white/45 truncate">
                    {item.repeat === "daily" ? "Daily" : "Once"} · {item.timeOfDay}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(item)}
                  className="p-1 text-white/35 hover:text-rose-400 transition-colors"
                  aria-label="Cancel reminder"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer hint */}
        {!swReady && (
          <p className="text-[10px] text-white/35 leading-relaxed px-1">
            Service workers not available in this browser — scheduled reminders may not fire when the app is closed. Foreground reminders will still work.
          </p>
        )}
      </>
    );
  }
};

export default NotificationSettings;
