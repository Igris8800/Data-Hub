import React from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PremiumLock({ onUpgrade, count = 950 }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6" data-testid="premium-lock-overlay">
      <div className="absolute inset-0 backdrop-blur-md bg-[#0D1117]/60" />
      <div className="relative z-10 max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mb-4">
          <Crown className="w-7 h-7 text-[#0D1117]" />
        </div>
        <h3 className="font-heading text-2xl tracking-tight text-yellow-300 mb-2">Premium Content</h3>
        <p className="text-slate-300 text-sm mb-1"><span className="text-yellow-300 font-medium">{count}+</span> more questions locked</p>
        <p className="text-slate-500 text-xs mb-6">Unlock the full question bank, AI-powered hints, cheat sheets & skill reports.</p>
        <Button
          onClick={onUpgrade}
          data-testid="premium-lock-upgrade-btn"
          className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-semibold"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Unlock Premium
        </Button>
      </div>
    </div>
  );
}
