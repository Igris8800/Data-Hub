import React, { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Subscribed! Look out for weekly analyst tips.");
      setEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to subscribe");
    } finally {
      setBusy(false);
    }
  };
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#0D1117]">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 font-heading mb-3">
            <span className="w-8 h-8 rounded-md bg-gradient-to-br from-[#00D4FF] to-[#00FF88] flex items-center justify-center text-[#0D1117] font-bold text-lg">D</span>
            <span className="text-lg font-semibold">Data Hub</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Learn. Practice. Get hired as a data analyst. Excel · SQL · Python · Power BI · Statistics.
          </p>
        </div>
        <div>
          <div className="uppercase text-xs tracking-[0.2em] text-slate-400 mb-3">Modules</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/excel" className="hover:text-[#00D4FF]">Excel</a></li>
            <li><a href="/sql" className="hover:text-[#00D4FF]">SQL</a></li>
            <li><a href="/python" className="hover:text-[#00D4FF]">Python</a></li>
            <li><a href="/powerbi" className="hover:text-[#00D4FF]">Power BI</a></li>
            <li><a href="/stats" className="hover:text-[#00D4FF]">Statistics</a></li>
          </ul>
        </div>
        <div>
          <div className="uppercase text-xs tracking-[0.2em] text-slate-400 mb-3">Weekly analyst tips</div>
          <form onSubmit={subscribe} className="flex flex-col gap-3" data-testid="newsletter-form">
            <Label htmlFor="nl-email" className="sr-only">Email</Label>
            <Input
              id="nl-email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#151B23] border-white/10"
              data-testid="newsletter-email-input"
            />
            <Button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[#00FF88] hover:bg-[#33FFA1] text-[#0D1117] font-medium"
              data-testid="newsletter-submit-btn"
            >
              <Mail className="w-4 h-4 mr-2" /> Subscribe (free)
            </Button>
          </form>
          {/* AdSense placeholder */}
          <div className="mt-4 h-16 rounded-md border border-dashed border-white/15 bg-[#151B23]/50 flex items-center justify-center text-xs text-slate-500">
            <span data-testid="adsense-footer-placeholder">AdSense placeholder — footer banner</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Data Hub. Built for aspiring data analysts.
      </div>
    </footer>
  );
}
