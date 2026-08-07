import { motion } from "motion/react";
import { Lock, Crown, ArrowRight, Sparkles } from "lucide-react";

interface LockedOverlayProps {
  title?: string;
  message?: string;
  onUpgrade: () => void;
  variant?: "full" | "inline";
}

/**
 * Reusable lock screen shown when free users try to access premium features.
 * Compelling copy + clear CTA to maximize conversion.
 */
export function LockedOverlay({
  title = "Premium Feature",
  message = "Unlock this feature and transform your reality. Join thousands of manifestors who upgraded.",
  onUpgrade,
  variant = "full",
}: LockedOverlayProps) {
  if (variant === "inline") {
    return (
      <div className="relative rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] p-8 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Lock size={24} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">{message}</p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)]"
          >
            <Crown size={14} className="fill-black" />
            Unlock Now
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[50vh] flex items-center justify-center p-4"
    >
      <div className="relative max-w-md w-full text-center">
        <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="relative z-10 space-y-6"
        >
          {/* Lock Icon with glow */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-2xl">
              <Lock size={32} className="text-amber-400" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">Premium Feature</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-luxury font-bold text-white tracking-tight">{title}</h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>

          {/* CTA */}
          <button
            onClick={onUpgrade}
            className="cta-glow w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
          >
            <Crown size={16} className="fill-black" />
            Unlock Premium
            <ArrowRight size={16} />
          </button>

          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Plans from ₹99/month • Cancel anytime
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
