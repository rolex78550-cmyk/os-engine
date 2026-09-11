// Firestore security-rules test for firestore.rules (XP lock + task_claims).
//
// Run (needs Java for the emulator):
//   npm i -D firebase-tools @firebase/rules-unit-testing firebase   # one-time
//   npx firebase emulators:exec --only firestore --project demo-rules-test \
//       "node scripts/firestore-rules.test.mjs"
//   (or start the emulator separately and run with FS_PORT=8080)
//
// Exercises every REAL client write path in the app against the XP lock.
import fs from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, increment, runTransaction, collection, getDocs } from "firebase/firestore";

const rules = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const env = await initializeTestEnvironment({
  projectId: "demo-rules-test",
  firestore: { rules, host: "127.0.0.1", port: Number(process.env.FS_PORT || 8080) },
});

const results = [];
async function t(name, fn) {
  try {
    await fn();
    results.push(["PASS", name]);
  } catch (e) {
    results.push(["FAIL", name + " → " + (e?.message || e).toString().split("\n")[0].slice(0, 160)]);
  }
}

const UID = "alice";
const OTHER = "mallory";
const me = () => env.authenticatedContext(UID).firestore();
const other = () => env.authenticatedContext(OTHER).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const seed = (data) => env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "users", UID), data);
});
const seedAt = (path, data) => env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), path), data);
});

// ─────────────────────────── CREATE (bootstrap) ───────────────────────────
await env.clearFirestore();
await t("create: FirebaseProvider baseProfile (no XP fields)", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { name: "Alice", createdAt: "x" }, { merge: true })));

await env.clearFirestore();
await t("create: useAppLogic onboarding bootstrap (level 1, xp 0, totalXp 0)", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { stats: {}, coins: 50, rank: "Civilian", level: 1, xp: 0, totalXp: 0 }, { merge: true })));

await env.clearFirestore();
await t("create: CHEAT — new doc with totalXp 99999 is rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { totalXp: 99999, level: 7 })));

await env.clearFirestore();
await t("create: CHEAT — new doc with lifetimeXp 50000 is rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { lifetimeXp: 50000 })));

await env.clearFirestore();
await t("create: someone else's uid is rejected", () =>
  assertFails(setDoc(doc(other(), "users", UID), { name: "hax" })));

// ─────────────────────────── UPDATE (normal flows) ───────────────────────────
const BASE = { name: "Alice", totalXp: 1200, xp: 1200, lifetimeXp: 20000, level: 2, streak: 3, xpCycleStart: "2026-08-20T00:00:00.000Z" };

await seed(BASE);
await t("update: profile edit (name/bio/avatar) untouched XP", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { bio: "hi", avatarUrl: "data:..." }, { merge: true })));

await seed(BASE);
await t("update: LifeResetPricing country / streakFreezes / stats / coins", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { country: "IN", streakFreezes: 2, stats: { a: 1 }, coins: 90, lastQuestGenerationDate: "2026-09-11" }, { merge: true })));

await seed(BASE);
await t("update: onboarding re-run with SAME xp values (no change) allowed", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { onboarded: true, totalXp: 1200, xp: 1200, level: 2 }, { merge: true })));

await seed(BASE);
await t("update: useAppLogic bootstrap guard skipped (existing XP) — but if it ran with level:1/xp:0 it's allowed (zeroing)", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { level: 1, xp: 0, totalXp: 0 }, { merge: true })));

// season reset (client hook useXpSeasonReset → buildResetPatch)
await seed(BASE);
await t("update: useXpSeasonReset buildResetPatch (totalXp/xp→0, lifetimeXp same, level same) + xp_seasons archive in a transaction", () =>
  assertSucceeds((async () => { const fs = me(); return runTransaction(fs, async (tx) => {
    tx.set(doc(fs, "users", UID, "xp_seasons", "2026-08-20"), { xpEarned: 1200, archivedAt: "x", source: "client" }, { merge: true });
    tx.set(doc(fs, "users", UID), {
      totalXp: 0, xp: 0, lifetimeXp: 20000, level: 2,
      xpCycleStart: "2026-09-19T00:00:00.000Z", lastXpReset: "x", xpSeasonsCompleted: 1,
    }, { merge: true });
  }); })()));

