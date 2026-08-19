import React, { useState, useRef } from "react";
import {
  ChevronRight,
  Bell,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  Edit3,
  Camera,
} from "lucide-react";
import { resolveImageUrl } from "../../lib/imageHelper";

// Design tokens (iOS 17 + Solo Leveling ARISE style — NO NEON)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_GREEN = "#34c759";
const IOS_RED = "#ff453a";

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
  // ... other fields kept for compat but unused
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

// Compute Wisdom / Confidence / Strength / Discipline / Focus from profile
function computeAttributes(profile: ProfileState) {
  const totalXp = Number(profile.totalXp) || Number(profile.xp) || 0;
  const level = Number(profile.level) || 1;
  const streak = Number(profile.streak) || 0;
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
  hasPaidAccess,
  handleUpgradeClick,
  setActiveTab,
  logPageVisit,
  updateUserProfile,
  setShowManifestOnboarding,
  signOut,
  notificationPrefs,
  pushPermission,
  requestPushPermission,
}) => {
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

  // Edit bio modal state
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);

  const segments = 28;
  const filled = Math.round((xpPct / 100) * segments);

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100vh", color: TEXT_PRIMARY }}
    >
      {/* ===================== TOP BAR ===================== */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center font-extrabold"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${HAIRLINE_STRONG}`,
              color: TEXT_PRIMARY,
              fontSize: 15,
              backgroundColor: SURFACE,
            }}
          >
            M
          </div>
          <div className="flex flex-col">
            <div
              className="font-extrabold tracking-tight leading-none"
              style={{ color: TEXT_PRIMARY, fontSize: 16, letterSpacing: "-0.01em" }}
            >
              MANIFEST OS
            </div>
            <div
              className="text-[10px] mt-0.5 uppercase tracking-wider"
              style={{ color: TEXT_TERTIARY }}
            >
              Profile
            </div>
          </div>
        </div>
        <button
          onClick={() => (setActiveTab ? setActiveTab("settings") : null)}
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE_STRONG}`,
            color: TEXT_PRIMARY,
          }}
        >
          <SettingsIcon size={16} />
        </button>
      </div>

      {/* ===================== HERO PROFILE ===================== */}
      <section className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-4">
          {/* Avatar with orange ring */}
          <div className="relative shrink-0">
            <div
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 84,
                height: 84,
                border: `2.5px solid ${ORANGE}`,
                backgroundColor: SURFACE,
              }}
            >
              <img
                src={avatar}
                alt={userName}
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
            </div>
            {/* Tiny edit dot */}
            <button
              className="absolute -bottom-1 -right-1 flex items-center justify-center"
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: ORANGE,
                color: "#000",
                border: `2.5px solid #000`,
              }}
            >
              <Camera size={12} strokeWidth={2.5} />
            </button>
          </div>

          {/* Name + tier */}
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
              style={{ color: ORANGE }}
            >
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
            className="shrink-0 p-1.5 rounded-lg transition active:scale-95"
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

        {/* Slanted Level + XP earned card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE}`,
            minHeight: 180,
          }}
        >
          {/* Slanted orange Level card (left) */}
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

          {/* Right: XP earned */}
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

          {/* Segmented XP bar */}
          <div className="absolute left-4 right-4 bottom-16 flex items-center gap-0.5">
            {Array.from({ length: segments }).map((_, i) => {
              const isFilled = i < filled;
              return (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-[1.5px]"
                  style={{
                    backgroundColor: isFilled ? ORANGE : "rgba(255,255,255,0.05)",
                  }}
                />
              );
            })}
          </div>

          {/* XP to next level */}
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
      </section>

      {/* ===================== STATS LIST (Wisdom / Confidence / Strength / Discipline / Focus) ===================== */}
      <section className="px-4 pt-5 pb-4">
        {[
          { key: "wisdom", label: "Wisdom", icon: "💡", color: "#a78bfa", val: attrs.wisdom },
          { key: "confidence", label: "Confidence", icon: "▲", color: "#34c759", val: attrs.confidence },
          { key: "strength", label: "Strength", icon: "💪", color: "#ff453a", val: attrs.strength },
          { key: "discipline", label: "Discipline", icon: "🔒", color: "#5e5ce6", val: attrs.discipline },
          { key: "focus", label: "Focus", icon: "◎", color: "#0a84ff", val: attrs.focus },
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

      {/* ===================== CTA: SEE POTENTIAL RATING ===================== */}
      <section className="px-4 pt-3 pb-6">
        <button
          onClick={() => (setShowManifestOnboarding ? setShowManifestOnboarding(true) : null)}
          className="w-full py-4 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
          style={{
            backgroundColor: ORANGE,
            color: "#000",
            boxShadow: "0 8px 24px rgba(255,159,10,0.25)",
          }}
        >
          <span style={{ fontSize: 18 }}>⚡</span>
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
              setBioDraft(bio);
              setEditingBio(true);
            }}
          />
          <Divider />
          {/* Notifications */}
          <SettingsRow
            icon={<Bell size={16} />}
            label="Notifications"
            value={
              pushPermission === "granted"
                ? "On"
                : pushPermission === "denied"
                ? "Off"
                : "Default"
            }
            onClick={() => (requestPushPermission ? requestPushPermission() : null)}
          />
          <Divider />
          {/* Manage subscription */}
          <SettingsRow
            icon={
              <span style={{ fontSize: 14 }}>💎</span>
            }
            label="Subscription"
            value={isPremium ? "Active" : hasPaidAccess ? "Active" : "Free"}
            onClick={() => (handleUpgradeClick ? handleUpgradeClick() : null)}
          />
          <Divider />
          {/* Sign out */}
          <SettingsRow
            icon={<LogOut size={16} />}
            label="Sign out"
            danger
            onClick={() => (signOut ? signOut() : null)}
          />
        </div>

        {/* App version footer */}
        <div
          className="text-center text-[10px] mt-6"
          style={{ color: TEXT_TERTIARY }}
        >
          Manifest OS · v1.0.0
        </div>
      </section>

      {/* ===================== EDIT BIO MODAL ===================== */}
      {editingBio && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setEditingBio(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: TEXT_TERTIARY }}
            >
              Edit Bio
            </div>
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
            <div className="flex gap-2">
              <button
                onClick={() => setEditingBio(false)}
                className="flex-1 py-3 rounded-xl font-bold text-[13px]"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  color: TEXT_PRIMARY,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (updateUserProfile) {
                    try {
                      await updateUserProfile({ bio: bioDraft });
                    } catch {}
                  }
                  setEditingBio(false);
                }}
                className="flex-1 py-3 rounded-xl font-extrabold text-[13px]"
                style={{ backgroundColor: ORANGE, color: "#000" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== HELPERS =====================
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  danger?: boolean;
  onClick?: () => void;
}> = ({ icon, label, value, danger, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition active:opacity-60"
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
  <div
    className="h-px ml-[60px]"
    style={{ backgroundColor: HAIRLINE }}
  />
);

export default ProfileView;
