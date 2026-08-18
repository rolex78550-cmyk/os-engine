/**
 * notificationService.ts — Menifest OS Notification Manager
 *
 * Provides a clean TypeScript API around the browser's Notification
 * API + Service Worker postMessage for scheduled notifications.
 *
 * Public API:
 *   - isSupported():          Can the device show notifications?
 *   - getPermissionState():   'default' | 'granted' | 'denied'
 *   - requestPermission():    Resolves with the new permission state.
 *   - showNow(title, body, opts)            — fire one notification immediately
 *   - schedule(title, body, opts)          — fire after `delayMs`
 *   - scheduleIAMAffirmation(message, time) — schedule a daily I AM
 *   - scheduleTaskReminder(taskTitle, time) — schedule a task reminder
 *   - cancelByTag(tag)        — cancel a previously scheduled notification
 *   - loadUserSchedule() / saveUserSchedule()
 *                               — localStorage persistence for user schedule
 *
 * Notes:
 *  - iOS Safari only supports notifications when the PWA is added to
 *    the home screen (iOS 16.4+). We detect and surface a hint.
 *  - The service worker handles scheduling so notifications fire even
 *    if the app is backgrounded. Without a registered SW, only
 *    foreground notifications work.
 */

const STORAGE_KEY = "menifest_notification_schedule_v1";

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  /** Vibration pattern. Note: only honored by service-worker-based
   *  notifications (mobile). Foreground Notification API ignores it. */
  vibrate?: number[];
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
}

export interface ScheduledNotification {
  id: string;            // stable id (random uuid-ish)
  type: "iam" | "task" | "custom";
  title: string;
  body: string;
  // When to fire (epoch ms). For daily repeating items, the app
  // re-schedules after each fire.
  fireAt: number;
  tag: string;
  // Optional metadata (e.g. questId for task reminders)
  meta?: Record<string, any>;
  // Repeat pattern: 'once' | 'daily'
  repeat?: "once" | "daily";
  // Time-of-day (HH:MM) for daily repeats — used to recompute fireAt
  timeOfDay?: string;
}

const I_AM_LIBRARY = [
  "I AM disciplined. I AM unstoppable. I AM the architect of my reality.",
  "I AM focused. I AM consistent. I AM building my legacy one day at a time.",
  "I AM the shadow monarch of my own life. Every action counts.",
  "I AM worthy of the success I seek. Discipline is my path.",
  "I AM calm, confident, and in control of my focus.",
  "I AM energy in motion. I choose to show up today.",
  "I AM not behind. I AM exactly where I need to be, starting now.",
  "I AM a hunter. I track what matters. I slay what doesn't.",
  "I AM the upgrade. Every rep, every page, every decision.",
  "I AM becoming the man the universe needs me to be.",
  "I AM sovereign. My habits are my kingdom.",
  "I AM powerful beyond measure when I do the work.",
  "I AM silence in the chaos. I AM progress in the struggle.",
  "I AM a creator, not a consumer. I build, I write, I ship.",
  "I AM worthy of respect because I respect the process.",
  "I AM a master of the small things. That is how empires are built.",
  "I AM in command of my mind. Nothing breaks my focus.",
  "I AM grateful for the struggle — it's forging me.",
  "I AM wealthy in discipline, and the rest will follow.",
  "I AM the 1% better, every single day.",
];

/* === Capability detection === */

export function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

export function isServiceWorkerSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "serviceWorker" in navigator;
}

/** Best-effort iOS PWA detection (iOS 16.4+ supports notifications
 *  only when the PWA is added to the home screen). */
export function isIOSPWA(): boolean {
  if (typeof window === "undefined") return false;
  // iOS reports standalone mode when running as installed PWA
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-ignore — iOS-specific
    (typeof navigator.standalone === "boolean" && navigator.standalone);
  const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  return !!(isStandalone && isApple);
}

export function getPermissionState(): NotificationPermissionState {
  if (!isSupported()) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

export async function requestPermission(): Promise<NotificationPermissionState> {
  if (!isSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return "denied";
  }
}

/* === Immediate notification (foreground) === */

export function showNow(title: string, body: string, opts: NotificationOptions = {}): void {
  if (!isSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    // Standard `NotificationOptions` doesn't include `vibrate`; we cast
    // to any so we can attach it (browsers ignore unsupported keys).
    new Notification(title, {
      body,
      icon: opts.icon || "/icons/icon-192.png",
      badge: opts.badge || "/icons/icon-192.png",
      tag: opts.tag,
      data: { url: opts.url || "/" },
      ...(opts.vibrate ? { vibrate: opts.vibrate } : {}),
    } as any);
  } catch (err) {
    // iOS Safari may throw if not in PWA mode — silently ignore
    console.warn("[notifications] showNow failed:", err);
  }
}

/* === Scheduled notifications (via Service Worker) === */

let cachedController: ServiceWorker | null = null;

async function getController(): Promise<ServiceWorker | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (cachedController) return cachedController;
  try {
    // Wait for the active SW if not yet controlling
    if (!navigator.serviceWorker.controller) {
      await navigator.serviceWorker.ready;
    }
    cachedController = navigator.serviceWorker.controller || null;
    return cachedController;
  } catch {
    return null;
  }
}

