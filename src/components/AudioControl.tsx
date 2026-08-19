import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Music, X } from "lucide-react";
import { audioEngine } from "../lib/audioEngine";

/**
 * Floating audio control button (bottom-right).
 * Tap to toggle mute. Long press to open volume slider.
 */
export const AudioControl: React.FC<{ className?: string }> = ({ className }) => {
  const [muted, setMuted] = useState(audioEngine.isMuted());
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    // Auto-resume audio context on first user interaction
    const handler = () => {
      audioEngine.resume();
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
    window.addEventListener("click", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleMuteToggle = () => {
    audioEngine.resume();
    const newMuted = audioEngine.toggleMute();
    setMuted(newMuted);
    if (!newMuted) {
      audioEngine.sfxClick();
    }
  };

  const handleVolumeChange = (v: number) => {
    audioEngine.setVolume(v);
    setVolume(v);
    if (v > 0 && muted) {
      audioEngine.setMuted(false);
      setMuted(false);
    }
  };

  return (
    <div
      className={`fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 ${className || ""}`}
    >
      {/* Volume slider panel */}
      {showSlider && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{
            backgroundColor: "rgba(10,10,10,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <VolumeX size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-24"
            style={{ accentColor: "#ff9f0a" }}
          />
          <Volume2 size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
          <button
            onClick={() => setShowSlider(false)}
            className="ml-1 p-1 rounded active:scale-90"
            style={{ color: "rgba(255,255,255,0.5)" }}
            aria-label="Close"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main toggle button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowSlider((s) => !s)}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition"
          style={{
            backgroundColor: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.7)",
          }}
          aria-label="Volume"
        >
          <Music size={14} />
        </button>
        <button
          onClick={handleMuteToggle}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full active:scale-95 transition shadow-lg"
          style={{
            backgroundColor: muted
              ? "rgba(255,69,58,0.15)"
              : "rgba(52,199,89,0.15)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${
              muted ? "rgba(255,69,58,0.4)" : "rgba(52,199,89,0.4)"
            }`,
            color: muted ? "#ff453a" : "#34c759",
          }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span className="text-[11px] font-bold">
            {muted ? "Muted" : "Audio"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AudioControl;
