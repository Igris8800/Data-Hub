import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const FEATURES = [
  "Full ~975 questions per module (all difficulties)",
  "AI-powered hints on every question",
  "Downloadable cheat sheets per topic",
  "Certificate of completion (PDF)",
  "Ad-free experience",
  "Priority support",
];

export default function UpgradeModal({ open, onOpenChange }) {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState("monthly");

  const startCheckout = async () => {
    if (!user) {
      toast.error("Please sign in first to upgrade");
      return;
    }
    setBusy(true);
    try {
      const { data: cfg } = await api.get("/payments/config");
      if (!cfg.configured) {
        toast.info("Payments coming soon — Razorpay keys not configured yet. You'll be notified at launch!");
        setBusy(false);
        return;
      }
      const { data: order } = await api.post("/payments/order", { plan });
      // Load Razorpay checkout
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve; s.onerror = reject;
          document.body.appendChild(s);
        });
      }
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "Data Hub Premium",
        description: plan === "monthly" ? "₹499 / month" : "₹2999 / year",
        theme: { color: "#00D4FF" },
        prefill: { email: user.email, name: user.name },
        handler: async (res) => {
          try {
            await api.post("/payments/verify", res);
            await refresh();
            toast.success("Premium unlocked! Enjoy every question.");
            onOpenChange(false);
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151B23] border-white/10 max-w-lg" data-testid="upgrade-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" /> Unlock Data Hub Premium
          </DialogTitle>
          <DialogDescription className="text-slate-400">One subscription. All modules. All difficulties.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-2">
          {[
            { key: "monthly", label: "Monthly", price: "₹499", sub: "billed monthly" },
            { key: "yearly", label: "Yearly", price: "₹2999", sub: "Save 50%", best: true },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPlan(p.key)}
              data-testid={`plan-${p.key}-btn`}
              className={`relative text-left p-4 rounded-md border transition-colors ${plan === p.key ? "border-[#00D4FF] bg-[#0D1117]" : "border-white/10 bg-[#0D1117]/50 hover:border-white/25"}`}
            >
              {p.best && <span className="absolute top-2 right-2 text-[10px] bg-[#00FF88] text-[#0D1117] px-2 py-0.5 rounded-full font-medium">BEST</span>}
              <div className="text-xs uppercase tracking-widest text-slate-400">{p.label}</div>
              <div className="text-2xl font-heading font-bold mt-1">{p.price}</div>
              <div className="text-xs text-slate-500 mt-1">{p.sub}</div>
            </button>
          ))}
        </div>

        <ul className="space-y-2 text-sm text-slate-200">
          {FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-[#00FF88] shrink-0" /> {f}
            </li>
          ))}
        </ul>

        <Button onClick={startCheckout} disabled={busy} data-testid="upgrade-checkout-btn"
          className="w-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-semibold mt-2">
          <Sparkles className="w-4 h-4 mr-2" /> {busy ? "Loading…" : `Upgrade — ${plan === "monthly" ? "₹499/mo" : "₹2999/yr"}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
