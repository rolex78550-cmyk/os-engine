import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, Share2, Heart, RotateCw, Shuffle,
  Sparkles, X, BookOpen, Filter
} from "lucide-react";

// iOS 17 + Solo Leveling ARISE design tokens (no neon)
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

// ===================================================================
// AFFIRMATION COLLECTIONS — 100+ "I AM" + famous philosophy lines
// ===================================================================
type Affirmation = {
  text: string;
  author?: string;
  category: "i-am" | "stoic" | "nietzsche" | "marcus" | "rumi" | "buddha" | "growth" | "shadow";
};

const AFFIRMATIONS: Affirmation[] = [
  // ===== I AM (50 lines) =====
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

  // ===== STOIC PHILOSOPHY (15) =====
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
  { text: "I am a forest, and a night of dark trees: but he who is not afraid of my darkness, will find banks full of roses under my cypresses.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "You must have chaos within you to give birth to a dancing star.", author: "Friedrich Nietzsche", category: "nietzsche" },
  { text: "The man of knowledge must be able not only to love his enemies but also to hate his friends.", author: "Friedrich Nietzsche", category: "nietzsche" },
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

  // ===== BUDDHA / ORIENTAL (8) =====
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "buddha" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "buddha" },
  { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha", category: "buddha" },
  { text: "The only real failure in life is not to be true to the best one knows.", author: "Buddha", category: "buddha" },
  { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else.", author: "Buddha", category: "buddha" },
  { text: "If you light a lamp for someone else, it will also brighten your path.", author: "Buddha", category: "buddha" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "buddha" },
  { text: "A man is but the product of his thoughts. What he thinks, he becomes.", author: "Mahatma Gandhi", category: "buddha" },

  // ===== GROWTH / DISCIPLINE (12) =====
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

  // ===== SHADOW MONARCH / SOLO LEVELING THEMED (10) =====
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

// Anime card background images (use existing assets)
const CARD_IMAGES = [
  "/images/sd_jin_hero.jpg",
  "/images/sd_jin_redeye.jpg",
  "/images/sd_jin_throne.jpg",
  "/images/sd_jin_shadow_army.jpg",
  "/images/sd_jin_blue_eyes.jpg",
  "/images/sd_jin_warrior_sunset.jpg",
  "/images/sd_jin_minimal.jpg",
  "/images/sd_jin_black.jpg",
  "/images/sd_jin_mirror.jpg",
  "/images/sd_jin_portrait.jpg",
];

// Category labels + colors
const CATEGORIES: Array<{ id: Affirmation["category"]; label: string; color: string }> = [
  { id: "i-am", label: "I AM", color: ORANGE },
  { id: "stoic", label: "Stoic", color: "#a78bfa" },
  { id: "nietzsche", label: "Nietzsche", color: IOS_RED },
  { id: "marcus", label: "Marcus", color: "#0a84ff" },
  { id: "rumi", label: "Rumi", color: "#5e5ce6" },
  { id: "buddha", label: "Buddha", color: "#34c759" },
  { id: "growth", label: "Growth", color: ORANGE },
  { id: "shadow", label: "Shadow", color: "#ff453a" },
];

interface AffirmationHubProps {
  profile?: any;
  [k: string]: any;
}

export const AffirmationHub: React.FC<AffirmationHubProps> = (props) => {
  const { profile } = props;
  const userName = profile?.name || "Hunter";

  // ----- STATE -----
  const [activeCategory, setActiveCategory] = useState<Affirmation["category"] | "all">("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
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
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // ----- FILTERED LIST -----
  const list = useMemo(() => {
    if (activeCategory === "all") return AFFIRMATIONS;
    return AFFIRMATIONS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  // Reset index when filter changes
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [activeCategory]);

  // Persist likes
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "manifest_affirmation_likes_v1",
        JSON.stringify(Array.from(likedSet))
      );
    } catch {}
  }, [likedSet]);

  // Persist seen
  useEffect(() => {
    try {
      window.localStorage.setItem("manifest_affirmation_seen_v1", String(seenCount));
    } catch {}
  }, [seenCount]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") =>
    setToast({ msg, type });

  const current = list[index] || AFFIRMATIONS[0];
  const cardImage = CARD_IMAGES[index % CARD_IMAGES.length];

  // ----- NAVIGATION -----
  const next = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i + 1) % list.length);
    setSeenCount((c) => c + 1);
    window.dispatchEvent(new CustomEvent("manifest_sfx_whoosh"));
  }, [list.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i - 1 + list.length) % list.length);
    setSeenCount((c) => c + 1);
    window.dispatchEvent(new CustomEvent("manifest_sfx_whoosh"));
  }, [list.length]);

  const shuffle = useCallback(() => {
    setFlipped(false);
    let nextIdx = Math.floor(Math.random() * list.length);
    if (list.length > 1) {
      while (nextIdx === index) {
        nextIdx = Math.floor(Math.random() * list.length);
      }
    }
    setIndex(nextIdx);
    setSeenCount((c) => c + 1);
    window.dispatchEvent(new CustomEvent("manifest_sfx_success"));
  }, [list.length, index]);

  const flip = useCallback(() => {
    setFlipped((f) => !f);
    window.dispatchEvent(new CustomEvent("manifest_sfx_click"));
  }, []);

  // ----- LIKE / SHARE -----
  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        showToast("Removed from favorites", "ok");
      } else {
        newSet.add(index);
        showToast("Saved to favorites", "ok");
        window.dispatchEvent(new CustomEvent("manifest_sfx_notify"));
      }
      return newSet;
    });
  };

  const shareCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: "Manifest OS · Affirmation",
      text: `"${current.text}"${current.author ? ` — ${current.author}` : ""}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n\n— from Manifest OS`
        );
        showToast("Copied to clipboard", "ok");
        window.dispatchEvent(new CustomEvent("manifest_sfx_notify"));
      }
    } catch {
      // user cancelled
    }
  };

  // ----- KEYBOARD NAVIGATION -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, flip]);

  // ----- SWIPE HANDLERS -----
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prev();
      else next();
    }
    setTouchStart(null);
  };

  const isLiked = likedSet.has(index);
  const catMeta = CATEGORIES.find((c) => c.id === current.category);

  return (
    <div
      className="min-h-screen relative font-sans"
      style={{ backgroundColor: "#000", color: TEXT_PRIMARY }}
    >
      {/* =================== ANIME WARRIOR BACKGROUND =================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url(/images/affirmation_jinwoo_warrior.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: 0.4,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,159,10,0.10) 0%, rgba(0,0,0,0) 50%)",
        }}
      />

      <div className="relative z-10 px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-32">
        {/* =================== HEADER =================== */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className="text-[10px] font-extrabold tracking-[0.25em] uppercase flex items-center gap-1.5"
              style={{ color: ORANGE }}
            >
              <Sparkles size={11} /> {seenCount} witnessed
            </div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1"
              style={{ color: TEXT_PRIMARY, letterSpacing: "-0.03em" }}
            >
              Affirmations
            </h1>
            <p
              className="text-[11px] sm:text-xs font-medium mt-0.5"
              style={{ color: TEXT_SECONDARY }}
            >
              {userName}, speak the words of a monarch into existence.
            </p>
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
            }}
          >
            <BookOpen size={15} />
          </button>
        </div>

        {/* =================== CATEGORY CHIPS =================== */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            onClick={() => setActiveCategory("all")}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap active:scale-95 transition"
            style={{
              backgroundColor: activeCategory === "all" ? ORANGE : "rgba(255,255,255,0.05)",
              color: activeCategory === "all" ? "#000" : TEXT_PRIMARY,
              border: `1px solid ${activeCategory === "all" ? ORANGE : HAIRLINE}`,
            }}
          >
            All · {AFFIRMATIONS.length}
          </button>
          {CATEGORIES.map((c) => {
            const count = AFFIRMATIONS.filter((a) => a.category === c.id).length;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap active:scale-95 transition"
                style={{
                  backgroundColor: isActive ? c.color : "rgba(255,255,255,0.05)",
                  color: isActive ? "#000" : TEXT_PRIMARY,
                  border: `1px solid ${isActive ? c.color : HAIRLINE}`,
                }}
              >
                {c.label} · {count}
              </button>
            );
          })}
        </div>

        {/* =================== INSTANT CARD =================== */}
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-[420px] select-none"
            style={{ perspective: 1400 }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${index}-${flipped}`}
                initial={{ rotateY: flipped ? -180 : 0, opacity: 0, scale: 0.96 }}
                animate={{ rotateY: flipped ? 180 : 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
                onClick={flip}
                className="relative w-full cursor-pointer"
                style={{
                  transformStyle: "preserve-3d",
                  aspectRatio: "9 / 14",
                  minHeight: 540,
                }}
              >
                {/* ============ FRONT ============ */}
                <div
                  className="absolute inset-0 rounded-[28px] overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    border: `1px solid ${HAIRLINE_STRONG}`,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
                  }}
                >
                  {/* Image background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${cardImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.92) 100%)",
                    }}
                  />

                  {/* Top status pill */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div
                      className="px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid rgba(255,255,255,0.12)`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: catMeta?.color || ORANGE }}
                      />
                      <span
                        className="text-[9.5px] font-extrabold tracking-widest uppercase"
                        style={{ color: "#fff" }}
                      >
                        {catMeta?.label || "Affirmation"}
                      </span>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold tracking-widest uppercase"
                      style={{
                        backgroundColor: ORANGE,
                        color: "#000",
                      }}
                    >
                      {index + 1} / {list.length}
                    </div>
                  </div>

                  {/* Center "A" logo or initial (Instagram-style) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
                    <div
                      className="font-black"
                      style={{ color: "#fff", fontSize: 280, lineHeight: 1 }}
                    >
                      A
                    </div>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <div
                      className="text-[10px] font-extrabold tracking-[0.25em] uppercase mb-2"
                      style={{ color: ORANGE }}
                    >
                      Tap to flip
                    </div>
                    <h2
                      className="font-extrabold tracking-tight leading-[1.05]"
                      style={{
                        color: "#fff",
                        fontSize: "clamp(20px, 5.4vw, 30px)",
                        letterSpacing: "-0.03em",
                        textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                      }}
                    >
                      {current.text}
                    </h2>
                  </div>
                </div>

                {/* ============ BACK ============ */}
                <div
                  className="absolute inset-0 rounded-[28px] overflow-hidden p-6 sm:p-7 flex flex-col justify-between"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background:
                      "linear-gradient(160deg, #0a0a0a 0%, #141414 100%)",
                    border: `1px solid ${HAIRLINE_STRONG}`,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-25 pointer-events-none"
                    style={{
                      backgroundImage: `url(${cardImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(28px) saturate(0.6)",
                    }}
                  />

                  <div className="relative z-10">
                    <div
                      className="text-[10px] font-extrabold tracking-[0.25em] uppercase mb-2"
                      style={{ color: ORANGE }}
                    >
                      Reflection
                    </div>
                    <h2
                      className="font-extrabold tracking-tight leading-[1.1]"
                      style={{
                        color: TEXT_PRIMARY,
                        fontSize: "clamp(18px, 4.6vw, 24px)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {current.text}
                    </h2>
                    {current.author && (
                      <div
                        className="mt-3 text-[12px] font-semibold italic"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        — {current.author}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 space-y-2.5">
                    <div
                      className="text-[10px] font-extrabold tracking-widest uppercase"
                      style={{ color: TEXT_TERTIARY }}
                    >
                      Speak it
                    </div>
                    <p
                      className="text-[13px] font-medium leading-relaxed"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      Read this aloud, three times, with conviction. Let the words
                      settle into your bones. You are what you repeat.
                    </p>
                    <div
                      className="pt-3 flex items-center gap-2"
                      style={{ borderTop: `1px solid ${HAIRLINE}` }}
                    >
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: TEXT_TERTIARY }}
                      >
                        Category
                      </span>
                      <span
                        className="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${catMeta?.color || ORANGE}22`,
                          color: catMeta?.color || ORANGE,
                        }}
                      >
                        {catMeta?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* =================== LIKE / SHARE OVERLAYS (Front) =================== */}
            {!flipped && (
              <>
                <button
                  onClick={toggleLike}
                  className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${isLiked ? IOS_RED : "rgba(255,255,255,0.18)"}`,
                  }}
                >
                  <Heart
                    size={18}
                    fill={isLiked ? IOS_RED : "transparent"}
                    color={isLiked ? IOS_RED : "#fff"}
                    strokeWidth={2.2}
                  />
                </button>
                <button
                  onClick={shareCard}
                  className="absolute bottom-32 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid rgba(255,255,255,0.18)`,
                  }}
                >
                  <Share2 size={16} color="#fff" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* =================== NAVIGATION =================== */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={prev}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={shuffle}
            className="px-4 h-11 rounded-full flex items-center gap-2 active:scale-95 transition"
            style={{
              backgroundColor: ORANGE,
              color: "#000",
              boxShadow: "0 6px 20px rgba(255,159,10,0.3)",
            }}
          >
            <Shuffle size={14} strokeWidth={2.5} />
            <span className="text-[12px] font-extrabold tracking-widest uppercase">
              Shuffle
            </span>
          </button>

          <button
            onClick={flip}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="Flip"
          >
            <RotateCw size={15} />
          </button>

          <button
            onClick={next}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `1px solid ${HAIRLINE}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* =================== PROGRESS DOTS =================== */}
        <div className="mt-4 flex items-center justify-center gap-1">
          {list.slice(0, Math.min(list.length, 12)).map((_, i) => {
            const isActive = i === index % Math.min(list.length, 12);
            return (
              <div
                key={i}
                className="h-1 rounded-full transition-all"
                style={{
                  width: isActive ? 22 : 6,
                  backgroundColor: isActive ? ORANGE : "rgba(255,255,255,0.15)",
                }}
              />
            );
          })}
        </div>

        {/* =================== FAVORITES =================== */}
        {likedSet.size > 0 && (
          <section
            className="mt-6 rounded-2xl p-4"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5"
                style={{ color: TEXT_PRIMARY }}
              >
                <Heart size={11} fill={IOS_RED} color={IOS_RED} />
                Favorites · {likedSet.size}
              </h3>
              <button
                onClick={() => {
                  setLikedSet(new Set());
                  showToast("Favorites cleared", "ok");
                }}
                className="text-[10px] font-bold"
                style={{ color: TEXT_TERTIARY }}
              >
                Clear
              </button>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {Array.from(likedSet).slice(0, 10).map((idx) => {
                const a = AFFIRMATIONS[idx];
                if (!a) return null;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setIndex(idx);
                      setFlipped(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl active:scale-[0.99] flex items-center gap-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ORANGE }}
                    />
                    <span
                      className="text-[12px] font-semibold line-clamp-1 flex-1"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {a.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
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
              An affirmation is more than words — it is a signal sent from your
              mind to the universe. {AFFIRMATIONS.length} declarations from
              world-class philosophers, warriors, and awakened masters.
            </p>
            <div className="space-y-2 mb-4">
              <h3
                className="text-[10px] font-extrabold tracking-widest uppercase"
                style={{ color: TEXT_TERTIARY }}
              >
                How to use
              </h3>
              {[
                "Tap the card to flip it",
                "Swipe or use arrows to navigate",
                "Press shuffle for a random hit",
                "Heart the ones that resonate",
                "Speak them aloud, three times",
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
              Arise. · {AFFIRMATIONS.length} truths loaded
            </div>
          </div>
        </div>
      )}

      {/* =================== TOAST =================== */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
            backgroundColor:
              toast.type === "ok" ? "rgba(52,199,89,0.95)" : "rgba(255,69,58,0.95)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: 180,
          }}
        >
          {toast.type === "ok" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AffirmationHub;
