import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, X, BookOpen
} from "lucide-react";

// iOS 17 + Solo Leveling ARISE design tokens (no neon)
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.62)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.18)";
const ORANGE = "#ff9f0a";
const ORANGE_DARK = "#ff7a00";
const IOS_RED = "#ff453a";

// ===================================================================
// AFFIRMATION COLLECTIONS — 100+ "I AM" + famous philosophy lines
// ===================================================================
type Affirmation = {
  text: string;
  author?: string;
  category: "i-am" | "stoic" | "nietzsche" | "rumi" | "buddha" | "growth" | "shadow";
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

// Anime card background images (vary each shuffle)
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

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 1500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") =>
    setToast({ msg, type });

  // ----- CORE ACTION: tap card → next random affirmation -----
  const showRandomCard = useCallback(() => {
    let nextAff = Math.floor(Math.random() * AFFIRMATIONS.length);
    // ensure different from current
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
    window.dispatchEvent(new CustomEvent("manifest_sfx_whoosh"));
  }, [currentIdx, cardImageIdx]);

  // ----- LIKE (single click won't navigate) -----
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
      {/* =================== ANIME BG (5-8% opacity, very subtle) =================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url(/images/affirmation_jinwoo_warrior.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: 0.07,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,159,10,0.05) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      {/* =================== MINIMAL TOP STRIP (only info icon + counter) =================== */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2"
        style={{ minHeight: 56 }}
      >
        <div
          className="text-[10px] font-extrabold tracking-[0.25em] uppercase tabular-nums"
          style={{ color: TEXT_TERTIARY }}
        >
          {seenCount} witnessed
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: `1px solid ${HAIRLINE}`,
            color: TEXT_SECONDARY,
          }}
        >
          <BookOpen size={14} />
        </button>
      </div>

      {/* =================== MAIN: JUST THE TAP-TO-CHANGE CARD =================== */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-2"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        <div
          className="w-full max-w-[420px] cursor-pointer"
          style={{ perspective: 1400 }}
          onClick={showRandomCard}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${cardImageIdx}`}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative w-full"
              style={{
                aspectRatio: "9 / 14",
                minHeight: 540,
              }}
            >
              <div
                className="absolute inset-0 rounded-[28px] overflow-hidden"
                style={{
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
                      "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.94) 100%)",
                  }}
                />

                {/* Top-right heart (single subtle button) */}
                <button
                  onClick={toggleLike}
                  className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${isLiked ? IOS_RED : "rgba(255,255,255,0.18)"}`,
                  }}
                >
                  <Heart
                    size={20}
                    fill={isLiked ? IOS_RED : "transparent"}
                    color={isLiked ? IOS_RED : "#fff"}
                    strokeWidth={2.2}
                  />
                </button>

                {/* Center big "A" watermark (Instagram-style) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]">
                  <div
                    className="font-black"
                    style={{ color: "#fff", fontSize: 320, lineHeight: 1 }}
                  >
                    A
                  </div>
                </div>

                {/* Bottom content */}
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
                      fontSize: "clamp(22px, 5.8vw, 32px)",
                      letterSpacing: "-0.03em",
                      textShadow: "0 2px 14px rgba(0,0,0,0.65)",
                    }}
                  >
                    {current.text}
                  </h2>
                  {current.author && (
                    <div
                      className="mt-3 text-[12px] font-semibold italic"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      — {current.author}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* =================== BOTTOM HINT (no buttons, just a hint) =================== */}
      <div className="relative z-10 px-5 pb-8 pt-2 flex items-center justify-center">
        <div
          className="text-[10px] font-extrabold tracking-[0.3em] uppercase"
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
                `${seenCount} truths witnessed so far · ${likedSet.size} saved`,
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
