import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles, Users, Building2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

// Only features we genuinely deliver.
const FEATURES = [
  "Every question in every module unlocked — all belts reachable",
  "Written hints and full step-by-step solutions on every question",
  "Interview Mode — timed, shuffled, hints off",
  "Downloadable skill report (PDF) from Green belt — great for a CV",
  "Ad-free experience",
  "Priority support",
];

const PLANS = [
  { key: "monthly", label: "Monthly", price: "$10", sub: "billed monthly" },
  { key: "yearly", label: "Yearly", price: "$30", sub: "4 months free", best: true },
  { key: "lifetime", label: "Lifetime", price: "$100", sub: "pay once, forever" },
];

// Per-seat annual price (USD) by seat count — mirrors the backend.
function perSeat(seats) {
  if (seats >= 100) return null; // custom
  if (seats >= 50) return 18;
  if (seats >= 20) return 21;
  if (seats >= 5) return 24;
  return 30;
}
const listPrice = 30;

export default function UpgradeModal({ open, onOpenChange }) {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("individual");
  const [plan, setPlan] = useState("yearly");

  const [seats, setSeats] = useState(10);
  const [biz, setBiz] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);

  const ps = perSeat(seats);
  const total = ps ? ps * seats : null;
  const savePct = ps ? Math.round((1 - ps / listPrice) * 100) : null;
  const planLabel = useMemo(() => PLANS.find((p) => p.key === plan), [plan]);

  const startCheckout = async () => {
    if (!user) { toast.error("Please sign in first to upgrade"); return; }
    setBusy(true);
    try {
      const { data: cfg } = await api.get("/payments/config");
      if (!cfg.configured) {
        toast.info("Payments are being set up — you'll be able to upgrade at launch. Thanks for the interest!");
        setBusy(false); return;
      }
      const { data: order } = await api.post("/payments/order", { plan });
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve; s.onerror = reject;
          document.body.appendChild(s);
        });
      }
      const rzp = new window.Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: "Data Hub Premium", description: (planLabel?.price || "") + " · " + (planLabel?.label || ""),
        theme: { color: "#00D4FF" }, prefill: { email: user.email, name: user.name },
        handler: async (res) => {
          try { await api.post("/payments/verify", res); await refresh();
            toast.success("Premium unlocked! Enjoy every question."); onOpenChange(false);
          } catch (e) { toast.error("Payment verification failed"); }
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not start checkout");
    } finally { setBusy(false); }
  };

  const submitBusiness = async () => {
    if (!biz.name.trim() || !biz.email.trim()) { toast.error("Name and work email are required"); return; }
    setBusy(true);
    try {
      await api.post("/business/enquiry", { ...biz, seats });
      setSent(true);
      toast.success("Thanks! We'll email you a quote and invoice shortly.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not send — try again");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151B23] border-white/10 max-w-lg" data-testid="upgrade-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" /> Unlock Data Hub Premium
          </DialogTitle>
          <DialogDescription className="text-slate-400">One plan. Every module. Every difficulty.</DialogDescription>
        </DialogHeader>

        <div className="self-start inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "#00FF8815", color: "#00FF88", border: "1px solid #00FF8855" }}>
          <Sparkles className="w-3 h-3" /> Launch price — locked in before payments go live
        </div>

        <div className="inline-flex items-center rounded-lg border border-white/10 p-0.5 bg-[#0D1117] self-start">
          <button onClick={() => setTab("individual")} data-testid="tab-individual"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "individual" ? "bg-[#00D4FF] text-[#0D1117]" : "text-slate-300 hover:bg-white/5"}`}>
            <Users className="w-3.5 h-3.5" /> Individual
          </button>
          <button onClick={() => setTab("business")} data-testid="tab-business"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "business" ? "bg-[#00D4FF] text-[#0D1117]" : "text-slate-300 hover:bg-white/5"}`}>
            <Building2 className="w-3.5 h-3.5" /> Business
          </button>
        </div>

        {tab === "individual" ? (
          <>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {PLANS.map((p) => (
                <button key={p.key} onClick={() => setPlan(p.key)} data-testid={`plan-${p.key}-btn`}
                  className={`relative text-left p-3 rounded-md border transition-colors ${plan === p.key ? "border-[#00D4FF] bg-[#0D1117]" : "border-white/10 bg-[#0D1117]/50 hover:border-white/25"}`}>
                  {p.best && <span className="absolute -top-2 right-2 text-[9px] bg-[#00FF88] text-[#0D1117] px-1.5 py-0.5 rounded-full font-bold">BEST</span>}
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">{p.label}</div>
                  <div className="text-xl font-heading font-bold mt-0.5">{p.price}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.sub}</div>
                </button>
              ))}
            </div>

            <ul className="space-y-2 text-sm text-slate-200 mt-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-[#00FF88] shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <Button onClick={startCheckout} disabled={busy} data-testid="upgrade-checkout-btn"
              className="w-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-semibold mt-2">
              <Sparkles className="w-4 h-4 mr-2" /> {busy ? "Loading…" : `Get Premium — ${planLabel?.price}${plan === "monthly" ? "/mo" : plan === "yearly" ? "/yr" : ""}`}
            </Button>
          </>
        ) : sent ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/50 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-[#00FF88]" />
            </div>
            <div className="font-heading text-lg">Request received</div>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">We'll email a quote and invoice for {seats} seats to {biz.email}. Talk soon.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 -mt-1">Roll out Data Hub to your team. Volume discounts, one invoice, and a team progress dashboard.</p>

            <div className="mt-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-200">Team size</label>
                <span className="text-sm font-heading font-bold">{seats} {seats === 1 ? "seat" : "seats"}</span>
              </div>
              <input type="range" min="1" max="100" value={seats} onChange={(e) => setSeats(Number(e.target.value))}
                data-testid="biz-seats" className="w-full accent-[#00D4FF]" />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>1</span><span>25</span><span>50</span><span>100+</span></div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0D1117] p-4 flex items-end justify-between">
              {ps ? (
                <>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-400">Estimated total / year</div>
                    <div className="text-2xl font-heading font-bold mt-0.5">${total.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">${ps}/seat/yr{savePct > 0 && <span className="text-[#00FF88]"> · {savePct}% off</span>}</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 leading-relaxed">
                    5+ seats · 20% off<br />20+ seats · 30% off<br />50+ seats · 40% off
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400">100+ seats</div>
                  <div className="text-2xl font-heading font-bold mt-0.5">Custom pricing</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tell us your size and we'll tailor a quote.</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <input value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} placeholder="Your name"
                data-testid="biz-name" className="col-span-1 bg-[#0D1117] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-[#00D4FF] outline-none" />
              <input value={biz.company} onChange={(e) => setBiz({ ...biz, company: e.target.value })} placeholder="Company"
                data-testid="biz-company" className="col-span-1 bg-[#0D1117] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-[#00D4FF] outline-none" />
              <input value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} placeholder="Work email"
                data-testid="biz-email" className="col-span-2 bg-[#0D1117] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-[#00D4FF] outline-none" />
              <textarea value={biz.message} onChange={(e) => setBiz({ ...biz, message: e.target.value })} placeholder="Anything we should know? (optional)" rows={2}
                data-testid="biz-message" className="col-span-2 bg-[#0D1117] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-[#00D4FF] outline-none resize-none" />
            </div>

            <Button onClick={submitBusiness} disabled={busy} data-testid="biz-submit-btn"
              className="w-full rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF] font-semibold mt-1">
              {busy ? "Sending…" : ps ? `Request quote for ${seats} seats` : "Talk to sales"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
