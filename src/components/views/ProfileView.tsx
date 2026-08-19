import React, { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Bell,
  BellOff,
  LogOut,
  User as UserIcon,
  Edit3,
  Camera,
  Crown,
  Check,
  X,
  Plus,
  Save,
  Trash2,
  Award,
  Sparkles,
} from "lucide-react";
import { resolveImageUrl } from "../../lib/imageHelper";

// Design tokens (iOS 17 + Solo Leveling ARISE — NO NEON)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const SURFACE_RAISED = "#141414";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";
const IOS_BLUE = "#0a84ff";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Hunter&backgroundColor=0a0a0a";

interface ProfileState {
  name?: string;
  level?: number;
  xp?: number;
  totalXp?: number;
  streak?: number;
  bio?: string;
  avatarUrl?: string;
  universeRank?: string;
  identityArchetype?: string;
  [k: string]: any;
}

interface ProfileViewProps {
  user: any;
  profile: ProfileState;
  isPremium?: boolean;
  isOnTrial?: boolean;
  hasPaidAccess?: boolean;
  subscription?: any;
  notificationPrefs?: any;
  setNotificationPrefs?: (prefs: any) => void;
  pushPermission?: string;
  requestPushPermission?: () => Promise<void>;
  sendTestPush?: () => void;
  sendTestEmail?: () => Promise<void>;
  handleUpgradeClick?: () => void;
  rituals?: any[];
  desires?: any[];
  journalEntries?: any[];
  visionItems?: any[];
  communityPosts?: any[];
  todayStr?: string;
  setActiveTab?: (tab: any) => void;
  logPageVisit?: (page: string) => void;
  setNotificationMsg?: (msg: string | null) => void;
  updateUserProfile?: (updates: Partial<ProfileState>) => Promise<void>;
  setShowManifestOnboarding?: (val: boolean) => void;
  signOut?: () => void;
}

function computeAttributes(profile: ProfileState) {
  const totalXp = Number(profile.totalXp) || Number(profile.xp) || 0;
  const level = Number(profile.level) || 1;
  const base = Math.floor((totalXp + level * 50) / 12);
  return {
    wisdom: base + (profile.wisdom ? Number(profile.wisdom) : 0),
    confidence: base + (profile.confidence ? Number(profile.confidence) : 0),
    strength: base + (profile.strength ? Number(profile.strength) : 0),
    discipline: base + (profile.discipline ? Number(profile.discipline) : 0),
    focus: base + (profile.focus ? Number(profile.focus) : 0),
  };
}

