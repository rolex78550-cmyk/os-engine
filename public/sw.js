/**
 * Menifest OS — Service Worker
 *
 * Responsibilities:
 *  1. Cache static assets (PWA offline support)
 *  2. Receive push notifications (server-pushed when available)
 *  3. Show local scheduled notifications (I AM affirmations +
 *     task reminders scheduled via NotificationManager)
 *
 * NOTE: This service worker handles SCHEDULED notifications via
 * the Notification Triggers API (showNotification) which fire when
 * the service worker receives a 'schedule' message from the page.
 * For iOS Safari (16.4+) we also use the Notification API directly
 * from the page for one-shot notifications.
 */

const CACHE_NAME = "menifest-os-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// === INSTALL — pre-cache the app shell ===
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // Best-effort: ignore failures (e.g. icons missing)
      })
    )
  );
});

// === ACTIVATE — clean up old caches ===
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// === FETCH — network-first, fall back to cache ===
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        // Cache successful same-origin responses
        if (
          resp.status === 200 &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(event.request).then((r) => r || Response.error()))
  );
});

// === PUSH — handle server-pushed notifications (future) ===
self.addEventListener("push", (event) => {
  let data = { title: "Menifest OS", body: "Time to claim your XP." };
  try {
    if (event.data) data = event.data.json();
  } catch (_) {
    if (event.data) data.body = event.data.text();
  }
  const options = {
    body: data.body || "Stay disciplined.",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    tag: data.tag || "menifest-push",
    renotify: true,
    requireInteraction: !!data.requireInteraction,
    vibrate: data.vibrate || [200, 100, 200, 100, 400],
    data: { url: data.url || "/" },
    actions: data.actions || [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// === NOTIFICATION CLICK ===
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// === SCHEDULED NOTIFICATIONS — message from page to schedule
//     timed local notifications. The page calls:
//       navigator.serviceWorker.controller.postMessage({
//         type: 'show-notification',
//         payload: { title, body, delayMs, tag, ... }
//       })
//     The service worker uses setTimeout to fire the notification.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === "show-notification") {
    const p = data.payload || {};
    const delayMs = Math.max(0, Number(p.delayMs) || 0);
    const fire = () => {
      self.registration.showNotification(p.title || "Menifest OS", {
        body: p.body || "",
        icon: p.icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: p.tag || "menifest-scheduled",
        renotify: true,
        requireInteraction: !!p.requireInteraction,
        vibrate: p.vibrate || [200, 100, 200],
        data: { url: p.url || "/" },
        actions: p.actions || [
          { action: "open", title: "Open App" },
          { action: "dismiss", title: "Dismiss" },
        ],
      });
    };
    if (delayMs > 0) {
      setTimeout(fire, delayMs);
    } else {
      fire();
    }
  }

  if (data.type === "cancel-notification" && data.tag) {
    self.registration
      .getNotifications({ tag: data.tag })
      .then((list) => list.forEach((n) => n.close()));
  }
});
