import React, { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

export default function PromoBar() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem("dh_promo_dismissed") !== "1"; } catch { return true; }
  });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!open) localStorage.setItem("dh_promo_dismissed", "1");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 h-11 flex items-center overflow-hidden"
      style={{ background: "linear-gradient(90deg, #1E0B4B 0%, #4B1FB3 45%, #7C3AED 100%)" }}
      data-testid="promo-bar"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="relative">
              <div
                className="rotate-[-6deg] px-2 py-0.5 text-[11px] font-heading font-bold rounded-sm"
                style={{ background: "#00FF88", color: "#0D1117", boxShadow: "3px 3px 0 rgba(0,0,0,0.35)" }}
              >
                50% OFF
              </div>
              <div
                className="rotate-[-6deg] mt-0.5 px-2 py-[1px] text-[8px] font-heading rounded-sm"
                style={{ background: "#B892FF", color: "#1E0B4B" }}
              >
                DATA & AI SKILLS
              </div>
            </div>
          </div>
          <p className="text-white text-sm truncate">
            <span className="font-semibold">Lifetime access $99</span> — launch price. Every module, every difficulty, one payment.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setUpgradeOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 bg-[#00FF88] hover:bg-[#33FFA1] text-[#0D1117] rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
            data-testid="promo-buy-btn"
          >
            Buy Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white p-1"
            data-testid="promo-close-btn"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
