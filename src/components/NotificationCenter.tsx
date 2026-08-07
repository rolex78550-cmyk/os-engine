import { Bell, Mail, Smartphone, Sparkles, Shield, Clock, Zap } from "lucide-react";
import { NotificationPreferences } from "../types";

type PermissionStateLabel = "granted" | "denied" | "default" | "unsupported";

interface NotificationCenterProps {
  prefs: NotificationPreferences;
  onChange: (prefs: NotificationPreferences) => void;
  pushPermission: PermissionStateLabel;
  userEmail?: string | null;
  onRequestPushPermission: () => Promise<void> | void;
  onSendTestEmail: () => Promise<void> | void;
  onSendTestPush: () => void;
}

const toneCopy: Record<NotificationPreferences["emotionalTone"], string> = {
  soft: "Gentle, supportive reminders that reduce pressure and build trust.",
  luxury: "Premium, aspirational copy that makes rituals feel like identity upgrades.",
  intense: "High-urgency motivational copy that triggers momentum and streak protection.",
};

const Toggle = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`relative h-7 w-12 rounded-full border transition-all shrink-0 ${
      enabled ? "border-amber-300/40 bg-amber-300/25" : "border-white/10 bg-white/[0.04]"
    }`}
  >
    <span
      className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
        enabled ? "left-6 bg-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.45)]" : "left-1 bg-white/35"
      }`}
    />
  </button>
);

export default function NotificationCenter({
  prefs,
  onChange,
  pushPermission,
  userEmail,
  onRequestPushPermission,
  onSendTestEmail,
  onSendTestPush,
}: NotificationCenterProps) {
  const patch = (next: Partial<NotificationPreferences>) => onChange({ ...prefs, ...next });
  const patchTimes = (key: keyof NotificationPreferences["ritualTimes"], value: string) =>
    patch({ ritualTimes: { ...prefs.ritualTimes, [key]: value } });

  return (
    <div className="rounded-[24px] sm:rounded-[32px] bg-card-bg border border-border-subtle p-4 sm:p-6 lg:p-7 space-y-5 sm:space-y-7 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-amber-400/[0.04] blur-3xl" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-300" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-amber-200/45">Retention Notification Engine</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">Ritual Reminders & Promo Triggers</h3>
          <p className="max-w-2xl text-sm leading-6 text-white/40">
            Send emotional ritual nudges, streak protection reminders, achievement alerts, and promotional win-back messages through browser/mobile notifications and email.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-right">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Push Permission</p>
          <p className={`mt-1 text-sm font-bold ${pushPermission === "granted" ? "text-emerald-300" : pushPermission === "denied" ? "text-rose-300" : "text-amber-200"}`}>
            {pushPermission}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          {
            key: "browserPushEnabled" as const,
            icon: Smartphone,
            title: "Mobile / Browser notification bar",
            desc: "Ritual time, streak risk, achievement reveal, and comeback nudges while the app/site can schedule notifications.",
          },
          {
            key: "emailRemindersEnabled" as const,
            icon: Mail,
            title: "Email emotional reminders",
            desc: userEmail ? `Send to ${userEmail}` : "User must be signed in with email to receive email reminders.",
          },
          {
            key: "promotionalEnabled" as const,
            icon: Sparkles,
            title: "Promotional campaigns",
            desc: "Premium upgrade nudges, milestone posters, monthly wrapped, and reactivation copy.",
          },
          {
            key: "achievementAlertsEnabled" as const,
            icon: Zap,
            title: "Achievement reveal alerts",
            desc: "Confetti-style badge, XP, leaderboard, and streak milestone announcements.",
          },
        ].map(({ key, icon: Icon, title, desc }) => (
          <div key={key} className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 border border-amber-300/15">
                <Icon size={17} className="text-amber-200" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{title}</h4>
                <p className="mt-1 text-xs leading-5 text-white/38">{desc}</p>
              </div>
            </div>
            <Toggle enabled={Boolean(prefs[key])} onClick={() => patch({ [key]: !prefs[key] } as Partial<NotificationPreferences>)} />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-violet-200" />
          <h4 className="text-sm font-bold text-white">Ritual reminder schedule</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {(["morning", "noon", "night", "any"] as const).map((slot) => (
            <label key={slot} className="space-y-2">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-white/35">{slot}</span>
              <input
                type="time"
                value={prefs.ritualTimes[slot]}
                onChange={(e) => patchTimes(slot, e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-amber-300/35"
              />
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-[10px] font-mono uppercase tracking-widest text-white/35">Quiet hours start</span>
            <input
              type="time"
              value={prefs.quietHoursStart}
              onChange={(e) => patch({ quietHoursStart: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-amber-300/35"
            />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-mono uppercase tracking-widest text-white/35">Quiet hours end</span>
            <input
              type="time"
              value={prefs.quietHoursEnd}
              onChange={(e) => patch({ quietHoursEnd: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-amber-300/35"
            />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-fuchsia-200" />
          <h4 className="text-sm font-bold text-white">Emotional trigger tone</h4>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["soft", "luxury", "intense"] as const).map((tone) => (
            <button
              type="button"
              key={tone}
              onClick={() => patch({ emotionalTone: tone })}
              className={`rounded-2xl border p-4 text-left transition-all ${
                prefs.emotionalTone === tone
                  ? "border-amber-300/35 bg-amber-300/12 text-amber-50"
                  : "border-white/10 bg-black/30 text-white/45 hover:text-white"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-wider">{tone}</span>
              <p className="mt-2 text-[11px] leading-5 opacity-70">{toneCopy[tone]}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRequestPushPermission}
          className="flex-1 rounded-2xl bg-amber-300 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-amber-200"
        >
          Allow notification bar
        </button>
        <button
          type="button"
          onClick={onSendTestPush}
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
        >
          Send test push
        </button>
        <button
          type="button"
          onClick={onSendTestEmail}
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
        >
          Send test email
        </button>
      </div>

      <p className="text-[10px] leading-5 text-white/28 font-mono uppercase tracking-wider">
        Note: browser/mobile notification bar works after user permission. True background push when app is fully closed needs Firebase Cloud Messaging VAPID key + service worker deployment. Email delivery needs RESEND_API_KEY or SMTP provider on server.
      </p>
    </div>
  );
}
