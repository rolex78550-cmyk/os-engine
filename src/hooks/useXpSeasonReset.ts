// ============================================================
// useXpSeasonReset — client-side enforcement of the rolling
// 30-day XP cycle (see src/lib/xpSeason.ts for the rules).
//
// On every profile snapshot:
//   • No xpCycleStart yet  → stamp one (starts the user's clock).
//                            Also seeds lifetimeXp for legacy docs.
//   • Cycle expired        → archive this cycle to
//                            users/{uid}/xp_seasons/{YYYY-MM-DD},
//                            zero totalXp / xp, keep lifetimeXp + level,
//                            move xpCycleStart to the next boundary.
//
// Runs in a Firestore transaction so two open tabs can't double-reset,
// and re-checks every minute while the app is open so a user who keeps
// the tab open across the boundary is reset without a reload.
//
// The server cron (/api/xp/season-rollover) applies the exact same rule
// for users who don't open the app — both paths use planCycleReset().
// ============================================================

import { useEffect, useRef } from "react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  planCycleReset,
  buildResetPatch,
  resolveLifetimeXp,
  levelFromXp,
  seasonDocId,
} from "../lib/xpSeason";

const RECHECK_MS = 60_000;

export function useXpSeasonReset(uid: string | undefined, profile: any) {
  const busyRef = useRef(false);
  // Re-run when these change (cheap primitives, not the whole profile object).
  const cycleStart = profile?.xpCycleStart ?? null;
  const cycleStartKey =
    typeof cycleStart === "string"
      ? cycleStart
      : cycleStart?.toDate?.()?.toISOString?.() ?? String(cycleStart ?? "");
  const hasLifetime = profile?.lifetimeXp != null;

  useEffect(() => {
    if (!uid || !profile) return;
    let cancelled = false;

    const run = async () => {
      if (busyRef.current || cancelled) return;
      const plan = planCycleReset(profile);
      if (!plan.shouldReset && !plan.shouldStamp && hasLifetime) return;

      busyRef.current = true;
      try {
        const userRef = doc(db, "users", uid);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          const fresh = snap.exists() ? snap.data() : {};
          // Re-plan against the FRESH doc (another tab may have won).
          const freshPlan = planCycleReset(fresh);

          if (freshPlan.shouldReset && freshPlan.archive) {
            const archiveRef = doc(
              db,
              "users",
              uid,
              "xp_seasons",
              seasonDocId(freshPlan.archive.cycleStart)
            );
            tx.set(
              archiveRef,
              {
                ...freshPlan.archive,
                lifetimeXpAtEnd: resolveLifetimeXp(fresh),
                archivedAt: serverTimestamp(),
                source: "client",
              },
              { merge: true }
            );
            tx.set(userRef, buildResetPatch(fresh, freshPlan), { merge: true });
            console.log(
              `[xp season] cycle reset: ${freshPlan.archive.xpEarned} XP archived, new cycle from ${freshPlan.newCycleStart}`
            );
            try {
              window.dispatchEvent(
                new CustomEvent("manifest_toast", {
                  detail: {
                    msg: `New 30-day season started · last season: ${freshPlan.archive.xpEarned.toLocaleString()} XP`,
                    type: "ok",
                  },
                })
              );
            } catch {}
            return;
          }

          // First-time / legacy doc: stamp the cycle start and seed
          // lifetimeXp so level math has a stable base.
          const patch: Record<string, any> = {};
          if (freshPlan.shouldStamp) patch.xpCycleStart = freshPlan.newCycleStart;
          if (fresh?.lifetimeXp == null) {
            const lifetime = resolveLifetimeXp(fresh);
            patch.lifetimeXp = lifetime;
            patch.level = levelFromXp(lifetime);
          }
          if (Object.keys(patch).length) {
            tx.set(userRef, patch, { merge: true });
            console.log("[xp season] initialised cycle:", patch);
          }
        });
      } catch (e: any) {
        console.warn("[xp season] reset check failed (non-blocking):", e?.message);
      } finally {
        busyRef.current = false;
      }
    };

    run();
    const id = window.setInterval(run, RECHECK_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, cycleStartKey, hasLifetime]);
}
