/**
 * audioEngine.ts — Procedural audio for Manifest OS
 *
 * Pure Web Audio API. No external files. Generates themed music and
 * sound effects in-browser. Solo Leveling ARISE vibe — dark, intense,
 * motivational, dark-ambient.
 *
 * Features:
 * - Procedural ambient music (4 different "moods" per page)
 * - SFX library (click, success, error, whoosh, level-up, xp)
 * - Volume + mute persistence (localStorage)
 * - Auto-continues across page navigations
 */

type AudioMood = "landing" | "dashboard" | "dominion" | "tasks" | "profile" | "goals" | "leaderboard" | "silence";

const VOLUME_KEY = "manifest_audio_volume_v1";
const MUTE_KEY = "manifest_audio_muted_v1";

// ============== SINGLETON ENGINE ==============
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private intervals: number[] = [];
  private currentMood: AudioMood = "silence";
  private volume = 0.3;
  private muted = false;
  private started = false;

  /** Lazy-init AudioContext (must be triggered by user gesture) */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.5; // music softer than SFX
        this.musicGain.connect(this.master);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.master);
      } catch (e) {
        console.warn("[audio] AudioContext not available", e);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx!;
  }

  /** Resume context (must be called from a user gesture handler) */
  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Initialize from localStorage */
  init() {
    try {
      const v = localStorage.getItem(VOLUME_KEY);
      if (v !== null) this.volume = Number(v) || 0.3;
      const m = localStorage.getItem(MUTE_KEY);
      if (m !== null) this.muted = m === "true";
    } catch {}
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    try {
      localStorage.setItem(VOLUME_KEY, String(this.volume));
    } catch {}
    if (this.master && !this.muted) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx!.currentTime, 0.05);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, String(m));
    } catch {}
    if (this.master) {
      this.master.gain.setTargetAtTime(
        m ? 0 : this.volume,
        this.ctx!.currentTime,
        0.05
      );
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ============== STOP ALL MUSIC ==============
  stopMusic() {
    for (const o of this.oscillators) {
      try {
        o.stop();
      } catch {}
    }
    this.oscillators = [];
    for (const id of this.intervals) {
      clearInterval(id);
    }
    this.intervals = [];
    this.currentMood = "silence";
  }

  // ============== PLAY MOOD ==============
  playMood(mood: AudioMood) {
    if (mood === this.currentMood) return;
    this.stopMusic();
    if (mood === "silence" || this.muted) {
      this.currentMood = "silence";
      return;
    }

    this.currentMood = mood;
    const ctx = this.ensureCtx();
    if (!ctx || !this.musicGain) return;

    const baseFreqs: Record<AudioMood, number> = {
      landing: 65.4,    // C2 - dark epic
      dashboard: 73.4, // D2 - calm motivational
      dominion: 55.0,   // A1 - intense combat
      tasks: 82.4,     // E2 - focused tension
      profile: 49.0,   // G1 - reflective bass
      goals: 65.4,     // C2 - ambitious
      leaderboard: 73.4, // D2 - competitive
      silence: 0,
    };

    const baseFreq = baseFreqs[mood] || 65.4;
    const now = ctx.currentTime;

    // Pad chord (3-4 oscillators)
    const ratios = [1, 1.25, 1.5, 2]; // root, M3, P5, octave
    for (const r of ratios) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * r;
      const g = ctx.createGain();
      g.gain.value = 0;
      // Fade in slowly
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.08, now + 2);
      // Subtle vibrato
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3 + Math.random() * 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = baseFreq * r * 0.005;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();
      osc.connect(g).connect(this.musicGain);
      osc.start();
      this.oscillators.push(osc, lfo);
    }

    // Slow filter sweep for "epic" feel
    if (mood === "dominion" || mood === "landing") {
      const interval = window.setInterval(() => {
        // Subtle bass thump
        this.playThump(baseFreq * 0.5, 0.5);
      }, 1800);
      this.intervals.push(interval);
    }

    if (mood === "dashboard" || mood === "goals") {
      // Gentle ambient shimmer
      const interval = window.setInterval(() => {
        this.playShimmer(baseFreq * 2, 0.3);
      }, 2200);
      this.intervals.push(interval);
    }
  }

  // ============== SFX ==============
  /** Click sound — short, soft */
  sfxClick() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /** Success chime — bright ascending */
  sfxSuccess() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      osc.connect(g).connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.45);
    });
  }

  /** Error buzz — low, short */
  sfxError() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** XP gain — bright sparkle */
  sfxXP() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1568, 2093].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.04);
      g.gain.linearRampToValueAtTime(0.1, now + i * 0.04 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);
      osc.connect(g).connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.3);
    });
  }

  /** Whoosh — page transition */
  sfxWhoosh() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(filter).connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Level up — epic ascending chord */
  sfxLevelUp() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [261.63, 329.63, 392.0, 523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.03);
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.2);
      osc.connect(g).connect(this.sfxGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.3);
    });
  }

  /** Notification ping */
  sfxNotify() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [880, 1108.7].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      osc.connect(g).connect(this.sfxGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  }

  // Internal helpers
  private playThump(freq: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g).connect(this.musicGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  private playShimmer(freq: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.5, now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.05, now + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g).connect(this.musicGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }
}

export const audioEngine = new AudioEngine();
audioEngine.init();
