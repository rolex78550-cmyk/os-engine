import React, { useState, useEffect } from "react";
import { useFirebase } from "../FirebaseProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from "firebase/firestore";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const IOS_GREEN = "#34c759";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  xp: number;
  totalXP: number;
  rankTitle: string;
  isYou?: boolean;
  avatar?: string;
  uid?: string;
}

interface LeaderboardViewProps {
  onBack: () => void;
  /** Optional: pass current user stats to inject "You" entry if not in top 100 */
  currentUserStats?: {
    uid: string;
    name: string;
    level: number;
    xp: number;
    rankTitle: string;
  };
}

function deriveRankTitle(level: number): string {
  if (level >= 50) return "Shadow Monarch";
  if (level >= 35) return "Monarch";
  if (level >= 20) return "National Hunter";
  if (level >= 10) return "A-Rank";
  if (level >= 5) return "B-Rank";
  return "Seeker";
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
  currentUserStats,
}) => {
  const { user } = useFirebase();
  const [tab, setTab] = useState<"all" | "weekly" | "guild">("all");
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============== FETCH REAL LEADERBOARD FROM FIRESTORE ==============
  useEffect(() => {
    setLoading(true);
    setError(null);

    let q;
    try {
      if (tab === "all") {
        q = query(
          collection(db, "users"),
          orderBy("totalXp", "desc"),
          limit(100)
        );
      } else if (tab === "weekly") {
        q = query(
          collection(db, "users"),
          orderBy("weeklyXp", "desc"),
          limit(100)
        );
      } else {
        // Guild tab — use totalXp (Firestore doesn't have guilds yet)
        q = query(
          collection(db, "users"),
          orderBy("totalXp", "desc"),
          limit(100)
        );
      }
    } catch (e: any) {
      setError("Failed to load leaderboard");
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: LeaderboardEntry[] = snap.docs.map((d, i) => {
          const v = d.data() as any;
          const totalXP = Number(v.totalXp) || Number(v.xp) || 0;
          const level = Number(v.level) || 1;
          return {
            rank: i + 1,
            name: v.name || v.displayName || "Anonymous Hunter",
            level,
            xp: totalXP,
            totalXP,
            rankTitle: v.universeRank || deriveRankTitle(level),
            avatar: v.avatarUrl,
            uid: d.id,
            isYou: user?.uid === d.id,
          };
        });

        // If current user not in top 100, add them as "You" at the end
        if (currentUserStats && !data.some((e) => e.uid === currentUserStats.uid)) {
          data.push({
            rank: data.length + 1,
            name: currentUserStats.name || "You",
            level: currentUserStats.level,
            xp: currentUserStats.xp,
            totalXP: currentUserStats.xp,
            rankTitle:
              currentUserStats.rankTitle ||
              deriveRankTitle(currentUserStats.level),
            uid: currentUserStats.uid,
            isYou: true,
          });
        }

        setEntries(data);
        setLoading(false);
      },
      (err) => {
        console.warn("[Leaderboard] snapshot error:", err?.message);
        setError("Could not load live leaderboard");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [tab, user?.uid, currentUserStats?.uid]);

  const tabLabel = (t: "all" | "weekly" | "guild") =>
    t === "all" ? "All Time" : t === "weekly" ? "This Week" : "Guild";

  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: "#000", minHeight: "100dvh" }}
    >
      {/* ===================== TOP BAR ===================== */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ backgroundColor: "#000", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <button
          onClick={onBack}
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
          ←
        </button>
        <div className="flex flex-col items-center">
          <div
            className="font-extrabold tracking-tight leading-none"
            style={{ color: TEXT_PRIMARY, fontSize: 16, letterSpacing: "-0.01em" }}
          >
            Leaderboard
          </div>
          <div
            className="text-[10px] mt-0.5 uppercase tracking-wider"
            style={{ color: TEXT_TERTIARY }}
          >
            Live · {entries.length} hunters
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE_STRONG}`,
            color: ORANGE,
          }}
        >
          ランキング
        </div>
      </div>

      {/* ===================== HERO HEADER ===================== */}
      <section className="px-5 pt-5 pb-2">
        <h1
          className="font-extrabold leading-[1.1] tracking-tight mb-3 px-1"
          style={{
            color: TEXT_PRIMARY,
            fontSize: "clamp(1.5rem, 4.5vw, 2rem)",
            letterSpacing: "-0.02em",
          }}
        >
          Top <span style={{ color: ORANGE }}>hunters</span>.
        </h1>

        {/* Tabs */}
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-2xl"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
        >
          {(["all", "weekly", "guild"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="py-2 rounded-xl text-[12px] font-bold transition-colors"
                style={{
                  backgroundColor: active ? ORANGE : "transparent",
                  color: active ? "#000" : TEXT_SECONDARY,
                }}
              >
                {tabLabel(t)}
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================== TOP 3 PODIUM ===================== */}
      {entries.length >= 3 && (
        <section className="px-4 pt-6">
          <div className="grid grid-cols-3 gap-2">
            {entries.slice(0, 3).map((e, idx) => {
              const heights = ["h-[110px]", "h-[140px]", "h-[100px]"];
              const order = [1, 0, 2];
              const e2 = entries[order[idx]];
              if (!e2) return null;
              return (
                <div key={e2.uid || e2.rank} className="flex flex-col items-center">
                  <div
                    className="flex items-center justify-center font-extrabold text-[14px] mb-1.5"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: SURFACE,
                      border: `2px solid ${
                        e2.rank === 1 ? ORANGE : HAIRLINE_STRONG
                      }`,
                      color: TEXT_PRIMARY,
                    }}
                  >
                    {e2.avatar ? (
                      <img
                        src={e2.avatar}
                        alt={e2.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      e2.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div
                    className="text-[10px] font-bold truncate w-full text-center"
                    style={{
                      color: e2.isYou ? ORANGE : TEXT_PRIMARY,
                    }}
                  >
                    {e2.isYou ? "YOU" : e2.name}
                  </div>
                  <div
                    className="text-[9px] tabular-nums"
                    style={{ color: TEXT_TERTIARY }}
                  >
                    LV {e2.level}
                  </div>
                  <div
                    className={`mt-2 w-full ${heights[idx]} rounded-t-xl flex items-center justify-center font-extrabold text-[20px]`}
                    style={{
                      backgroundColor: SURFACE,
                      border: `1px solid ${
                        e2.rank === 1 ? ORANGE : HAIRLINE
                      }`,
                      borderBottom: "none",
                      color: e2.rank === 1 ? ORANGE : TEXT_PRIMARY,
                    }}
                  >
                    {e2.rank}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== LOADING / ERROR STATES ===================== */}
      {loading && entries.length === 0 && (
        <section className="px-4 py-12 text-center">
          <div
            className="inline-block w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: ORANGE, borderTopColor: "transparent" }}
          />
          <p
            className="text-[12px] mt-3"
            style={{ color: TEXT_TERTIARY }}
          >
            Loading top hunters…
          </p>
        </section>
      )}

      {error && (
        <section className="px-4 py-8 text-center">
          <p
            className="text-[12px]"
            style={{ color: "#ff453a" }}
          >
            {error}
          </p>
        </section>
      )}

      {!loading && entries.length === 0 && !error && (
        <section className="px-4 py-12 text-center">
          <p
            className="text-[12px]"
            style={{ color: TEXT_TERTIARY }}
          >
            No hunters yet. Be the first!
          </p>
        </section>
      )}

      {/* ===================== RANKINGS LIST ===================== */}
      {entries.length > 0 && (
        <section className="px-4 pt-6 pb-16">
          <div
            className="text-[10px] font-bold tracking-widest uppercase mb-3 px-1"
            style={{ color: TEXT_TERTIARY }}
          >
            Full Rankings
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            {entries.map((e, idx) => {
              const isHovered = hoveredRank === e.rank;
              return (
                <div
                  key={e.uid || e.rank}
                  onMouseEnter={() => setHoveredRank(e.rank)}
                  onMouseLeave={() => setHoveredRank(null)}
                  className="flex items-center gap-3 px-3 py-3 transition-colors"
                  style={{
                    borderTop: idx === 0 ? "none" : `1px solid ${HAIRLINE}`,
                    backgroundColor: e.isYou
                      ? "rgba(255,159,10,0.08)"
                      : isHovered
                      ? "rgba(255,255,255,0.02)"
                      : "transparent",
                  }}
                >
                  <div
                    className="flex items-center justify-center font-extrabold text-[13px] tabular-nums shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor:
                        e.rank <= 3 ? ORANGE : "rgba(255,255,255,0.05)",
                      color: e.rank <= 3 ? "#000" : TEXT_PRIMARY,
                    }}
                  >
                    {e.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-bold truncate"
                        style={{
                          color: e.isYou ? ORANGE : TEXT_PRIMARY,
                        }}
                      >
                        {e.isYou ? "You" : e.name}
                      </span>
                      {e.isYou && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider"
                          style={{
                            backgroundColor: ORANGE,
                            color: "#000",
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: TEXT_TERTIARY }}
                    >
                      {e.rankTitle} · LV {e.level}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className="text-[13px] font-extrabold tabular-nums"
                      style={{
                        color: e.rank <= 3 ? ORANGE : TEXT_PRIMARY,
                      }}
                    >
                      {e.totalXP.toLocaleString()}
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-wider uppercase"
                      style={{ color: TEXT_TERTIARY }}
                    >
                      Total XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default LeaderboardView;
