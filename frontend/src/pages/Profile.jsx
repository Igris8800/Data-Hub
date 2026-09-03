import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Flame, Zap, Trophy, Crown, Award, Sheet, Database, Code2, BarChart3, Sigma, Download, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import { computeBelt, tallyAttempts, nextBeltHint, BELTS } from "@/lib/belts";
import { MODULES } from "@/lib/questions";
import api from "@/lib/api";
import { toast } from "sonner";

const ICONS = { Sheet, Database, Code2, BarChart3, Sigma };
const CERT_THRESHOLD = 20; // backend minimum for the skill report
const REPORT_BELT_RANK = 3; // Green and above

export default function Profile() {
  const { user, logout, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [modules, setModules] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/"); return; }
    api.get("/progress").then(({ data }) => {
      setModules(data.modules || {}); setAttempts(data.attempts || []);
      // refresh user so top cards reflect latest server state
      refresh?.();
    }).catch(() => {});
  }, [user, loading, nav, refresh]);

  const downloadCert = async (moduleKey, moduleName) => {
    setDownloadingCert(moduleKey);
    try {
      const res = await api.get(`/certificate/${moduleKey}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datahub-${moduleKey}-skill-report.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${moduleName} skill report downloaded!`);
    } catch (e) {
      let msg = "Failed to download skill report";
      if (e?.response?.data instanceof Blob) {
        try {
          const txt = await e.response.data.text();
          const parsed = JSON.parse(txt);
          msg = parsed.detail || msg;
        } catch { void 0; }
      } else if (e?.response?.data?.detail) {
        msg = e.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setDownloadingCert(null);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-500 text-sm" data-testid="profile-loading">Loading profile…</div>
  );
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-4">
      <div className="p-8 rounded-xl border border-white/10 bg-[#151B23] flex items-center gap-6 flex-wrap mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#00FF88] flex items-center justify-center text-[#0D1117] font-heading font-bold text-2xl overflow-hidden" data-testid="profile-avatar">
          {user.picture
            ? <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" />
            : user.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-3xl tracking-tight" data-testid="profile-name">{user.name}</h1>
            {user.is_premium && <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] font-semibold flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>}
          </div>
          <div className="text-slate-400 text-sm">{user.email}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Level</div>
          <div className="font-heading text-2xl text-[#00D4FF]" data-testid="profile-level">{user.level}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatBig label="XP" value={user.xp} icon={<Zap className="w-4 h-4 text-[#00D4FF]" />} />
        <StatBig label="Streak" value={`${user.streak} day${user.streak === 1 ? "" : "s"}`} icon={<Flame className="w-4 h-4 text-[#00FF88]" />} />
        <StatBig label="Solved" value={user.total_solved} icon={<Trophy className="w-4 h-4 text-yellow-300" />} />
      </div>

      {!user.is_premium && (
        <div className="mb-10 p-6 rounded-lg border border-yellow-400/30 bg-gradient-to-br from-yellow-400/5 to-amber-500/5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="font-heading text-lg">Unlock 4,900+ premium questions</div>
              <div className="text-sm text-slate-400">All modules · AI hints · every belt reachable.</div>
            </div>
          </div>
          <Button onClick={() => setUpgradeOpen(true)} data-testid="profile-upgrade-btn"
            className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-semibold">
            Upgrade
          </Button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Skill levels</div>
        <div className="text-xs text-slate-500">Ranks are computed from what you've solved — harder belts need medium and hard problems</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {MODULES.map(m => {
          const Icon = ICONS[m.icon];
          const belt = computeBelt(tallyAttempts(attempts, m.key));
          const reportReady = belt.rank >= REPORT_BELT_RANK && belt.total >= CERT_THRESHOLD;
          return (
            <div key={m.key} className="p-4 rounded-lg border border-white/10 bg-[#151B23]" data-testid={`profile-module-${m.key}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${m.accent}15`, border: `1px solid ${m.accent}40` }}>
                  <Icon className="w-4 h-4" style={{ color: m.accent }} />
                </div>
                <div className="flex-1">
                  <div className="font-heading text-lg tracking-tight">{m.name}</div>
                  <div className="text-xs text-slate-500">{belt.total} solved · {belt.medium} medium · {belt.hard} hard</div>
                </div>
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-white/10 bg-white/5" data-testid={`belt-${m.key}`}>
                  <span className="w-4 h-4 rounded-sm border border-white/20" style={{ background: belt.color }} />
                  <span className="text-xs font-semibold" style={{ color: belt.name === "Black" ? "#fff" : belt.color }}>{belt.name} belt</span>
                </div>
              </div>
              <div className="flex gap-1 mb-2">{BELTS.map((b, i) => <span key={b.name} title={b.name} className="flex-1 h-1.5 rounded-sm" style={{ background: i <= belt.rank ? b.color : "rgba(255,255,255,0.08)" }} />)}</div>
              <div className="text-[11px] text-slate-400 mb-3">{belt.blurb} <span className="text-slate-500">· {nextBeltHint(belt)}</span></div>
              <Button
                size="sm"
                disabled={!reportReady || downloadingCert === m.key}
                onClick={() => downloadCert(m.key, m.name)}
                data-testid={`cert-download-${m.key}`}
                className={reportReady
                  ? "w-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-medium"
                  : "w-full rounded-full border border-white/10 bg-transparent text-slate-500 hover:bg-white/5"}
              >
                {downloadingCert === m.key ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : reportReady ? <Download className="w-4 h-4 mr-2" /> : <Award className="w-4 h-4 mr-2" />}
                {reportReady ? "Download skill report" : "Skill report unlocks at Green belt"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-white/10">
        <div className="text-xs text-slate-500">Signed in as {user.email}</div>
        <Button variant="ghost" onClick={logout} data-testid="profile-logout-btn">Sign out</Button>
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

function StatBig({ label, value, icon }) {
  return (
    <div className="p-5 rounded-lg border border-white/10 bg-[#151B23]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-2">{icon}{label}</div>
      <div className="font-heading text-3xl">{value}</div>
    </div>
  );
}
