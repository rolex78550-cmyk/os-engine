import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, BookOpen } from "lucide-react";

// iOS 17 + Solo Leveling ARISE design tokens
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.65)";
const TEXT_TERTIARY = "rgba(235,235,245,0.35)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_RED = "#ff453a";
const IOS_GREEN = "#34c759";

// ===================================================================
// AFFIRMATIONS — 100+ "I AM" + famous philosophy
// ===================================================================
type Affirmation = {
  text: string;
  author?: string;
  category: "i-am" | "stoic" | "nietzsche" | "rumi" | "buddha" | "growth" | "shadow";
};

const AFFIRMATIONS: Affirmation[] = [
  // ===== I AM (50) =====
  { text: "I am the master of my fate, the captain of my soul.", author: "Invictus", category: "i-am" },
  { text: "I am disciplined when no one is watching.", category: "i-am" },
  { text: "I am the storm that others take shelter from.", category: "i-am" },
  { text: "I am worthy of every dream I have ever had.", category: "i-am" },
  { text: "I am becoming stronger with every challenge I face.", category: "i-am" },
  { text: "I am focused, I am relentless, I am unshakable.", category: "i-am" },
  { text: "I am the ruler of my own kingdom.", category: "i-am" },
  { text: "I am exactly where I need to be in this moment.", category: "i-am" },
  { text: "I am building an empire, one brick at a time.", category: "i-am" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey", category: "i-am" },
  { text: "I am the architect of my destiny.", category: "i-am" },
  { text: "I am powerful beyond measure.", category: "i-am" },
  { text: "I am silence in the middle of chaos.", category: "i-am" },
  { text: "I am rare. I am chosen. I am awakened.", category: "i-am" },
  { text: "I am the hunter, not the hunted.", category: "i-am" },
  { text: "I am a king in training.", category: "i-am" },
  { text: "I am greater than my doubts.", category: "i-am" },
  { text: "I am a magnet for miracles.", category: "i-am" },
  { text: "I am in charge of how I feel, and today I choose happiness.", category: "i-am" },
  { text: "I am the one I've been waiting for.", category: "i-am" },
  { text: "I am a creator, not a consumer.", category: "i-am" },
  { text: "I am fearless in the pursuit of what sets my soul on fire.", category: "i-am" },
  { text: "I am unbreakable.", category: "i-am" },
  { text: "I am aligned with the energy of abundance.", category: "i-am" },
  { text: "I am a vessel of light in this dark world.", category: "i-am" },
  { text: "I am the shadow monarch of my own life.", category: "i-am" },
  { text: "I am patient. I am persistent. I am powerful.", category: "i-am" },
  { text: "I am worthy of love, success, and joy.", category: "i-am" },
  { text: "I am rising like the sun, even on my darkest days.", category: "i-am" },
  { text: "I am designed for greatness.", category: "i-am" },
  { text: "I am not afraid of the storm. I am the storm.", category: "i-am" },
  { text: "I am a force of nature.", category: "i-am" },
  { text: "I am always becoming, never arriving.", category: "i-am" },
  { text: "I am aligned with my highest self.", category: "i-am" },
  { text: "I am the author of my own story.", category: "i-am" },
  { text: "I am free from the need for anyone's approval.", category: "i-am" },
  { text: "I am a warrior of light.", category: "i-am" },
  { text: "I am wise enough to know my worth.", category: "i-am" },
  { text: "I am brave enough to start over.", category: "i-am" },
  { text: "I am calm in the face of uncertainty.", category: "i-am" },
  { text: "I am full of ideas, talent, and creativity.", category: "i-am" },
  { text: "I am surrounded by opportunities.", category: "i-am" },
  { text: "I am the embodiment of focus and clarity.", category: "i-am" },
  { text: "I am chosen for a purpose greater than myself.", category: "i-am" },
  { text: "I am wealthy in mind, body, and spirit.", category: "i-am" },
  { text: "I am exactly who I needed as a child.", category: "i-am" },
  { text: "I am doing the best I can with what I have.", category: "i-am" },
  { text: "I am allowed to take up space.", category: "i-am" },
  { text: "I am rebuilding myself, stronger than before.", category: "i-am" },
  { text: "I am the energy I want to attract.", category: "i-am" },

  // ===== STOIC (15) =====
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "stoic" },
  { text: "The obstacle on the path becomes the path.", author: "Marcus Aurelius", category: "stoic" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "stoic" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius", category: "stoic" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", category: "stoic" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "stoic" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", category: "stoic" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca", category: "stoic" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca", category: "stoic" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", category: "stoic" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", category: "stoic" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", category: "stoic" },
  { text: "No man is free who is not master of himself.", author: "Epictetus", category: "stoic" },
  { text: "Man is condemned to be free.", author: "Jean-Paul Sartre", category: "stoic" },
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "stoic" },

  // ===== NIETZSCHE (10) =====
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Become who you are.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "You must have chaos within you to give birth to a dancing star.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Whoever fights monsters should see to it that in the process he does not become a monster.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "Man is something that shall be overcome.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "There are no facts, only interpretations.", author: "Friedrich Nietzsche", category: "nietzsche" },

  // ===== RUMI (10) =====
  { text: "What you seek is seeking you.", author: "Rumi", category: "rumi" },
  { text: "The wound is the place where the Light enters you.", author: "Rumi", category: "rumi" },
  { text: "Don't grieve. Anything you lose comes round in another form.", author: "Rumi", category: "rumi" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", category: "rumi" },
  { text: "Set your life on fire. Seek those who fan your flames.", author: "Rumi", category: "rumi" },
  { text: "The lion is most handsome when looking for food.", author: "Rumi", category: "rumi" },
  { text: "Raise your words, not voice. It is rain that grows flowers, not thunder.", author: "Rumi", category: "rumi" },
  { text: "In your light, I learn how to love.", author: "Rumi", category: "rumi" },
  { text: "The moon stays bright when it doesn't avoid the night.", author: "Rumi", category: "rumi" },
  { text: "Be a lamp, or a lifeboat, or a ladder.", author: "Rumi", category: "rumi" },

  // ===== BUDDHA (8) =====
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "buddha" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "buddha" },
  { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha", category: "buddha" },
  { text: "The only real failure in life is not to be true to the best one knows.", author: "Buddha", category: "buddha" },
  { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else.", author: "Buddha", category: "buddha" },
  { text: "If you light a lamp for someone else, it will also brighten your path.", author: "Buddha", category: "buddha" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "buddha" },
  { text: "A man is but the product of his thoughts. What he thinks, he becomes.", author: "Mahatma Gandhi", category: "buddha" },

  // ===== GROWTH (12) =====
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "growth" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", category: "growth" },
  { text: "The successful warrior is the average person, with laser-like focus.", author: "Bruce Lee", category: "growth" },
  { text: "Do not pray for an easy life, pray for the strength to endure a difficult one.", author: "Bruce Lee", category: "growth" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Goethe", category: "growth" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "growth" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "growth" },
  { text: "Smooth seas do not make skillful sailors.", author: "Franklin D. Roosevelt", category: "growth" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry", category: "growth" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "growth" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger", category: "growth" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison", category: "growth" },

  // ===== SHADOW MONARCH (10) =====
  { text: "Arise.", author: "Shadow Monarch", category: "shadow" },
  { text: "Even the weakest light casts the darkest shadow.", category: "shadow" },
  { text: "Power isn't given. It's taken.", category: "shadow" },
  { text: "I will become a monarch, or I will die trying.", category: "shadow" },
  { text: "The only one who can defeat me is me.", category: "shadow" },
  { text: "Fear is not a weakness. It is information.", category: "shadow" },
  { text: "Every hunter must walk alone at some point.", category: "shadow" },
  { text: "Lone wolves die. The pack survives. I will lead the pack.", category: "shadow" },
  { text: "The dungeon chooses the hunter. The hunter chooses the legend.", category: "shadow" },
  { text: "Awakening is not a moment. It is a choice made every day.", category: "shadow" },
];

// Anime card background images — user's 12 new + existing
const CARD_IMAGES = [
  "/images/anime_dragon_facing.jpg",
  "/images/anime_ice_lion.jpg",
  "/images/anime_purple_hero.jpg",
  "/images/anime_shadow_army_rubble.jpg",
  "/images/anime_red_tree_wolf.jpg",
  "/images/anime_dark_hero_purple.jpg",
  "/images/anime_dark_monarch_throne.jpg",
  "/images/anime_eminence_shadow.jpg",
  "/images/anime_neutrality.jpg",
  "/images/anime_shadow_monarch_dark.jpg",
  "/images/anime_solo_standing.jpg",
  "/images/anime_igris_armor.jpg",
];

interface AffirmationHubProps {
  profile?: any;
  [k: string]: any;
}

export const AffirmationHub: React.FC<AffirmationHubProps> = (props) => {
  const { profile } = props;
  const userName = profile?.name || "Hunter";

  // ----- STATE -----
  const [currentIdx, setCurrentIdx] = useState(() => Math.floor(Math.random() * AFFIRMATIONS.length));
  const [cardImageIdx, setCardImageIdx] = useState(() => Math.floor(Math.random() * CARD_IMAGES.length));
  const [likedSet, setLikedSet] = useState<Set<number>>(() => {
    try {
      const raw = typeof window !== "undefined"
        ? window.localStorage.getItem("manifest_affirmation_likes_v1")
        : null;
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [seenCount, setSeenCount] = useState<number>(() => {
    try {
      const raw = typeof window !== "undefined"
        ? window.localStorage.getItem("manifest_affirmation_seen_v1")
        : null;
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  });
  // Today's flips (for Solo Dominion task progress — refresh on mount + when date changes)
  const todayStr = new Date().toLocaleDateString("en-CA");
  const FLIP_KEY = `manifest_affirmation_flips_${todayStr}`;
  const [todayFlips, setTodayFlips] = useState<number>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(FLIP_KEY) : null;
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  });
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // ----- PERSIST -----
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "manifest_affirmation_likes_v1",
        JSON.stringify(Array.from(likedSet))
      );
    } catch {}
  }, [likedSet]);

  useEffect(() => {
    try {
      window.localStorage.setItem("manifest_affirmation_seen_v1", String(seenCount));
    } catch {}
  }, [seenCount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FLIP_KEY, String(todayFlips));
      // Persist task progress to manifest_task_progress_v1 (so Solo Dominion sees it)
      const raw = window.localStorage.getItem("manifest_task_progress_v1");
      const progress = raw ? JSON.parse(raw) : {};
      const prev = Number(progress.affirmation) || 0;
      // Use the larger of the two values to handle parallel updates
      progress.affirmation = Math.max(prev, todayFlips);
      window.localStorage.setItem("manifest_task_progress_v1", JSON.stringify(progress));
    } catch {}
  }, [todayFlips, FLIP_KEY]);

  // Listen for midnight reset
  useEffect(() => {
    const onReset = () => {
      setTodayFlips(0);
      setSeenCount(0);
    };
    window.addEventListener("manifest_tasks_reset", onReset as EventListener);
    return () => window.removeEventListener("manifest_tasks_reset", onReset as EventListener);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Listen for XP-awarded toast from App.tsx
  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setToast({ msg: detail.msg, type: detail.type || "ok" });
      }
    };
    window.addEventListener("manifest_toast", onToast as EventListener);
    return () => window.removeEventListener("manifest_toast", onToast as EventListener);
  }, []);

  const showToast = (msg: string, type: "ok" | "err" = "ok") =>
    setToast({ msg, type });

  // ----- TAP → NEXT RANDOM -----
  const showRandomCard = useCallback(() => {
    let nextAff = Math.floor(Math.random() * AFFIRMATIONS.length);
    if (AFFIRMATIONS.length > 1) {
      let safety = 0;
      while (nextAff === currentIdx && safety < 10) {
        nextAff = Math.floor(Math.random() * AFFIRMATIONS.length);
        safety++;
      }
    }
    let nextImg = Math.floor(Math.random() * CARD_IMAGES.length);
    let safety2 = 0;
    while (nextImg === cardImageIdx && safety2 < 10) {
      nextImg = Math.floor(Math.random() * CARD_IMAGES.length);
      safety2++;
    }
    setCurrentIdx(nextAff);
    setCardImageIdx(nextImg);
    setSeenCount((c) => c + 1);
    // Synchronously increment today flips + persist (so bridge listener reads correct value)
    setTodayFlips((c) => {
      const next = c + 1;
      try {
        const todayStr = new Date().toLocaleDateString("en-CA");
        window.localStorage.setItem(`manifest_affirmation_flips_${todayStr}`, String(next));
        // Also persist to Solo Dominion task progress
        const raw = window.localStorage.getItem("manifest_task_progress_v1");
        const progress = raw ? JSON.parse(raw) : {};
        const prev = Number(progress.affirmation) || 0;
        progress.affirmation = Math.max(prev, next);
        window.localStorage.setItem("manifest_task_progress_v1", JSON.stringify(progress));
      } catch {}
      return next;
    });
    // Dispatch global event so App.tsx can award 50 XP on every 10th flip
    window.dispatchEvent(new CustomEvent("manifest_affirmation_flip"));
    window.dispatchEvent(new CustomEvent("manifest_sfx_whoosh"));
  }, [currentIdx, cardImageIdx]);

  // ----- LIKE -----
  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentIdx)) {
        newSet.delete(currentIdx);
        showToast("Removed", "ok");
      } else {
        newSet.add(currentIdx);
        showToast("Saved", "ok");
        window.dispatchEvent(new CustomEvent("manifest_sfx_notify"));
      }
      return newSet;
    });
  };

  const current = AFFIRMATIONS[currentIdx];
  const cardImage = CARD_IMAGES[cardImageIdx];
  const isLiked = likedSet.has(currentIdx);

  return (
    <div
      className="min-h-screen relative font-sans flex flex-col"
      style={{ backgroundColor: "#000", color: TEXT_PRIMARY }}
    >
      {/* =================== FULL OPACITY BG IMAGE (JINWOO warrior sunset) =================== */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/images/affirmation_jinwoo_bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: 1,
        }}
      />

      {/* =================== DARK GRADIENT OVER BG (so card + text pop) =================== */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.70) 100%)",
        }}
      />

      {/* =================== MINIMAL TOP STRIP =================== */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2"
        style={{ minHeight: 56 }}
      >
        <div
          className="px-3 py-1.5 rounded-full text-[10.5px] font-extrabold tracking-[0.2em] uppercase tabular-nums"
          style={{
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.78)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {seenCount} witnessed
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{
            backgroundColor: "rgba(0,0,0,0.78)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(14px)",
            color: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <BookOpen size={14} />
        </button>
      </div>

      {/* =================== MAIN: TAP-TO-CHANGE CARD =================== */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-2"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        <div
          className="w-full max-w-[420px] cursor-pointer"
          onClick={showRandomCard}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${cardImageIdx}`}
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -6 }}
              transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "9 / 14",
                minHeight: 540,
                backgroundColor: "#0a0a0a",
                borderRadius: 24,
                border: `1px solid ${HAIRLINE_STRONG}`,
              }}
            >
              {/* ============== ANIME BG (FULL OPACITY) ============== */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${cardImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* ============== TEXT-AREA GRADIENT ONLY (top + bottom for legibility) ============== */}
              <div
                className="absolute inset-x-0 top-0 h-24 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.0) 100%)",
                }}
              />

              {/* ============== TOP HEART BUTTON ============== */}
              <button
                onClick={toggleLike}
                className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition"
                style={{
                  backgroundColor: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(14px)",
                  border: `1px solid ${isLiked ? IOS_RED : "rgba(255,255,255,0.22)"}`,
                }}
              >
                <Heart
                  size={20}
                  fill={isLiked ? IOS_RED : "transparent"}
                  color={isLiked ? IOS_RED : "#fff"}
                  strokeWidth={2.2}
                />
              </button>

              {/* ============== BOTTOM TEXT BLOCK ============== */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                <div
                  className="text-[10px] font-extrabold tracking-[0.3em] uppercase mb-3"
                  style={{ color: ORANGE }}
                >
                  Tap to reveal
                </div>
                <h2
                  className="font-extrabold tracking-tight leading-[1.05]"
                  style={{
                    color: "#fff",
                    fontSize: "clamp(22px, 5.8vw, 30px)",
                    letterSpacing: "-0.03em",
                    textShadow: "0 2px 18px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  {current.text}
                </h2>
                {current.author && (
                  <div
                    className="mt-3 text-[12px] font-semibold italic"
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                    }}
                  >
                    — {current.author}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* =================== BOTTOM TASK PROGRESS (Solo Dominion link) =================== */}
      <div className="relative z-10 px-5 pb-8 pt-3 space-y-2.5">
        {/* Progress bar */}
        <div
          className="mx-auto max-w-[420px] px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: "rgba(0,0,0,0.78)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className="text-[10px] font-extrabold tracking-[0.2em] uppercase"
              style={{ color: "#ffffff" }}
            >
              📖 Affirmation Reading
            </div>
            <div
              className="text-[10px] font-extrabold tabular-nums"
              style={{ color: todayFlips >= 10 ? "#34c759" : ORANGE }}
            >
              {Math.min(todayFlips, 10)} / 10
            </div>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (todayFlips / 10) * 100)}%`,
                background:
                  todayFlips >= 10
                    ? "linear-gradient(90deg, #34c759, #2da44e)"
                    : `linear-gradient(90deg, ${ORANGE_DARK || "#ff7a00"}, ${ORANGE})`,
              }}
            />
          </div>
          <div
            className="text-[10px] mt-1.5 font-medium"
            style={{ color: todayFlips >= 10 ? "#34c759" : "rgba(235,235,245,0.6)" }}
          >
            {todayFlips >= 10
              ? "✓ Task complete — 50 XP awarded. Keep flipping for more truth."
              : `Flip ${10 - todayFlips} more card${10 - todayFlips === 1 ? "" : "s"} to complete the task + 50 XP`}
          </div>
        </div>
        <div
          className="text-center text-[10px] font-extrabold tracking-[0.3em] uppercase"
          style={{ color: TEXT_TERTIARY }}
        >
          Tap card · next truth
        </div>
      </div>

      {/* =================== INFO MODAL =================== */}
      {showInfo && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowInfo(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-extrabold tracking-widest uppercase"
                style={{ color: ORANGE }}
              >
                About
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-lg"
                style={{ color: TEXT_TERTIARY }}
              >
                <X size={16} />
              </button>
            </div>
            <h2
              className="font-extrabold text-2xl mb-2 tracking-tight"
              style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
            >
              The Power of Affirmation
            </h2>
            <p
              className="text-[12.5px] mb-4 leading-relaxed"
              style={{ color: TEXT_SECONDARY }}
            >
              {AFFIRMATIONS.length} declarations from world-class philosophers,
              warriors, and awakened masters. Tap the card to receive the next
              truth the universe has for you.
            </p>
            <div className="space-y-2 mb-4">
              <h3
                className="text-[10px] font-extrabold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                How to use
              </h3>
              {[
                "Tap the card to reveal a new affirmation",
                "Heart the ones that resonate with your soul",
                "Read them aloud, three times, with conviction",
                "Flip 10 cards → Affirmation Reading task complete (+50 XP)",
                `${seenCount} truths witnessed · ${likedSet.size} saved · ${todayFlips} today`,
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ORANGE }}
                  />
                  <span className="text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="text-center text-[10px] font-bold tracking-widest uppercase py-2"
              style={{ color: TEXT_TERTIARY }}
            >
              Arise.
            </div>
          </div>
        </div>
      )}

      {/* =================== TOAST =================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)",
            backgroundColor:
              toast.type === "ok" ? "rgba(52,199,89,0.95)" : "rgba(255,69,58,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 140,
          }}
        >
          {toast.type === "ok" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AffirmationHub;
