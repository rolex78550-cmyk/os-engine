# Daily push + email reminders

## Implemented

Profile → Daily reminders offers explicit opt-in per channel, device registration, editable IANA timezone, three editable times, save/off controls and provider test buttons.
Defaults: 07:00 morning plan, 18:00 evening status, 22:00 night report. Both channels start OFF; existing users are not silently enrolled.

Reports use server task_claims with verified=true and known task IDs. They show completed/total quests, pending quest examples and quest XP (not all possible app XP). Current quest day resets in Asia/Kolkata throughout the existing app. Reports label this explicitly; reminder delivery uses the user's timezone. The night report is a snapshot at send time, not a full midnight-to-midnight local-day report. Goal and journal progress are not included yet.

Server endpoints require Firebase authentication, except /api/reminders/run which requires the scheduler secret. Tests are rate-limited. Email is sent only to the authenticated account's verified email, never a client-provided recipient. Expired push subscriptions are removed. One browser subscription belongs to one account at a time. Turning a channel off and saving stops future scheduled sends (an already queued message may still arrive).

## Required production configuration

1. Generate a persistent VAPID key pair on a trusted machine:
   `npx web-push generate-vapid-keys --json`
2. In Vercel server environment variables configure:
   - WEB_PUSH_PUBLIC_KEY
   - WEB_PUSH_PRIVATE_KEY (private, never VITE_)
   - WEB_PUSH_SUBJECT (mailto: address you control)
   - RESEND_API_KEY
   - NOTIFICATION_FROM_EMAIL (a sender on a domain verified with your email provider)
   - CRON_SECRET (strong random secret; do not share in chat)
3. Firebase Admin credentials must be configured as required by the existing backend.
4. Deploy updated firestore.rules. The new notification_settings, notification_deliveries and notification_push_owners collections are server-only, including reads. Do not rely on the old authenticated-read catch-all for these collections.
5. Redeploy the app. Existing public/sw.js already handles real push delivery and notification clicks; local service-worker timers are not used as a substitute for server push.
6. Configure an external trusted scheduler to execute `node scripts/run-reminders.mjs` EVERY FIVE MINUTES, with CRON_SECRET and REMINDER_ORIGIN set server-side. It calls GET /api/reminders/run and follows nextCursor for batches of 50 users. A bare one-shot HTTP scheduler must also follow pagination, or users after the first page will be skipped.
   - A long-lived trusted server can use cron: `*/5 * * * * cd /path/to/os-engine && node scripts/run-reminders.mjs`
   - An external managed scheduler/worker can execute equivalent authenticated calls.
   - Frequent Vercel Cron schedules may require a paid plan. No new recurring paid job has been enabled automatically.
7. Consider a Firestore TTL policy on notification_deliveries.expiresAt for automatic 30-day cleanup. Review delivery logs and provider quotas/billing.

## Scheduling and reliability

The scheduler sends a slot only within 30 minutes after its selected local time; it does not send stale all-day catch-up messages. DST uses Intl timezones. A clock time skipped by a DST transition may not send that day. Same-date/slot/channel delivery records prevent normal repeated cron sends. Transactions lease in-flight deliveries for five minutes and allow up to three attempts within the slot window. Email uses provider idempotency keys. A rare crash between push delivery and saving status can cause a duplicate; push tags reduce visible duplication. No provider can guarantee immediate arrival, inbox placement or delivery when device settings suppress notifications.

The legacy mass daily-reminder broadcast endpoints are disabled (410), rather than bypassing new opt-in controls. Other existing transactional notifications remain unchanged.

## Acceptance checklist after deployment

- Sign in; verify email if needed.
- Open Profile → Daily reminders. Confirm both channels are off initially.
- Connect push from an explicit button click; enable desired channels, select timezone/times and Save.
- Click Test push and Test email. UI says provider accepted, not guaranteed delivered.
- On iOS 16.4+, install PWA to Home Screen and allow notifications from that installed app.
- Set an upcoming slot and confirm the scheduler reaches it with app closed.
- Verify completed/pending and quest XP against server claims for the labelled app day.
- Turn both channels off, Save and verify later runs do not send.
- Confirm another signed-in account cannot read these collections directly.

## Local verification completed

- TypeScript compilation and production build pass (existing bundle-size warnings remain).
- 10 schedule assertions: India, US DST, custom times, rollover and invalid timezone.
- 9 API rejection checks: unauthenticated access, scheduler auth, invalid times/timezone, unverified email and invalid test channel.
- Real provider delivery and Firestore scheduling have NOT been exercised without production credentials. Live delivery remains pending configuration, scheduler activation, deployment and device tests.