export async function schedule(
  title: string,
  body: string,
  fireAt: number | Date,
  opts: NotificationOptions & { tag?: string } = {}
): Promise<{ ok: boolean; reason?: string; fireAt: number }> {
  const fireAtMs = fireAt instanceof Date ? fireAt.getTime() : fireAt;
  const delayMs = Math.max(0, fireAtMs - Date.now());
  if (delayMs > 24 * 60 * 60 * 1000) {
    return {
      ok: false,
      reason: "Cannot schedule more than 24h ahead (browser limit).",
      fireAt: fireAtMs,
    };
  }
  const controller = await getController();
  if (!controller) {
    // Fallback: just fire the notification now (no scheduling)
    if (delayMs < 200) showNow(title, body, opts);
    return {
      ok: false,
      reason: "Service worker not available — fired immediately.",
      fireAt: fireAtMs,
    };
  }
  controller.postMessage({
    type: "show-notification",
    payload: {
      title,
      body,
      delayMs,
      icon: opts.icon || "/icons/icon-192.png",
      badge: opts.badge || "/icons/icon-192.png",
      tag: opts.tag,
      url: opts.url || "/",
      vibrate: opts.vibrate || [200, 100, 200, 100, 400],
      requireInteraction: opts.requireInteraction,
      actions: opts.actions,
    },
  });
  return { ok: true, fireAt: fireAtMs };
}

export async function cancelByTag(tag: string): Promise<void> {
  const controller = await getController();
  if (!controller) return;
  controller.postMessage({ type: "cancel-notification", tag });
}

/* === User schedule persistence === */

export function loadUserSchedule(): ScheduledNotification[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserSchedule(items: ScheduledNotification[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

/* === I AM affirmations === */

/** Pick a random I AM affirmation (rotates daily if you want). */
export function pickIAMAffirmation(seedDate?: Date): string {
  const d = seedDate || new Date();
  // Use day-of-year as seed so the same affirmation appears all day
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = (d.getTime() - start.getTime()) / 86400000;
  const idx = Math.floor(diff) % I_AM_LIBRARY.length;
  return I_AM_LIBRARY[idx];
}

/** Schedule a daily I AM affirmation at the given time-of-day (HH:MM). */
export async function scheduleIAMAffirmation(
  message: string = pickIAMAffirmation(),
  timeOfDay: string = "08:00",
  repeat: "daily" = "daily"
): Promise<ScheduledNotification> {
  const fireAt = nextOccurrence(timeOfDay);
  const id = `iam-${Date.now()}`;
  const item: ScheduledNotification = {
    id,
    type: "iam",
    title: "I AM Affirmation",
    body: message,
    fireAt,
    tag: `iam-${timeOfDay}`,
    repeat,
    timeOfDay,
    meta: { message },
  };
  await schedule(item.title, item.body, fireAt, {
    tag: item.tag,
    url: "/?tab=streaks",
  });
  // Persist + return
  const all = loadUserSchedule().filter((n) => n.id !== id);
  all.push(item);
  saveUserSchedule(all);
  return item;
}

/* === Task reminders === */

export async function scheduleTaskReminder(
  taskTitle: string,
  taskDesc: string,
  timeOfDay: string = "18:00",
  repeat: "daily" = "daily",
  questId?: string
): Promise<ScheduledNotification> {
  const fireAt = nextOccurrence(timeOfDay);
  const id = `task-${questId || Date.now()}`;
  const item: ScheduledNotification = {
    id,
    type: "task",
    title: `📋 ${taskTitle}`,
    body: taskDesc || "Tap to mark your progress.",
    fireAt,
    tag: `task-${id}`,
    repeat,
    timeOfDay,
    meta: { questId },
  };
  await schedule(item.title, item.body, fireAt, {
    tag: item.tag,
    url: questId ? `/?tab=streaks&quest=${questId}` : "/?tab=streaks",
  });
  const all = loadUserSchedule().filter((n) => n.id !== id);
  all.push(item);
  saveUserSchedule(all);
  return item;
}

/* === Helpers === */

function nextOccurrence(timeOfDay: string): number {
  // timeOfDay is "HH:MM" in 24h format
  const [h, m] = timeOfDay.split(":").map((n) => Number(n) || 0);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (target.getTime() <= now.getTime()) {
    // Already past today — schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

/** Test helper: fire a notification in N seconds. */
export async function testNotificationIn(seconds: number = 5): Promise<void> {
  await schedule("🧪 Test Notification", "If you see this, notifications work! 🎉", Date.now() + seconds * 1000, {
    tag: "menifest-test",
    url: "/",
  });
}