function getRankTitle(level: number): { name: string; tier: string } {
  if (level >= 50) return { name: "LEGENDARY MONARCH", tier: "Tier V" };
  if (level >= 35) return { name: "SHADOW MONARCH", tier: "Tier IV" };
  if (level >= 20) return { name: "NATIONAL HUNTER", tier: "Tier III" };
  if (level >= 10) return { name: "RISING HUNTER", tier: "Tier II" };
  if (level >= 5) return { name: "SEEKER", tier: "Tier I" };
  return { name: "AWAKENED", tier: "Tier 0" };
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  isPremium,
  isOnTrial,
  hasPaidAccess,
  subscription,
  handleUpgradeClick,
  setActiveTab,
  logPageVisit,
  updateUserProfile,
  setShowManifestOnboarding,
  signOut,
  notificationPrefs,
  setNotificationPrefs,
  pushPermission,
  requestPushPermission,
  sendTestPush,
  sendTestEmail,
}) => {
  // ============== DERIVED VALUES ==============
  const userName = profile.name || user?.displayName || "Seeker";
  const level = Number(profile.level) || 1;
  const totalXp = Number(profile.totalXp) || Number(profile.xp) || 0;
  const xpInLevel = totalXp % 1000;
  const xpForNextLevel = 1000;
  const xpPct = Math.round((xpInLevel / xpForNextLevel) * 100);
  const streak = Number(profile.streak) || 0;
  const bio = profile.bio || "Hunting shadows. Building empires. One rep at a time.";
  const avatar = resolveImageUrl(profile.avatarUrl) || FALLBACK_AVATAR;
  const attrs = computeAttributes(profile);
  const rank = getRankTitle(level);
  const segments = 28;
  const filled = Math.round((xpPct / 100) * segments);

  // ============== LOCAL STATE ==============
  const [editingBio, setEditingBio] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [nameDraft, setNameDraft] = useState(userName);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState(profile.avatarUrl || "");
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [showAvatarSource, setShowAvatarSource] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarVersion, setAvatarVersion] = useState(0); // cache buster

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Log page visit
  useEffect(() => {
    if (logPageVisit) logPageVisit("profile");
  }, [logPageVisit]);

  // ============== HANDLERS ==============
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    // Trigger SFX via custom event
    try {
      window.dispatchEvent(
        new CustomEvent(type === "ok" ? "manifest_sfx_success" : "manifest_sfx_error")
      );
    } catch {}
  };

  const saveBio = async () => {
    if (!bioDraft.trim()) {
      showToast("Bio cannot be empty", "err");
      return;
    }
    if (updateUserProfile) {
      try {
        await updateUserProfile({ bio: bioDraft });
        showToast("Bio updated", "ok");
        setEditingBio(false);
      } catch (e) {
        showToast("Failed to save bio", "err");
      }
    } else {
      setEditingBio(false);
    }
  };

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft.length < 2) {
      showToast("Name must be at least 2 characters", "err");
      return;
    }
    if (updateUserProfile) {
      try {
        await updateUserProfile({ name: nameDraft });
        showToast("Name updated", "ok");
        setEditingName(false);
      } catch (e) {
        showToast("Failed to save name", "err");
      }
    } else {
      setEditingName(false);
    }
  };

  const saveAvatarUrl = async () => {
    if (!avatarUrlDraft.trim()) {
      showToast("Please enter a valid URL", "err");
      return;
    }
    if (updateUserProfile) {
      try {
        await updateUserProfile({ avatarUrl: avatarUrlDraft });
        setAvatarVersion((v) => v + 1);
        showToast("Avatar updated", "ok");
        setShowAvatarSource(false);
      } catch (e) {
        showToast("Failed to save avatar", "err");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (updateUserProfile) {
        try {
          await updateUserProfile({ avatarUrl: dataUrl });
          setAvatarVersion((v) => v + 1);
          showToast("Avatar uploaded", "ok");
        } catch (err) {
          showToast("Failed to upload", "err");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleNotifications = async () => {
    if (pushPermission === "granted") {
      // Already on
      if (setNotificationPrefs) {
        setNotificationPrefs({ ...(notificationPrefs || {}), enabled: false });
        showToast("Notifications muted", "ok");
      }
    } else if (pushPermission === "denied") {
      showToast("Enable in browser settings", "err");
    } else {
      if (requestPushPermission) {
        try {
          await requestPushPermission();
          showToast("Notifications enabled", "ok");
        } catch {
          showToast("Permission denied", "err");
        }
      }
    }
  };

  const doSignOut = () => {
    setShowConfirmSignOut(false);
    if (signOut) signOut();
  };

  const addDemoXP = async (delta: number) => {
    if (updateUserProfile) {
      try {
        const newTotal = totalXp + delta;
        const newLevel = Math.floor(newTotal / 1000) + 1;
        await updateUserProfile({
          totalXp: newTotal,
          xp: newTotal,
          level: newLevel,
        });
        showToast(`+${delta} XP added`, "ok");
      } catch (e) {
        showToast("Failed to add XP", "err");
      }
    }
  };

  const addDemoStreak = async () => {
    if (updateUserProfile) {
      try {
        await updateUserProfile({ streak: streak + 1 });
        showToast("Streak +1", "ok");
      } catch {
        showToast("Failed to add streak", "err");
      }
    }
  };

  const clearAllData = async () => {
    if (
      window.confirm(
        "Reset all profile stats? This will reset XP, level, and streak to defaults."
      )
    ) {
      if (updateUserProfile) {
        try {
          await updateUserProfile({
            totalXp: 0,
            xp: 0,
            level: 1,
            streak: 0,
          });
          showToast("Profile reset", "ok");
        } catch {
          showToast("Reset failed", "err");
        }
      }
    }
  };

  // ============== RENDER ==============
  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh", color: TEXT_PRIMARY }}
    >
      {/* ===================== ANIME BACKGROUND ===================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url(/images/sd_jin_shadow_army.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          backgroundRepeat: "no-repeat",
          opacity: 0.18,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.25) 100%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative z-10">
        {/* (Top bar removed — MainLayout already provides app header with
            page title, brand, notification bell, and subscribe CTA) */}

        {/* ===================== HERO PROFILE ===================== */}
        <section className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-4">
            {/* Avatar with orange ring */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowAvatarSource(true)}
                className="rounded-full overflow-hidden flex items-center justify-center active:scale-95 transition"
                style={{
                  width: 84,
                  height: 84,
                  border: `2.5px solid ${ORANGE}`,
                  backgroundColor: SURFACE,
                  padding: 0,
                }}
                aria-label="Change avatar"
              >
                <img
                  key={avatarVersion}
                  src={avatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                  style={{ display: "block" }}
                />
              </button>
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex items-center justify-center active:scale-90 transition"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: ORANGE,
                  color: "#000",
                  border: `2.5px solid #000`,
                }}
                aria-label="Upload avatar"
              >
                <Camera size={12} strokeWidth={2.5} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>

            {/* Name + tier */}
            <div className="flex-1 min-w-0">
              <div
                className="text-[10px] font-bold tracking-widest uppercase mb-0.5 flex items-center gap-1.5"
                style={{ color: ORANGE }}
              >
                <Crown size={11} strokeWidth={2.5} />
                {rank.tier}
              </div>
              <h1
                className="font-extrabold leading-none truncate"
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: "clamp(1.4rem, 4.5vw, 1.85rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {userName}
              </h1>
              <div
                className="text-[11px] mt-1.5 truncate"
                style={{ color: TEXT_SECONDARY }}
              >
                {rank.name}
              </div>
            </div>

            {/* Edit name icon */}
            <button
              onClick={() => {
                setNameDraft(userName);
                setEditingName(true);
              }}
              className="shrink-0 p-2 rounded-lg active:scale-90 transition"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_SECONDARY,
              }}
              aria-label="Edit name"
            >
              <Edit3 size={14} />
            </button>
          </div>

          {/* Bio */}
          <div className="mt-4 flex items-start gap-2">
            <p
              className="flex-1 text-[13px] leading-relaxed"
              style={{ color: TEXT_SECONDARY }}
            >
              {bio}
            </p>
            <button
              onClick={() => {
                setBioDraft(bio);
                setEditingBio(true);
              }}
              className="shrink-0 p-1.5 rounded-lg transition active:scale-90"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${HAIRLINE}`,
                color: TEXT_TERTIARY,
              }}
              aria-label="Edit bio"
            >
              <Edit3 size={13} />
            </button>
          </div>
        </section>

        {/* ===================== YOUR CURRENT RATING CARD ===================== */}
        <section className="px-4 pt-5">
          <h2
            className="font-extrabold leading-[1.1] tracking-tight mb-3 px-1"
            style={{
              color: TEXT_PRIMARY,
              fontSize: "clamp(1.5rem, 4.5vw, 2rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Your Current <span style={{ color: ORANGE }}>Rating</span>{" "}
            <span style={{ fontSize: 14, verticalAlign: "middle" }}>🔱</span>
          </h2>

          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${HAIRLINE}`,
              minHeight: 180,
            }}
          >
            <div
              className="absolute top-3 left-3 flex flex-col items-center justify-center"
              style={{
                width: 130,
                height: 130,
                backgroundColor: ORANGE,
                transform: "skewX(-8deg)",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(255,159,10,0.3)",
              }}
            >
              <div
                className="font-extrabold leading-none"
                style={{
                  color: "#000",
                  fontSize: 60,
                  letterSpacing: "-0.04em",
                  transform: "skewX(8deg)",
                }}
              >
                {level}
              </div>
              <div
                className="text-[10px] font-extrabold tracking-widest uppercase mt-1"
                style={{ color: "#000", transform: "skewX(8deg)" }}
              >
                Level
              </div>
            </div>

            <div className="absolute top-6 right-5 text-right">
              <div
                className="font-extrabold leading-none"
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 36,
                  letterSpacing: "-0.03em",
                }}
              >
                {xpInLevel}
              </div>
              <div
                className="text-[11px] font-semibold mt-1"
                style={{ color: TEXT_SECONDARY }}
              >
                XP earned
              </div>
            </div>

            <div className="absolute left-4 right-4 bottom-16 flex items-center gap-0.5">
              {Array.from({ length: segments }).map((_, i) => {
                const isFilled = i < filled;
                return (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-[1.5px]"
                    style={{
                      backgroundColor: isFilled
                        ? ORANGE
                        : "rgba(255,255,255,0.05)",
                    }}
                  />
                );
              })}
            </div>

            <div
              className="absolute left-4 bottom-4 text-[11px]"
              style={{ color: TEXT_SECONDARY }}
            >
              <span style={{ color: ORANGE, fontWeight: 700 }}>
                {Math.max(0, xpForNextLevel - xpInLevel)} XP
              </span>{" "}
              to Lvl {level + 1}
            </div>
          </div>

          {/* Streak row */}
          <div
            className="mt-3 flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>🔥</span>
              <span
                className="text-[13px] font-bold"
                style={{ color: TEXT_PRIMARY }}
              >
                Current Streak
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[22px] font-extrabold tabular-nums"
                style={{ color: ORANGE, letterSpacing: "-0.02em" }}
              >
                {streak}
              </span>
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: TEXT_TERTIARY }}
              >
                days
              </span>
            </div>
          </div>
        </section>

        {/* ===================== STATS LIST ===================== */}
        <section className="px-4 pt-5 pb-4">
          {[
            { key: "wisdom", label: "Wisdom", icon: "💡", color: "#a78bfa", val: attrs.wisdom },
            { key: "confidence", label: "Confidence", icon: "▲", color: IOS_GREEN, val: attrs.confidence },
            { key: "strength", label: "Strength", icon: "💪", color: IOS_RED, val: attrs.strength },
            { key: "discipline", label: "Discipline", icon: "🔒", color: "#5e5ce6", val: attrs.discipline },
            { key: "focus", label: "Focus", icon: "◎", color: IOS_BLUE, val: attrs.focus },
          ].map((s) => (
            <div
              key={s.key}
              className="flex items-center py-3 border-b"
              style={{ borderColor: HAIRLINE }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mr-3 shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${HAIRLINE}`,
                  color: s.color,
                  fontSize: 16,
                }}
              >
                {s.icon}
              </div>
              <div
                className="flex-1 text-[15px] font-bold"
                style={{ color: TEXT_PRIMARY, letterSpacing: "-0.005em" }}
              >
                {s.label}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: IOS_GREEN, fontSize: 12 }}>▲</span>
                <span
                  className="text-[28px] font-extrabold tabular-nums leading-none"
                  style={{ color: TEXT_PRIMARY, letterSpacing: "-0.03em" }}
                >
                  {s.val}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* ===================== DEMO ACTIONS (debug XP/streak) ===================== */}
        <section className="px-4 pt-3 pb-4">
          <h3
            className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1"
            style={{ color: TEXT_TERTIARY }}
          >
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addDemoXP(50)}
              className="py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${HAIRLINE}`,
                color: ORANGE,
              }}
            >
              <Plus size={12} strokeWidth={2.5} />50 XP
            </button>
            <button
              onClick={() => addDemoXP(200)}
              className="py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${HAIRLINE}`,
                color: ORANGE,
              }}
            >
              <Plus size={12} strokeWidth={2.5} />200 XP
            </button>
            <button
              onClick={addDemoStreak}
              className="py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${HAIRLINE}`,
                color: ORANGE,
              }}
            >
              <Plus size={12} strokeWidth={2.5} />Streak
            </button>
          </div>
        </section>

        {/* ===================== CTA: SEE POTENTIAL RATING ===================== */}
        <section className="px-4 pt-3 pb-6">
          <button
            onClick={() => {
              if (setShowManifestOnboarding) setShowManifestOnboarding(true);
              showToast("Reopening assessment…", "ok");
            }}
            className="w-full py-4 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{
              backgroundColor: ORANGE,
              color: "#000",
              boxShadow: "0 8px 24px rgba(255,159,10,0.25)",
            }}
          >
            <Sparkles size={16} strokeWidth={2.5} />
            See potential rating
          </button>
          <p
            className="text-[10.5px] text-center mt-2.5"
            style={{ color: TEXT_TERTIARY }}
          >
            Retake the AI assessment to recalculate your stats and rank.
          </p>
        </section>

        {/* ===================== SETTINGS LIST ===================== */}
        <section className="px-4 pt-2 pb-20">
          <h3
            className="text-[10px] font-bold tracking-widest uppercase mb-3 px-1"
            style={{ color: TEXT_TERTIARY }}
          >
            Settings
          </h3>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            {/* Edit profile */}
            <SettingsRow
              icon={<UserIcon size={16} />}
              label="Edit profile"
              onClick={() => {
                setNameDraft(userName);
                setBioDraft(bio);
                setEditingName(true);
              }}
            />
            <Divider />
            {/* Notifications — actually toggles */}
            <SettingsRow
              icon={
                pushPermission === "granted" ? (
                  <Bell size={16} />
                ) : (
                  <BellOff size={16} />
                )
              }
              label="Notifications"
              value={
                pushPermission === "granted"
                  ? "On"
                  : pushPermission === "denied"
                  ? "Blocked"
                  : "Off"
              }
              onClick={toggleNotifications}
            />
            {pushPermission === "granted" && sendTestPush && (
              <>
                <Divider />
                <SettingsRow
                  icon={<Award size={16} />}
                  label="Send test push"
                  onClick={() => {
                    sendTestPush();
                    showToast("Test push sent", "ok");
                  }}
                />
              </>
            )}
            <Divider />
            {/* Manage subscription */}
            <SettingsRow
              icon={<span style={{ fontSize: 14 }}>💎</span>}
              label="Subscription"
              value={isPremium ? "Premium" : isOnTrial ? "Trial" : hasPaidAccess ? "Active" : "Free"}
              onClick={() => {
                if (handleUpgradeClick) {
                  handleUpgradeClick();
                  showToast("Opening pricing…", "ok");
                }
              }}
            />
            <Divider />
            {/* Reset data */}
            <SettingsRow
              icon={<Trash2 size={16} />}
              label="Reset profile stats"
              danger
              onClick={clearAllData}
            />
            <Divider />
            {/* Sign out */}
            <SettingsRow
              icon={<LogOut size={16} />}
              label="Sign out"
              danger
              onClick={() => setShowConfirmSignOut(true)}
            />
          </div>

          <div
            className="text-center text-[10px] mt-6"
            style={{ color: TEXT_TERTIARY }}
          >
            Manifest OS · v1.0.0
          </div>
        </section>
      </div>

      {/* ===================== TOAST ===================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
            backgroundColor:
              toast.type === "ok" ? "rgba(52,199,89,0.95)" : "rgba(255,69,58,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 200,
          }}
        >
          {toast.type === "ok" ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ===================== MODAL: EDIT BIO ===================== */}
      {editingBio && (
        <Modal onClose={() => setEditingBio(false)} title="Edit Bio">
          <textarea
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            maxLength={140}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none resize-none"
            style={{
              backgroundColor: "#000",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
              fontFamily: "inherit",
            }}
            placeholder="Tell us about your journey..."
          />
          <div
            className="text-[10px] text-right mt-1 mb-3"
            style={{ color: TEXT_TERTIARY }}
          >
            {bioDraft.length}/140
          </div>
          <ModalActions
            onCancel={() => setEditingBio(false)}
            onConfirm={saveBio}
            confirmLabel="Save"
          />
        </Modal>
      )}

      {/* ===================== MODAL: EDIT NAME ===================== */}
      {editingName && (
        <Modal onClose={() => setEditingName(false)} title="Edit Name">
          <label
            className="text-[10px] font-bold tracking-widest uppercase mb-1.5 block"
            style={{ color: TEXT_TERTIARY }}
          >
            Display Name
          </label>
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={32}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
            style={{
              backgroundColor: "#000",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
              fontFamily: "inherit",
            }}
            placeholder="Your name"
          />
          <div
            className="text-[10px] text-right mt-1 mb-3"
            style={{ color: TEXT_TERTIARY }}
          >
            {nameDraft.length}/32
          </div>
          <ModalActions
            onCancel={() => setEditingName(false)}
            onConfirm={saveName}
            confirmLabel="Save"
          />
        </Modal>
      )}

      {/* ===================== MODAL: AVATAR SOURCE ===================== */}
      {showAvatarSource && (
        <Modal onClose={() => setShowAvatarSource(false)} title="Change Avatar">
          <p
            className="text-[12px] mb-3"
            style={{ color: TEXT_SECONDARY }}
          >
            Choose how you want to set your profile picture.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowAvatarSource(false);
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 active:scale-95 transition"
              style={{
                backgroundColor: ORANGE,
                color: "#000",
              }}
            >
              <Camera size={14} /> Upload from device
            </button>
            <button
              onClick={() => {
                setShowAvatarSource(false);
                setAvatarUrlDraft(profile.avatarUrl || "");
                setTimeout(() => setShowAvatarSource(true), 50);
                // Reopen with URL input
              }}
              className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 active:scale-95 transition"
              style={{
                backgroundColor: SURFACE,
                color: TEXT_PRIMARY,
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <Save size={14} /> Use image URL
            </button>
          </div>
          {avatarUrlDraft !== undefined && (
            <div className="mt-3">
              <label
                className="text-[10px] font-bold tracking-widest uppercase mb-1.5 block"
                style={{ color: TEXT_TERTIARY }}
              >
                Image URL
              </label>
              <input
                type="url"
                value={avatarUrlDraft}
                onChange={(e) => setAvatarUrlDraft(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                style={{
                  backgroundColor: "#000",
                  border: `1px solid ${HAIRLINE}`,
                  color: TEXT_PRIMARY,
                  fontFamily: "inherit",
                }}
                placeholder="https://..."
              />
              <button
                onClick={saveAvatarUrl}
                className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-bold active:scale-95 transition"
                style={{
                  backgroundColor: ORANGE,
                  color: "#000",
                }}
              >
                Save URL
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ===================== MODAL: SIGN OUT CONFIRM ===================== */}
      {showConfirmSignOut && (
        <Modal onClose={() => setShowConfirmSignOut(false)} title="Sign out?">
          <p
            className="text-[13px] mb-4"
            style={{ color: TEXT_SECONDARY }}
          >
            You'll need to sign in again to access your profile and stats.
          </p>
          <ModalActions
            onCancel={() => setShowConfirmSignOut(false)}
            onConfirm={doSignOut}
            confirmLabel="Sign out"
            danger
          />
        </Modal>
      )}
    </div>
  );
};

// ===================== REUSABLE MODAL =====================
const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
    style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5"
      style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: TEXT_TERTIARY }}
        >
          {title}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg active:scale-90"
          style={{ color: TEXT_TERTIARY }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  danger?: boolean;
}> = ({ onCancel, onConfirm, confirmLabel, danger }) => (
  <div className="flex gap-2">
    <button
      onClick={onCancel}
      className="flex-1 py-3 rounded-xl font-bold text-[13px] active:scale-95 transition"
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${HAIRLINE}`,
        color: TEXT_PRIMARY,
      }}
    >
      Cancel
    </button>
    <button
      onClick={onConfirm}
      className="flex-1 py-3 rounded-xl font-extrabold text-[13px] active:scale-95 transition"
      style={{
        backgroundColor: danger ? IOS_RED : ORANGE,
        color: danger ? "#fff" : "#000",
      }}
    >
      {confirmLabel}
    </button>
  </div>
);

// ===================== SETTINGS ROW =====================
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  danger?: boolean;
  onClick?: () => void;
}> = ({ icon, label, value, danger, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition active:opacity-60 active:scale-[0.99]"
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: `1px solid ${HAIRLINE}`,
        color: danger ? IOS_RED : TEXT_PRIMARY,
      }}
    >
      {icon}
    </div>
    <span
      className="flex-1 text-[14px] font-semibold"
      style={{ color: danger ? IOS_RED : TEXT_PRIMARY }}
    >
      {label}
    </span>
    {value && (
      <span
        className="text-[12px] font-medium"
        style={{ color: TEXT_TERTIARY }}
      >
        {value}
      </span>
    )}
    <ChevronRight size={16} style={{ color: TEXT_TERTIARY }} />
  </button>
);

const Divider: React.FC = () => (
  <div className="h-px ml-[60px]" style={{ backgroundColor: HAIRLINE }} />
);

export default ProfileView;
