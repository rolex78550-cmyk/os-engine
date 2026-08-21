import React, { ReactNode, useEffect } from "react";
import {
  Sparkles, LayoutDashboard, Flame, Target, ImageIcon, BookOpen, Crown, User, Shield, LogOut, LogIn, RefreshCw, Bell, ChevronRight, CheckCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
// (Key approach removed — using helper child component below for scroll-to-top)
import ParticleBackground from "./ParticleBackground";
import UniversePortalAnimation from "./UniversePortalAnimation";
import { getTrialInfo } from "../lib/subscription";
import { resolveImageUrl, onImgError, FALLBACK_AVATAR } from "../lib/imageHelper";

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  profile: any;
  isPremium: boolean;
  isOnTrial: boolean;
  hasPaidAccess: boolean;
  subscription: any;
  signOut: () => void;
  signIn: () => void;
  notificationMsg: string | null;
  universePortalEvent: any;
  setUniversePortalEvent: (e: any) => void;
  unreadNotificationCount: number;
  showNotificationCenter: boolean;
  setShowNotificationCenter: (val: boolean) => void;
  dynamicNotifications: any[];
  readNotificationIds: string[];
  openNotificationAction: (id: string, action: string) => void;
  setReadNotificationIds: (ids: any) => void;
  showMobileProfileMenu: boolean;
  setShowMobileProfileMenu: (val: boolean) => void;
  setShowPricingPage?: (val: boolean) => void;
  loadingInsight: boolean;
  fetchDailyInsight: () => void;
  aiInsight: any;
  logPageVisit: (page: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  user,
  profile,
  isPremium,
  isOnTrial,
  hasPaidAccess,
  subscription,
  signOut,
  signIn,
  notificationMsg,
  universePortalEvent,
  setUniversePortalEvent,
  unreadNotificationCount,
  showNotificationCenter,
  setShowNotificationCenter,
  dynamicNotifications,
  readNotificationIds,
  openNotificationAction,
  setReadNotificationIds,
  showMobileProfileMenu,
  setShowMobileProfileMenu,
  setShowPricingPage,
  loadingInsight,
  fetchDailyInsight,
  aiInsight,
  logPageVisit
}) => {
  const trialInfo = getTrialInfo(subscription);
  // Trial ended = user was on trial but it expired, OR status is free/expired/cancelled/null
  const trialEnded =
    (subscription?.subscriptionStatus === 'trial' && trialInfo && !trialInfo.active) ||
    subscription?.subscriptionStatus === 'expired' ||
    subscription?.subscriptionStatus === 'cancelled' ||
    (!hasPaidAccess && !isOnTrial && !trialInfo?.active);
  // Show subscribe CTA for ANY user who hasn't paid (trial, expired, free, brand new)
  const showSubscribeCTA = !hasPaidAccess;
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-white/20 pb-28 md:pb-6 font-sans antialiased">
      <ParticleBackground />
      <UniversePortalAnimation event={universePortalEvent} onComplete={() => setUniversePortalEvent(null)} />

      {/* FULL PAGE DRAMATIC BACKGROUND — removed per user request (pure black) */}
      {(activeTab === "dashboard" || activeTab === "streaks") && (
        <div
          className="fixed inset-0 z-[1] pointer-events-none bg-black"
          aria-hidden="true"
        />
      )}

      {/* Helper: scroll to top on every page change so user lands at the top */}
      <NavScrollToTop activeTab={activeTab} />

      {/* Top Toast Notification */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-black/90  border border-white/10 px-6 py-3.5 rounded-full flex items-center gap-3 shadow-xl"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-medium tracking-tight text-white">{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative max-w-[1550px] mx-auto px-2 sm:px-3.5 lg:px-4 pb-20 lg:pb-6 z-[40] ${activeTab === "dashboard" || activeTab === "streaks" ? "pt-1.5 sm:pt-3" : "pt-2.5 sm:pt-4"}`}>
        <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-5 items-start">
          
          {/* LEFT SIDEBAR — EXACT match to reference image */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-2 flex-col bg-[#0a0b10] border border-white/10 rounded-3xl p-3 xl:p-4 h-[calc(100vh-56px)] sticky top-6 shadow-2xl overflow-hidden">
            <div className="space-y-5 overflow-hidden">
                <div className="flex items-center gap-3 px-1">
                  <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <span className="text-yellow-400 text-xl leading-none">✦</span>
                  </div>
                  <div>
                    <div className="font-bold text-[15px] tracking-tight">Menifest OS</div>
                    <div className="text-[9px] -mt-1 font-mono text-yellow-400/70 tracking-widest">FOCUS ENGINE</div>
                  </div>
                </div>
              </div>

              <nav className="space-y-0.5 mt-2">
                {[
                  { id: "dashboard", label: "Affirmations", icon: Sparkles },
                  { id: "goals", label: "Goals", icon: Target },
                  { id: "streaks", label: "Solo Dominion", icon: Flame },
                  { id: "vision", label: "Vision Board", icon: ImageIcon },
                  { id: "journal", label: "Journal", icon: BookOpen },
                  { id: "profile", label: "Profile", icon: User },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); logPageVisit(item.id); }}
                    className={`w-full flex items-center gap-3 py-[9px] px-3 xl:px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-purple-600/90 text-white border border-purple-400/40"
                        : "text-white/65 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={17} className={`shrink-0 ${activeTab === item.id ? "text-white" : "text-white/40"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}

                {user?.email === "asartist20@gmail.com" && (
                  <button
                    onClick={() => { setActiveTab("admin"); logPageVisit("admin"); }}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 xl:px-4 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer min-w-0 ${
                      activeTab === "admin"
                        ? "bg-rose-500/10 text-amber-50 shadow-inner border border-rose-500/20"
                        : "text-rose-400/80 hover:text-amber-50 hover:bg-rose-500/5"
                    }`}
                  >
                    <Shield size={18} className="shrink-0" />
                    <span className="truncate">Admin</span>
                  </button>
                )}
              </nav>

              {/* PROMINENT Subscribe CTA — always visible for any non-paid user */}
              {!hasPaidAccess && (
                <button
                  onClick={() => setShowPricingPage?.(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-xs uppercase tracking-wider hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(245,158,11,0.4)] transition-all shadow-lg"
                >
                  <Crown size={15} className="fill-black" />
                  {trialEnded ? 'Subscribe Now' : isOnTrial ? 'Subscribe' : 'Go Premium'}
                </button>
              )}

              {/* Trial countdown badge in sidebar */}
              {isOnTrial && trialInfo?.active && (
                <div className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] text-center">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                    ⏱ {trialInfo.hoursRemaining}h trial left
                  </span>
                </div>
              )}

              {/* SIGMA MOTIVATIONAL SIDEBAR CARD (Matches Reference Image) */}
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-black/60 p-3 mt-4 group">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10" />
                <img
                  src={resolveImageUrl("/src/assets/images/skyline_man_silhouette_1785175040787.jpg")}
                  alt="Sigma Skyline Silhouette"
                  onError={onImgError("/images/hero-wasteland.jpg")}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-60"
                />
                <div className="relative z-20 space-y-1 pt-10">
                  <div className="text-[12px] font-black text-white leading-snug font-serif italic tracking-wide">
                    “DISCIPLINE TODAY.<br />FREEDOM TOMORROW.<br />LEGACY FOREVER.”
                  </div>
                  <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest pt-1">
                    — SIGMA CODE
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4 shrink-0">
              <div onClick={() => setActiveTab("profile")} className="flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] p-2 rounded-2xl transition-all min-w-0 flex-1">
                <div className="relative w-9 h-9 rounded-full bg-neutral-900 border border-amber-500/20 flex items-center justify-center font-bold text-xs text-amber-200 shrink-0 overflow-hidden">
                  <img src={resolveImageUrl(profile?.avatarUrl) || FALLBACK_AVATAR} alt="Avatar" onError={onImgError()} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-amber-50 truncate">{profile?.name || "Seeker"}</h4>
                  <span className="text-[9px] font-mono text-amber-200/50 uppercase tracking-tighter">Level {profile?.level}</span>
                </div>
              </div>
              <button onClick={signOut} className="p-2 text-rose-400/50 hover:text-rose-400 shrink-0"><LogOut size={16} /></button>
            </div>
          </aside>

          <main className="col-span-12 lg:col-span-9 xl:col-span-10 space-y-3 sm:space-y-4">
            {/* Trial/Subscribe banner — visible on ALL screens for ALL non-paid users */}
            {showSubscribeCTA && (
              <div className={`flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border ${trialEnded ? 'border-rose-500/30 bg-rose-500/[0.06]' : 'border-amber-500/30 bg-amber-500/[0.06]'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Crown size={15} className={trialEnded ? 'text-rose-400 shrink-0' : 'text-amber-400 shrink-0'} />
                  <span className={`text-[11px] font-semibold ${trialEnded ? 'text-rose-200' : 'text-amber-200'}`}>
                    {isOnTrial && trialInfo?.active
                      ? `Free trial: ${trialInfo.hoursRemaining}h left`
                      : trialEnded
                      ? 'Free trial ended'
                      : 'Unlock all features'}
                  </span>
                </div>
                <button
                  onClick={() => setShowPricingPage?.(true)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-400 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-amber-300 transition-all"
                >
                  Subscribe
                </button>
              </div>
            )}
            <header
              className="sticky top-0 z-50 -mt-1 py-2.5 px-3 sm:px-4 flex items-center justify-between gap-2.5 mb-2 sm:mb-3"
              style={{
                backgroundColor: "rgba(10,11,16,0.72)",
                backdropFilter: "saturate(180%) blur(24px)",
                WebkitBackdropFilter: "saturate(180%) blur(24px)",
              }}
            >
              {/* App Brand Header — iOS clean style */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-[13px] tracking-tighter">M</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-white tracking-tight truncate">
                    Menifest OS
                  </h2>
                  <div className="text-[10px] font-medium text-white/45 tracking-tight truncate">
                    {activeTab === 'streaks' ? 'Solo Dominion' : activeTab === 'dashboard' ? 'Affirmations' : activeTab === 'goals' ? 'Goals' : activeTab === 'vision' ? 'Vision Board' : activeTab === 'journal' ? 'Journal' : activeTab === 'profile' ? 'Profile' : activeTab}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Subscribe / Upgrade — iOS-style small pill (no shadow, no glow) */}
                {!hasPaidAccess && (
                  <button
                    onClick={() => setShowPricingPage?.(true)}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white text-black text-[11px] sm:text-xs font-semibold hover:bg-white/90 transition-colors shrink-0"
                  >
                    <Crown size={12} className="fill-black shrink-0" />
                    <span className="hidden sm:inline">{trialEnded ? 'Subscribe' : isOnTrial ? 'Subscribe' : 'Premium'}</span>
                    <span className="sm:hidden">Go</span>
                  </button>
                )}

                {/* Notification Bell — iOS-style icon button (no border, no bg) */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={18} className="text-white/85" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {showNotificationCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="fixed right-3 top-[60px] z-[80] w-[calc(100vw-24px)] max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl sm:absolute sm:right-0 sm:top-12 sm:w-96"
                        style={{ backgroundColor: "rgba(10,11,16,0.96)", backdropFilter: "blur(20px)" }}
                      >
                        <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
                          <h3 className="text-[15px] font-semibold text-white">Notifications</h3>
                          <button onClick={() => setReadNotificationIds(dynamicNotifications.map(n => n.id))} className="text-[11px] font-medium text-white/45 hover:text-white/80">Mark all read</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                          {dynamicNotifications.length === 0 ? (
                            <p className="p-8 text-center text-white/35 text-sm">No new signals</p>
                          ) : (
                            dynamicNotifications.map(n => (
                              <button key={n.id} onClick={() => openNotificationAction(n.id, n.action)} className="w-full p-3 text-left rounded-xl hover:bg-white/[0.05] transition-colors">
                                <div className="flex gap-3">
                                  <span className="text-base">{n.icon}</span>
                                  <div>
                                    <h4 className="text-[13px] font-semibold text-white">{n.title}</h4>
                                    <p className="text-[11px] text-white/50 mt-0.5">{n.body}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Profile Avatar — iOS-style (no border, just round) */}
                <div className="lg:hidden relative">
                  <button
                    onClick={() => setShowMobileProfileMenu(!showMobileProfileMenu)}
                    className="w-9 h-9 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                    aria-label="Profile menu"
                  >
                    <img src={resolveImageUrl(profile?.avatarUrl) || FALLBACK_AVATAR} alt="Avatar" onError={onImgError()} className="w-full h-full object-cover" />
                  </button>

                  <AnimatePresence>
                    {showMobileProfileMenu && (
                      <>
                        {/* Click-away backdrop */}
                        <div className="fixed inset-0 z-[88]" onClick={() => setShowMobileProfileMenu(false)} />
                        {/* Dropdown panel */}
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-12 z-[90] w-[calc(100vw-32px)] max-w-[300px] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
                          style={{ backgroundColor: "rgba(10,11,16,0.96)", backdropFilter: "blur(20px)" }}
                        >
                          {/* Profile Header */}
                          <div className="p-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                                <img src={resolveImageUrl(profile?.avatarUrl) || FALLBACK_AVATAR} alt="Avatar" onError={onImgError()} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[14px] font-semibold text-white truncate">{profile?.name || "Seeker"}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-white/45">Level {profile?.level || 1}</span>
                                  {isPremium ? (
                                    <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-400">
                                      <Crown size={9} /> Premium
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-white/35">Free</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Navigation */}
                          <div className="p-1.5">
                            {[
                              { id: "profile", label: "Profile", icon: User },
                              { id: "vision", label: "Vision Board", icon: ImageIcon },
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); logPageVisit(item.id); setShowMobileProfileMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/85 hover:bg-white/[0.06] transition-colors"
                              >
                                <item.icon size={16} className="text-white/55" />
                                <span>{item.label}</span>
                                {activeTab === item.id && <CheckCircle size={14} className="ml-auto text-white" />}
                              </button>
                            ))}

                            {user?.email === "asartist20@gmail.com" && (
                              <button
                                onClick={() => { setActiveTab("admin"); logPageVisit("admin"); setShowMobileProfileMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-rose-300/80 hover:bg-rose-500/10 transition-colors"
                              >
                                <Shield size={16} />
                                Admin Panel
                              </button>
                            )}
                          </div>

                          {/* Upgrade / Logout */}
                          <div className="p-1.5 border-t border-white/[0.06] space-y-1">
                            {(!isPremium || isOnTrial) && (
                              <button
                                onClick={() => { setShowPricingPage?.(true); setShowMobileProfileMenu(false); }}
                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-black bg-white hover:bg-white/90 transition-colors"
                              >
                                <span className="flex items-center gap-2"><Crown size={14} /> {isOnTrial ? 'Choose a Plan' : 'Upgrade to Premium'}</span>
                                <ChevronRight size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => { setShowMobileProfileMenu(false); signOut(); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-rose-300/80 hover:bg-rose-500/10 transition-colors"
                            >
                              <LogOut size={16} />
                              Log Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </header>

            {children}
          </main>

        </div>
      </div>

      {/* MOBILE NAV — premium white bar (iOS-style) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[120] flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{
          backgroundColor: "#ffffff",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          boxShadow:
            "0 -8px 24px rgba(0,0,0,0.06), 0 -1px 0 rgba(0,0,0,0.04)",
        }}
      >
        {[
          { id: "dashboard", label: "Affirm", icon: Sparkles },
          { id: "goals", label: "Goals", icon: Target },
          { id: "streaks", label: "Solo", icon: Flame },
          { id: "journal", label: "Journal", icon: BookOpen },
          { id: "profile", label: "Profile", icon: User },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                logPageVisit(item.id);
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer select-none active:scale-95 duration-200 min-w-[58px]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Animated active sliding background pill (soft orange) */}
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTab"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-2xl z-0"
                  style={{
                    backgroundColor: "rgba(255,159,10,0.12)",
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className="transition-all duration-300"
                  style={{
                    color: isActive ? "#ff9f0a" : "#0a0a0a",
                    transform: isActive ? "scale(1.06)" : "scale(1)",
                  }}
                />
                <span
                  className="text-[10px] leading-none transition-colors duration-300 tracking-tight"
                  style={{
                    color: isActive ? "#ff9f0a" : "rgba(10,10,10,0.55)",
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {item.id === "streaks" ? "Solo" : item.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/**
 * NavScrollToTop — tiny helper that scrolls the page to top whenever
 * the active tab changes. This makes navigation feel like separate
 * pages (Dashboard → Goals → Profile) instead of one long scroll.
 */
const NavScrollToTop: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Defer to next frame so the new tab content has time to mount
      // before we scroll — otherwise the height is still the previous
      // page's height and we land in the middle.
      requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        } catch {
          window.scrollTo(0, 0);
        }
      });
    }
  }, [activeTab]);
  return null;
};