// extra: level-up derived from lifetime is allowed ONLY when consistent
await seed({ name: "L", totalXp: 16450, xp: 16450, lifetimeXp: 16450, level: 1 });
await t("update: CHEAT — level 1→2 while lifetimeXp stays 16450 (<16500) rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { level: 2 }, { merge: true })));
await seed({ name: "L", totalXp: 500, xp: 500, level: 1 });
await t("update: legacy seed lifetimeXp 500 + level 2 (inconsistent) rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { lifetimeXp: 500, level: 2 }, { merge: true })));
await seed(BASE);
await t("update: useRPG saveRPGFields (rank/score/coins, no XP fields) allowed", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { playerScore: 10, rank: "Bronze", rankTierIndex: 1, coins: increment(25), rpgInitialized: true }, { merge: true })));
await seed(BASE);
await t("update: CHEAT — full overwrite dropping lifetimeXp (set without merge) rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { name: "Alice", totalXp: 1200, xp: 1200, level: 2 })));
await seed(BASE);
await t("update: CHEAT — set totalXp to a string / negative rejected", async () => {
  await assertFails(setDoc(doc(me(), "users", UID), { totalXp: "99999" }, { merge: true }));
  await assertFails(setDoc(doc(me(), "users", UID), { lifetimeXp: -5 }, { merge: true }));
});
await seed(BASE);
await t("delete: owner may delete own doc (unchanged behaviour is 'write' incl. delete)", () =>
  assertSucceeds((async () => { const { deleteDoc } = await import("firebase/firestore"); return deleteDoc(doc(me(), "users", UID)); })()));

// legacy doc seeding (useXpSeasonReset "initialised cycle": lifetimeXp missing → seed from totalXp)
await seed({ name: "Legacy", totalXp: 3000, xp: 3000, level: 1 });
await t("update: legacy doc seeds lifetimeXp = totalXp (3000) and level from it", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { xpCycleStart: "2026-09-11T00:00:00.000Z", lifetimeXp: 3000, level: 1 }, { merge: true })));

await seed({ name: "Legacy", totalXp: 3000, xp: 3000, level: 1 });
await t("update: CHEAT — legacy doc seeds lifetimeXp > totalXp (99999) rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { lifetimeXp: 99999 }, { merge: true })));

await seed({ name: "Legacy", totalXp: 40000, xp: 40000, level: 1 });
await t("update: legacy doc w/ 40k totalXp seeds lifetimeXp 40000 + level 3 (16.5k/level) — level must be allowed when lifetime seeds", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { lifetimeXp: 40000, level: 3 }, { merge: true })));

// ProfileView clearAllData
await seed(BASE);
await t("update: ProfileView clearAllData (all zero / level 1) allowed", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID), { totalXp: 0, xp: 0, lifetimeXp: 0, level: 1, streak: 0, xpCycleStart: "x" }, { merge: true })));

