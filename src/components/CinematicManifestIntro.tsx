import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Play, Pause, SkipForward } from 'lucide-react';

interface CinematicManifestIntroProps {
  onComplete: () => void;
  userName?: string;
}

const MOTION_SLIDES = [
  { id: 1, title: "THE SYSTEM AWAKENS", subtitle: "MENIFEST OS × SOLO LEVELING", description: "You were chosen. The shadows have been waiting.", accent: "#fbbf24" },
  { id: 2, title: "HUNTER PROTOCOL", subtitle: "LEVEL 1 — AWAKENED", description: "Rise from the ordinary. Claim your rank.", accent: "#f472b6" },
  { id: 3, title: "THE MANIFEST SYSTEM", subtitle: "REALITY REWRITTEN", description: "Every desire. Every quest. Every ritual. Becomes power.", accent: "#a78bfa" },
  { id: 4, title: "YOUR FIRST ASCENSION", subtitle: "DAILY QUESTS • RITUALS • DESIRES", description: "Complete the trials. Level up. Manifest your throne.", accent: "#34d399" },
  { id: 5, title: "BECOME THE SOVEREIGN", subtitle: "YOUR JOURNEY BEGINS NOW", description: "This is not a dream. This is your new reality.", accent: "#fbbf24" },
];

// PROFESSIONAL MOTION GRAPHIC VIDEO EXPERIENCE
export default function CinematicManifestIntro({ onComplete, userName }: CinematicManifestIntroProps) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());

  const slide = MOTION_SLIDES[current];
  const SLIDE_DURATION = 5200;

  // === ULTRA PROFESSIONAL MOTION GRAPHIC CANVAS ===
  const drawMotionVideo = (ctx: CanvasRenderingContext2D, t: number, slideIdx: number) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const p = ((t % SLIDE_DURATION) / SLIDE_DURATION);

    // === SCENE 1: SYSTEM AWAKENING ===
    if (slideIdx === 0) {
      // Pulsing core
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(w/2, h*0.48, 9 + Math.sin(t/220)*6, 0, Math.PI*2);
      ctx.fill();

      // Expanding rings (very video-like)
      for (let i = 0; i < 4; i++) {
        const r = 60 + (p + i*0.25) % 1 * 210;
        ctx.strokeStyle = `rgba(251,191,36,${0.7 - (p + i*0.25)%1 * 0.65})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w/2, h*0.48, r, 0, Math.PI*2);
        ctx.stroke();
      }

      // Floating system runes
      ctx.fillStyle = '#f4c542';
      ctx.font = '13px monospace';
      const runes = ['MANIFEST', 'OS', 'SYSTEM', 'ACTIVATED'];
      runes.forEach((rune, i) => {
        const x = w * 0.22 + Math.sin(t / 900 + i) * 60;
        const y = h * 0.32 + i * 38 + Math.cos(t / 1100) * 12;
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(t / 650 + i) * 0.4;
        ctx.fillText(rune, x, y);
        ctx.restore();
      });
    }

    // === SCENE 2: HUNTER PROTOCOL ===
    else if (slideIdx === 1) {
      // Rank level up effect
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const angle = (t / 400 + i) % (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(w * 0.5 + Math.cos(angle) * 90, h * 0.45 + Math.sin(angle) * 40, 26 + i * 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 11px monospace';
      ctx.fillText("LEVEL 1", w * 0.42, h * 0.38);
      ctx.fillText("AWAKENED", w * 0.42, h * 0.38 + 22);
    }

    // === SCENE 3: MANIFEST SYSTEM ===
    else if (slideIdx === 2) {
      // Holographic interface
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1;
      const cx = w / 2, cy = h * 0.52;

      // Rotating hex
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t / 1800);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * 115, Math.sin(a) * 115);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Floating desires
      ctx.fillStyle = '#c4b5fd';
      ctx.font = '12px monospace';
      ['WEALTH', 'POWER', 'FREEDOM'].forEach((txt, i) => {
        const y = cy - 70 + i * 48 + Math.sin(t / 900 + i) * 9;
        ctx.fillText(txt, cx - 80 + Math.cos(t / 1200 + i) * 18, y);
      });
    }

    // === SCENE 4 & 5: ASCENSION ===
    else {
      // Massive energy ascension
      for (let i = 0; i < 32; i++) {
        const x = w * 0.3 + (i % 8) * 52 + Math.sin(t / 700 + i) * 25;
        const y = h * 0.55 - ((t / 380 + i) % 380) * 0.7;
        ctx.fillStyle = slideIdx === 3 ? '#34d399' : '#fbbf24';
        ctx.globalAlpha = 0.4 + Math.sin(t / 300 + i) * 0.5;
        ctx.fillRect(x, y, 2.5, 18);
      }
      ctx.globalAlpha = 1;

      // Big glowing orb
      ctx.fillStyle = slideIdx === 3 ? '#34d399' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(w/2, h*0.48, 28 + Math.sin(t/260)*9, 0, Math.PI*2);
      ctx.fill();
    }

    // === UNIVERSAL: Film grain + scanlines (real video texture) ===
    ctx.fillStyle = 'rgba(255,255,255,0.018)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y + Math.sin(t / 180) * 1.5, w, 1);
    }

    // Subtle vignette
    const grad = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.35, w/2, h/2, Math.max(w,h)*0.82);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  };

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const time = Date.now() - startRef.current;
      drawMotionVideo(ctx, time, current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [current]);

  // Video progress + auto advance
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const slideP = Math.min((elapsed % SLIDE_DURATION) / SLIDE_DURATION, 1);
      setProgress(slideP * 100);

      if (elapsed > SLIDE_DURATION) {
        if (current < MOTION_SLIDES.length - 1) {
          setCurrent(current + 1);
          startRef.current = Date.now();
          setProgress(0);
        } else {
          handleComplete();
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, [current, isPlaying]);

  // Epic audio
  useEffect(() => {
    if (current === 0 && isPlaying) {
      const audio = new Audio('/audio/onboarding-intro.mp3');
      audio.volume = 0.65;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [current]);

  const goTo = (i: number) => {
    setIsPlaying(false);
    setCurrent(i);
    startRef.current = Date.now();
    setProgress(0);
    setTimeout(() => setIsPlaying(true), 300);
  };

  const next = () => {
    setIsPlaying(false);
    if (current < MOTION_SLIDES.length - 1) {
      setCurrent(current + 1);
      startRef.current = Date.now();
      setProgress(0);
      setTimeout(() => setIsPlaying(true), 200);
    } else handleComplete();
  };

  const handleComplete = () => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    setTimeout(() => onComplete(), 350);
  };

  const toggle = () => setIsPlaying(!isPlaying);

  const overall = ((current + progress / 100) / MOTION_SLIDES.length) * 100;

  return (
    <div className="fixed inset-0 bg-black z-[999] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[#000000]" />

      {/* Background plate (motion graphic style) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ scale: 1.07, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 5.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#222_0.8px,transparent_1px)] bg-[length:4px_4px] opacity-30" />
        </motion.div>
      </AnimatePresence>

      {/* REAL MOTION GRAPHIC VIDEO LAYER (Canvas) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none mix-blend-screen"
        style={{ opacity: 0.92 }}
      />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-50 px-8 pt-8 flex justify-between text-white/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center">
            <span className="font-bold text-black text-sm tracking-[-1.5px]">MO</span>
          </div>
          <div>
            <div className="font-semibold text-xl tracking-tight">MENIFEST OS</div>
            <div className="text-[9px] text-amber-400/70 tracking-[4px] font-mono -mt-0.5">MOTION GRAPHICS • SOLO LEVELING</div>
          </div>
        </div>
        <div className="text-xs font-mono tracking-[3px] text-white/40 self-center">
          {String(current + 1).padStart(2, '0')} / {MOTION_SLIDES.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-40 max-w-5xl px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="font-mono uppercase text-xs tracking-[6.5px]" style={{ color: slide.accent }}>
              {slide.subtitle}
            </div>
            <h1 className="text-white text-[68px] sm:text-[82px] md:text-[92px] font-bold tracking-[-4.2px] leading-[0.9]">
              {slide.title}
            </h1>
            <p className="text-white/70 text-2xl sm:text-[27px] max-w-2xl mx-auto tracking-tight leading-tight">
              {slide.description}
            </p>
            {userName && current === 0 && (
              <p className="text-amber-400/90 text-lg tracking-widest">WELCOME, HUNTER <span className="font-medium">{userName}</span></p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* VIDEO PLAYER CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pb-9 px-8">
        <div className="max-w-5xl mx-auto">
          {/* Timeline */}
          <div className="relative h-px bg-white/10 mb-5">
            <div className="absolute top-0 h-px bg-gradient-to-r from-amber-400 to-yellow-300" style={{ width: `${overall}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {MOTION_SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} className={`h-[2px] rounded transition-all ${i === current ? 'bg-amber-400 w-9' : 'bg-white/20 w-2 hover:bg-white/50'}`} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggle} className="flex items-center gap-2 px-6 py-2.5 text-xs font-mono tracking-widest border border-white/15 rounded-2xl hover:bg-white/5">
                {isPlaying ? <Pause size={15} /> : <Play size={15} />} {isPlaying ? "PAUSE" : "PLAY"}
              </button>

              <button onClick={next} className="flex items-center gap-3 px-9 py-3 bg-white text-black font-semibold text-sm tracking-[2.5px] rounded-2xl">
                {current === MOTION_SLIDES.length - 1 ? "ENTER SYSTEM" : "NEXT"} <ArrowRight size={17} />
              </button>

              <button onClick={handleComplete} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono text-white/50 hover:text-white/80">
                <SkipForward size={15} /> SKIP
              </button>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleComplete} className="absolute top-7 right-8 text-xs font-mono tracking-widest text-white/40 hover:text-white/80">SKIP INTRO</button>
    </div>
  );
}
