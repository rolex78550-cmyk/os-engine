import React from 'react';

// FABLE 5 MODEL - Ultra simple, non-blocking loader
// Shows a clear message + force continue button
export function TabLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-black text-white p-6">
      <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin mb-6" />
      
      <div className="text-white/70 text-sm font-mono tracking-[3px] uppercase mb-2">
        Manifestation Engine Initializing...
      </div>
      <div className="text-white/40 text-xs mb-8">
        Connecting to quantum state
      </div>

      {/* FABLE 5: Emergency escape hatch */}
      <button
        onClick={() => {
          console.warn('[FABLE 5] User forced continue from loader');
          window.location.reload();
        }}
        className="mt-4 px-6 py-2 text-xs border border-white/20 hover:border-amber-400/50 text-white/60 hover:text-amber-300 rounded-full font-mono tracking-widest transition-all"
      >
        FORCE CONTINUE (FABLE 5)
      </button>
      
      <p className="mt-8 text-[10px] text-white/20 text-center max-w-xs">
        If stuck &gt; 8 seconds, rules may not be published in Firebase.
      </p>
    </div>
  );
}
