import React, { lazy, Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioEngine } from "./lib/audioEngine";

// Components
import { MainLayout } from "./components/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TabLoader } from "./components/LazyLoader";
import LandingPage from "./components/LandingPage";
import { PricingPage } from "./components/PricingPage";
import { ManifestOnboarding } from "./components/ManifestOnboarding";

// Views
import { AffirmationHub } from "./components/views/AffirmationHub";
import { GoalsView } from "./components/views/GoalsView";
import { GoalsHub } from "./components/views/GoalsHub";
import { JournalView } from "./components/views/JournalView";
import { ProfileView } from "./components/views/ProfileView";

// Hooks
import { useAppLogic } from "./hooks/useAppLogic";
import { useRPG } from "./hooks/useRPG";
import { useFirebase } from "./components/FirebaseProvider";
import { db } from "./lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";

// Lazy-loaded Views (Academy and Community removed permanently)
const VisionBoard = lazy(() => import("./components/VisionBoard"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const RealPaymentAudit = lazy(() => import("./components/RealPaymentAudit"));
const CinematicManifestIntro = lazy(() => import("./components/CinematicManifestIntro"));
const SoloDominion = lazy(() => import("./components/solo-dominion/SoloDominion"));

export default function App() {
  const logic = useAppLogic();
  const { user, fbLoading, activeTab, updateUserProfile } = logic;
  // Use the SAME profile instance from FirebaseProvider (single source of truth)
  const { profile: fbProfile } = useFirebase();
  const profile = fbProfile || (logic as any).profile;
  // Always call useRPG (hook order must be stable) — pass profile or fallback
  const profileForRPG = profile || ({ name: "", alignment: 0, streak: 0, belief: "" } as any);
  const { recordXPGain } = useRPG(profileForRPG, {});

  // FABLE 5 MODEL: Hard safety net
  const [forceRender, setForceRender] = useState(false);

  // ============== AFFIRMATION → SOLO DOMINION TASK BRIDGE ==============
  // When user flips 10 cards in AffirmationHub, award 50 XP (writes
  // totalXp + xp + level to Firestore + updates rank via recordXPGain).
  useEffect(() => {
    const onFlip = async () => {
      try {
        const todayStr = new Date().toLocaleDateString("en-CA");
        const FLIP_KEY = `manifest_affirmation_flips_${todayStr}`;
        const REWARD_KEY = `manifest_affirmation_rewarded_${todayStr}`;
        // Read latest flips
        const raw = window.localStorage.getItem(FLIP_KEY);
        const flips = raw ? Number(raw) : 0;
        const rewardedRaw = window.localStorage.getItem(REWARD_KEY);
        let rewarded = rewardedRaw ? Number(rewardedRaw) : 0;
        // SELF-HEAL: if we previously marked "rewarded" but totalXp is still
        // missing/zero, the old code failed to persist — reset and re-award.
        const currentTotalXpForCheck =
          Number(profile?.totalXp) || Number(profile?.xp) || 0;
        const expectedXpFromRewards = rewarded * 50;
        if (
          rewarded > 0 &&
          currentTotalXpForCheck < expectedXpFromRewards
        ) {
          console.warn(
            `[affirmation bridge] self-heal: rewarded=${rewarded} but totalXp=${currentTotalXpForCheck} < expected ${expectedXpFromRewards}, resetting`
          );
          rewarded = 0;
          window.localStorage.setItem(REWARD_KEY, "0");
        }
        console.log(
          `[affirmation bridge] flips=${flips} rewarded=${rewarded} profile.totalXp=${profile?.totalXp}`
        );
        if (flips >= 10 && rewarded < Math.floor(flips / 10)) {
          // Award 50 XP per milestone (every 10 flips)
          const milestones = Math.floor(flips / 10);
          const toAward = (milestones - rewarded) * 50;
          if (toAward > 0) {
            // 1) Update totalXp + xp + level in Firestore + local state
            const currentTotalXp =
              Number(profile?.totalXp) || Number(profile?.xp) || 0;
            const currentXp = Number(profile?.xp) || currentTotalXp;
            const newTotalXp = currentTotalXp + toAward;
            const newXp = currentXp + toAward;
            // 1 XP per level threshold (matches useRPG which uses 1000)
            const newLevel = Math.floor(newTotalXp / 1000) + 1;
            const oldLevel = Number(profile?.level) || 1;
            const leveledUp = newLevel > oldLevel;
            console.log(
              `[affirmation bridge] awarding ${toAward} XP: totalXp ${currentTotalXp} -> ${newTotalXp}, level ${oldLevel} -> ${newLevel}`
            );
            if (updateUserProfile) {
              try {
                await updateUserProfile({
                  totalXp: newTotalXp,
                  xp: newXp,
                  level: newLevel,
                } as any);
                console.log("[affirmation bridge] updateUserProfile OK");
              } catch (e) {
                console.warn("[affirmation bridge] updateUserProfile failed:", e);
              }
            } else {
              console.warn("[affirmation bridge] updateUserProfile is undefined!");
            }
            // 1b) SAFETY NET: direct Firestore write via setDoc(merge:true).
            // This is the same write useAppLogic.updateUserProfile does, but
            // called from here as a backup. It also uses `increment` for
            // atomicity so concurrent writes don't clobber each other.
            if (user?.uid) {
              try {
                await setDoc(
                  doc(db, "users", user.uid),
                  {
                    totalXp: increment(toAward),
                    xp: increment(toAward),
                    level: newLevel,
                    lastAffirmationAward: serverTimestamp(),
                  },
                  { merge: true }
                );
                console.log("[affirmation bridge] direct Firestore write OK");
              } catch (e) {
                console.warn("[affirmation bridge] direct Firestore write failed:", e);
              }
            } else {
              console.warn("[affirmation bridge] no user.uid — direct write skipped");
            }
            // 2) Recompute RPG score / rank / coins via recordXPGain
            if (recordXPGain) {
              try {
                await recordXPGain(toAward, newLevel, leveledUp);
                console.log("[affirmation bridge] recordXPGain OK");
              } catch (e) {
                console.warn("[affirmation bridge] recordXPGain failed:", e);
              }
            } else {
              console.warn("[affirmation bridge] recordXPGain is undefined!");
            }
            window.localStorage.setItem(REWARD_KEY, String(milestones));
            window.dispatchEvent(new CustomEvent("manifest_sfx_levelup"));
            window.dispatchEvent(new CustomEvent("manifest_sfx_success"));
            // Show toast
            window.dispatchEvent(
              new CustomEvent("manifest_toast", {
                detail: {
                  msg: `+${toAward} XP · Affirmation Reading task complete`,
                  type: "ok",
                },
              })
            );
          }
        }
      } catch (e) {
        console.warn("[affirmation bridge] error:", e);
      }
    };
    window.addEventListener("manifest_affirmation_flip", onFlip);
    return () => window.removeEventListener("manifest_affirmation_flip", onFlip);
  }, [recordXPGain, profile, updateUserProfile]);

  useEffect(() => {
    if (!fbLoading) return;
    const timer = setTimeout(() => {
      setForceRender(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [fbLoading]);

  // ============== SOUND EFFECTS (SFX only, no background music) ==============
  useEffect(() => {
    // Click sound on any button/clickable element
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, [role='button']")) {
        audioEngine.sfxClick();
      }
    };
    // Listen for success/error/level-up custom events
    const onSuccess = () => audioEngine.sfxSuccess();
    const onError = () => audioEngine.sfxError();
    const onXP = () => audioEngine.sfxXP();
    const onLevelUp = () => audioEngine.sfxLevelUp();
    const onNotify = () => audioEngine.sfxNotify();
    const onWhoosh = () => audioEngine.sfxWhoosh();

    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("manifest_sfx_success", onSuccess);
    window.addEventListener("manifest_sfx_error", onError);
    window.addEventListener("manifest_sfx_xp", onXP);
    window.addEventListener("manifest_sfx_levelup", onLevelUp);
    window.addEventListener("manifest_sfx_notify", onNotify);
    window.addEventListener("manifest_sfx_whoosh", onWhoosh);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("manifest_sfx_success", onSuccess);
      window.removeEventListener("manifest_sfx_error", onError);
      window.removeEventListener("manifest_sfx_xp", onXP);
      window.removeEventListener("manifest_sfx_levelup", onLevelUp);
      window.removeEventListener("manifest_sfx_notify", onNotify);
      window.removeEventListener("manifest_sfx_whoosh", onWhoosh);
    };
  }, []);

  if (fbLoading && !forceRender) {
    return <TabLoader />;
  }

  // 1. Not Logged In -> Landing Page
  if (!user) {
    return (
      <ErrorBoundary>
        <LandingPage
          onSignIn={logic.signIn}
          onDemoSignIn={logic.signInDemo}
          authError={logic.authError}
          clearAuthError={logic.clearAuthError}
        />
      </ErrorBoundary>
    );
  }

  const isAdmin = user.email === "asartist20@gmail.com";

  // 2. Logged In, but NOT completed Survey (Onboarding Assessment) -> Survey
  if (!logic.hasCompletedOnboarding || logic.showManifestOnboarding) {
    return (
      <ErrorBoundary>
        <ManifestOnboarding
          onComplete={logic.handleManifestOnboardingComplete}
        />
      </ErrorBoundary>
    );
  }

  // 3. Logged In & Onboarded, but NOT Paid -> Mandatory Payment Screen (PricingPage)
  if (!logic.hasPaidAccess && !isAdmin) {
    return (
      <ErrorBoundary>
        <PricingPage
          paywallMessage={logic.paywallMessage || "Your personalized AI Life System is ready! Choose a plan to unlock full access."}
        />
      </ErrorBoundary>
    );
  }

  const pageTransition = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.18, ease: "easeOut" as const }
  };

  // 4. Logged In, Onboarded, AND Paid -> System Access (MainLayout)
  return (
    <ErrorBoundary>
      <MainLayout {...logic}>
        <Suspense fallback={<TabLoader />}>
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" {...pageTransition} className="will-change-transform">
                <AffirmationHub {...logic} />
              </motion.div>
            )}
            {activeTab === "goals" && (
              <motion.div key="goals" {...pageTransition} className="will-change-transform">
                <GoalsHub {...logic} />
              </motion.div>
            )}
            {activeTab === "journal" && (
              <motion.div key="journal" {...pageTransition} className="will-change-transform">
                <JournalView {...logic} />
              </motion.div>
            )}

            {activeTab === "vision" && (
              <motion.div key="vision" {...pageTransition} className="will-change-transform">
                <VisionBoard
                  items={logic.visionItems}
                  onAdd={logic.handleAddVision}
                  onDelete={logic.handleDeleteVision}
                  isUploading={logic.isUploadingVision || false}
                />
              </motion.div>
            )}

            {/* Academy and Community tabs removed permanently */}

            {activeTab === "profile" && (
              <motion.div key="profile" {...pageTransition} className="will-change-transform">
                <ProfileView todayStr={new Date().toLocaleDateString("en-CA")} {...logic} />
              </motion.div>
            )}

            {activeTab === "streaks" && (
              <motion.div key="streaks" {...pageTransition} className="will-change-transform">
                <Suspense fallback={<TabLoader />}>
                  <SoloDominion {...logic} />
                </Suspense>
              </motion.div>
            )}

            {activeTab === "admin" && isAdmin && (
              <motion.div key="admin" {...pageTransition} className="will-change-transform space-y-8">
                <AdminPanel />
                <RealPaymentAudit />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </MainLayout>

      <AnimatePresence>
        {logic.showCinematicIntro && (
          <Suspense fallback={<TabLoader />}>
            <CinematicManifestIntro
              onComplete={logic.handleCinematicIntroComplete}
              userName={logic.profile?.name}
            />
          </Suspense>
        )}

        {logic.showPricingPage && (
          <PricingPage
            onClose={() => logic.setShowPricingPage(false)}
            paywallMessage={logic.paywallMessage || undefined}
          />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}
