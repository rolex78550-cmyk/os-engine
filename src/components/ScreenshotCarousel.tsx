import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(235,235,245,0.65)";
const TEXT_TERTIARY = "rgba(235,235,245,0.32)";
const SURFACE = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.10)";
const ORANGE = "#ff9f0a";

export interface ScreenshotItem {
  src: string;
  label: string;
  description?: string;
}

interface ScreenshotCarouselProps {
  title?: string;
  subtitle?: string;
  items?: ScreenshotItem[];
  className?: string;
}

// Default = the 7 Manifest OS app screenshots (Affirmation first)
const DEFAULT_ITEMS: ScreenshotItem[] = [
  {
    src: "/images/preview_1_affirmations.jpg",
    label: "Affirmations",
    description: "Tap to reveal. 100+ I AM declarations, Stoic quotes & shadow truths.",
  },
  {
    src: "/images/preview_6_goals.jpg",
    label: "Build your dream life",
    description: "Set goals, track milestones, claim XP for every breakthrough.",
  },
  {
    src: "/images/preview_3_solo_hub.jpg",
    label: "Solo Dominion",
    description: "9 disciplines. Body, mind, spirit — forge your shadow.",
  },
  {
    src: "/images/preview_4_tasks.jpg",
    label: "Choose your task",
    description: "Daily quests with XP rewards. Affirmation, scripting, workouts & more.",
  },
  {
    src: "/images/preview_5_369_journal.jpg",
    label: "369 Journal",
    description: "Tesla's manifestation engine. 3 morning, 6 afternoon, 9 night.",
  },
  {
    src: "/images/preview_2_vision_board.jpg",
    label: "Vision Board",
    description: "Pin your future. Stay focused on what you're building.",
  },
  {
    src: "/images/preview_7_profile.jpg",
    label: "Your rating",
    description: "Track Wisdom, Strength, Discipline, Focus. Climb the ranks.",
  },
];

export const ScreenshotCarousel: React.FC<ScreenshotCarouselProps> = ({
  title = "Every feature, mastered.",
  subtitle = "Tap, swipe, and explore — see exactly what your daily arsenal looks like.",
  items = DEFAULT_ITEMS,
  className = "",
}) => {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const goTo = (i: number) => setIndex(i);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      // Only handle if carousel is in view
      const rect = containerRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 40) {
      if (diff > 0) prev();
      else next();
    }
    setTouchStart(null);
  };

  const current = items[index];
  const progressPct = ((index + 1) / items.length) * 100;

  return (
    <section
      ref={containerRef}
      className={`py-8 px-4 sm:px-6 ${className}`}
      style={{ borderTop: `1px solid ${HAIRLINE}` }}
    >
      <div className="max-w-5xl mx-auto">
        {/* ============== HEADER ============== */}
        <div className="text-center max-w-3xl mx-auto mb-5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-[0.25em] uppercase mb-2"
            style={{
              backgroundColor: "rgba(255,159,10,0.10)",
              border: "1px solid rgba(255,159,10,0.30)",
              color: ORANGE,
            }}
          >
            ✨ Inside the app
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
          >
            {title.split(" ").slice(0, -2).join(" ")}{" "}
            <span style={{ color: ORANGE }}>
              {title.split(" ").slice(-2).join(" ")}
            </span>
          </h2>
          <p className="text-[12px] sm:text-sm mt-2" style={{ color: TEXT_SECONDARY }}>
            {subtitle}
          </p>
        </div>

        {/* ============== CAROUSEL STAGE ============== */}
        <div
          className="relative max-w-[200px] sm:max-w-[230px] mx-auto select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Backdrop / side hints */}
          <div
            className="absolute inset-0 -mx-12 sm:-mx-16 -my-4 rounded-[40px] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,159,10,0.10) 0%, rgba(0,0,0,0) 60%)",
            }}
          />

          {/* Prev/Next arrow buttons (desktop) */}
          <button
            type="button"
            onClick={prev}
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center active:scale-90 transition"
            style={{
              backgroundColor: "rgba(10,10,10,0.85)",
              border: `1px solid ${HAIRLINE}`,
              color: "#fff",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center active:scale-90 transition"
            style={{
              backgroundColor: "rgba(10,10,10,0.85)",
              border: `1px solid ${HAIRLINE}`,
              color: "#fff",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>

          {/* Phone frame */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 60, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.94 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={next}
              className="relative cursor-pointer"
            >
              <div
                className="rounded-[28px] overflow-hidden relative"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  aspectRatio: "9 / 19",
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
                }}
              >
                <img
                  src={current.src}
                  alt={`Manifest OS — ${current.label}`}
                  className="w-full h-full object-cover"
                  style={{ display: "block" }}
                  draggable={false}
                />
              </div>

              {/* Tap hint */}
              <div
                className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-[9px] font-extrabold tracking-widest uppercase"
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                Tap →
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ============== LABEL + DESCRIPTION ============== */}
        <div className="text-center mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`label-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h3
                className="text-lg sm:text-xl font-extrabold tracking-tight"
                style={{ color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}
              >
                {current.label}
              </h3>
              {current.description && (
                <p
                  className="text-[11px] sm:text-[12px] mt-1 max-w-md mx-auto leading-relaxed"
                  style={{ color: TEXT_SECONDARY }}
                >
                  {current.description}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ============== PROGRESS BAR ============== */}
        <div
          className="mt-3 mx-auto max-w-[200px] sm:max-w-[230px] h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${ORANGE} 0%, #ff7a00 100%)`,
              boxShadow: "0 0 10px rgba(255,159,10,0.4)",
            }}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* ============== DOTS ============== */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className="transition-all rounded-full"
              style={{
                width: i === index ? 22 : 6,
                height: 6,
                backgroundColor:
                  i === index ? ORANGE : "rgba(255,255,255,0.18)",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* ============== STEP COUNTER ============== */}
        <div
          className="text-center mt-2 text-[10px] font-extrabold tracking-widest uppercase"
          style={{ color: TEXT_TERTIARY }}
        >
          {index + 1} / {items.length}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotCarousel;
