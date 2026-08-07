import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, LogIn } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

export default function LoginScreen() {
  const { signIn } = useFirebase();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5  rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5  rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center space-y-12"
      >
        <div className="space-y-6">
          <div className="inline-flex p-4 rounded-[28px] bg-white/5 border border-white/10 shadow-2xl">
            <Sparkles size={32} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase tracking-[0.2em]">Manifestation OS</h1>
            <p className="text-text-secondary font-mono text-[10px] uppercase tracking-[0.4em]">Quantum Alignment Engine</p>
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-text-muted text-sm leading-relaxed max-w-[280px] mx-auto italic font-display">
            "Your external reality is a direct reflection of your internal frequency."
          </p>
          
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-4 bg-white text-black py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/10"
          >
            <LogIn size={20} />
            Begin Transmutation
          </button>
        </div>

        <div className="pt-12 border-t border-white/5">
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest leading-relaxed">
            By entering, you agree to align your coherence<br />with the laws of the universe.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
