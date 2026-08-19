import React, { lazy, Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// Components
import { MainLayout } from "./components/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TabLoader } from "./components/LazyLoader";
import LandingPage from "./components/LandingPage";
import { PricingPage } from "./components/PricingPage";
import { ManifestOnboarding } from "./components/ManifestOnboarding";

// Views
import { DashboardView } from "./components/views/DashboardView";
import { CleanDashboard } from "./components/views/CleanDashboard";
import { GoalsView } from "./components/views/GoalsView";
import { GoalsHub } from "./components/views/GoalsHub";
import { JournalView } from "./components/views/JournalView";
import { ProfileView } from "./components/views/ProfileView";

// Hooks
import { useAppLogic } from "./hooks/useAppLogic";

// Lazy-loaded Views (Academy and Community removed permanently)
const VisionBoard = lazy(() => import("./components/VisionBoard"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const RealPaymentAudit = lazy(() => import("./components/RealPaymentAudit"));
const CinematicManifestIntro = lazy(() => import("./components/CinematicManifestIntro"));
const SoloDominion = lazy(() => import("./components/solo-dominion/SoloDominion"));

export default function App() {
  const logic = useAppLogic();
  const { user, fbLoading, activeTab } = logic;

  // FABLE 5 MODEL: Hard safety net
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    if (!fbLoading) return;
    const timer = setTimeout(() => {
      setForceRender(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [fbLoading]);

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
                <CleanDashboard {...logic} />
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