// ─────────────────────────── UPDATE (cheats / now-blocked legacy writers) ───────────────────────────
await seed(BASE);
await t("update: CHEAT — totalXp 1200→1250 rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { totalXp: 1250 }, { merge: true })));

await seed(BASE);
await t("update: CHEAT — increment(50) on totalXp/xp/lifetimeXp rejected (SoloDominion buildXpAwardPatch / quest complete)", () =>
  assertFails(setDoc(doc(me(), "users", UID), { totalXp: increment(50), xp: increment(50), lifetimeXp: increment(50), level: 2 }, { merge: true })));

await seed(BASE);
await t("update: CHEAT — level 2→9 rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { level: 9 }, { merge: true })));

await seed(BASE);
await t("update: CHEAT — lifetimeXp 20000→999999 rejected (ProfileView addDemoXP)", () =>
  assertFails(setDoc(doc(me(), "users", UID), { totalXp: 1400, xp: 1400, lifetimeXp: 20200, level: 2 }, { merge: true })));

await seed(BASE);
await t("update: CHEAT — decrease-then-… totalXp 1200→500 (arbitrary non-zero value) rejected", () =>
  assertFails(setDoc(doc(me(), "users", UID), { totalXp: 500 }, { merge: true })));

await seed(BASE);
await t("update: CHEAT — delete lifetimeXp field then re-seed higher (2-step) — step 1 (drop field via full overwrite w/o merge) must fail", () =>
  assertFails(setDoc(doc(me(), "users", UID), { name: "Alice", totalXp: 1200, xp: 1200, level: 2 })));

await seed(BASE);
await t("update: other user cannot touch my doc", () =>
  assertFails(setDoc(doc(other(), "users", UID), { bio: "x" }, { merge: true })));

await seed(BASE);
await t("update: unauthenticated write rejected", () =>
  assertFails(setDoc(doc(anon(), "users", UID), { bio: "x" }, { merge: true })));

// ─────────────────────────── READS ───────────────────────────
await seed(BASE);
await t("read: any authed user can read profiles (leaderboard)", () =>
  assertSucceeds(getDoc(doc(other(), "users", UID))));
await t("read: anon cannot read profiles", () =>
  assertFails(getDoc(doc(anon(), "users", UID))));

// ─────────────────────────── task_claims (server only) ───────────────────────────
await seedAt(`users/${UID}/task_claims/2026-09-11_pushup`, { taskId: "pushup", verified: true, attempts: 1 });
await t("task_claims: owner can read", () =>
  assertSucceeds(getDoc(doc(me(), "users", UID, "task_claims", "2026-09-11_pushup"))));
await t("task_claims: owner can list", () =>
  assertSucceeds(getDocs(collection(me(), "users", UID, "task_claims"))));
await t("task_claims: other user cannot read", () =>
  assertFails(getDoc(doc(other(), "users", UID, "task_claims", "2026-09-11_pushup"))));
await t("task_claims: CHEAT — owner cannot forge a verified claim", () =>
  assertFails(setDoc(doc(me(), "users", UID, "task_claims", "2026-09-11_water"), { taskId: "water", verified: true })));
await t("task_claims: CHEAT — owner cannot reset attempts", () =>
  assertFails(setDoc(doc(me(), "users", UID, "task_claims", "2026-09-11_pushup"), { attempts: 0 }, { merge: true })));

// ─────────────────────────── xp_seasons ───────────────────────────
await t("xp_seasons: owner can create archive (client reset hook)", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID, "xp_seasons", "2026-07-01"), { xpEarned: 10 })));
await t("xp_seasons: owner cannot rewrite an existing archive", () =>
  assertFails(setDoc(doc(me(), "users", UID, "xp_seasons", "2026-07-01"), { xpEarned: 99999 }, { merge: true })));

// ─────────────────────────── other subcollections unchanged ───────────────────────────
await t("subcollection: owner can write solo_missions / rituals / goals", () =>
  assertSucceeds(setDoc(doc(me(), "users", UID, "solo_missions", "2026-09-11"), { missions: [] })));
await t("subcollection: other user cannot write my solo_missions", () =>
  assertFails(setDoc(doc(other(), "users", UID, "solo_missions", "2026-09-11"), { missions: [] })));
await t("subcollection: other authed user can read my subcollection (unchanged from before)", () =>
  assertSucceeds(getDoc(doc(other(), "users", UID, "solo_missions", "2026-09-11"))));

// ─────────────────────────── other top-level collections unchanged ───────────────────────────
await t("leaderboard: public read", () => assertSucceeds(getDoc(doc(anon(), "leaderboard", UID))));
await t("leaderboard: own entry write", () => assertSucceeds(setDoc(doc(me(), "leaderboard", UID), { xp: 5 })));
await t("leaderboard: other's entry write rejected", () => assertFails(setDoc(doc(me(), "leaderboard", OTHER), { xp: 5 })));
await t("community_posts / payments / user_sessions: authed write ok", async () => {
  await assertSucceeds(setDoc(doc(me(), "community_posts", "p1"), { a: 1 }));
  await assertSucceeds(setDoc(doc(me(), "payments", "p1"), { a: 1 }));
  await assertSucceeds(setDoc(doc(me(), "user_sessions", "s1"), { a: 1 }));
});
await t("default deny: random collection write rejected", () => assertFails(setDoc(doc(me(), "random", "x"), { a: 1 })));

await env.cleanup();

let fails = 0;
for (const [s, n] of results) { if (s === "FAIL") fails++; console.log(`${s === "PASS" ? "✅" : "❌"} ${n}`); }
console.log(`\n${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
