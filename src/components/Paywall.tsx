import React from 'react';
import { Crown, ArrowRight } from 'lucide-react';
import { PricingPage } from './PricingPage';

interface PaywallProps {
  onUpgrade: () => void;
  message?: string;
}

export function Paywall({ onUpgrade, message }: PaywallProps) {
  const [showPricing, setShowPricing] = React.useState(false);

  if (showPricing) {
    return <PricingPage onClose={() => setShowPricing(false)} paywallMessage={message || undefined} />;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/5 flex items-center justify-center">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight mb-4">Unlock Your Full Potential</h1>
        <p className="text-lg text-white/70 mb-10">
          {message || "You've reached a natural expansion point. Upgrade to scale your desires, unlock advanced Academy masterclasses, and access the infinite AI Oracle."}
        </p>

        <button
          onClick={() => setShowPricing(true)}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold tracking-[2px] text-sm uppercase flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          View Premium Plans <ArrowRight />
        </button>

        <p className="mt-6 text-xs text-white/40 tracking-widest">30-DAY MONEY BACK GUARANTEE</p>
      </div>
    </div>
  );
}