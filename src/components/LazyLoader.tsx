import React from 'react';

// Beautiful, instant loading skeleton that feels premium
export function TabLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
      <div className="text-white/40 text-sm font-mono tracking-[2px] uppercase">Loading experience...</div>
    </div>
  );
}
