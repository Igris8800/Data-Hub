import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Flame, Zap, Trophy, Crown, Award, Sheet, Database, Code2, BarChart3, Sigma, Download, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import { MODULES } from "@/lib/questions";
import api from "@/lib/api";
import { toast } from "sonner";

const ICONS = { Sheet, Database, Code2, BarChart3, Sigma };
const CERT_THRESHOLD = 20;

export default function Profile() {
  const { user, logout, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [modules, setModules] = useState({});
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/"); return; }
    api.get("/progress").then(({ data }) => {
      setModules(data.modules || {});
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
      a.download = `datahub-${moduleKey}-certificate.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${moduleName} certificate downloaded!`);
    } catch (e) {
      let msg = "Failed to download certificate";
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
              <div className="text-sm text-slate-400">All modules · AI hints · certificate on completion.</div>
            </div>
          </div>
          <Button onClick={() => setUpgradeOpen(true)} data-testid="profile-upgrade-btn"
            className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-semibold">
            Upgrade
          </Button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Progress & certificates</div>
        <div className="text-xs text-slate-500">Solve {CERT_THRESHOLD}+ questions in a module to unlock its certificate</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {MODULES.map(m => {
          const Icon = ICONS[m.icon];
          const solved = modules[m.key]?.solved || 0;
          const certReady = solved >= CERT_THRESHOLD;
          return (
            <div key={m.key} className="p-4 rounded-lg border border-white/10 bg-[#151B23]" data-testid={`profile-module-${m.key}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${m.accent}15`, border: `1px solid ${m.accent}55` }}>
                  <Icon className="w-4 h-4" style={{ color: m.accent }} />
                </div>
                <div className="flex-1">
                  <div className="font-heading text-lg tracking-tight">{m.name}</div>
                  <div className="text-xs text-slate-500">{solved} solved · certificate at {CERT_THRESHOLD}</div>
                </div>
                <div className="font-mono-editor text-sm text-slate-400">{Math.round((solved / CERT_THRESHOLD) * 100)}%</div>
              </div>
              <Progress value={Math.min(100, (solved / CERT_THRESHOLD) * 100)} className="h-1.5 mb-3" />
              <Button
                size="sm"
                disabled={!certReady || downloadingCert === m.key}
                onClick={() => downloadCert(m.key, m.name)}
                data-testid={`cert-download-${m.key}`}
                className={certReady
                  ? "w-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-medium"
                  : "w-full rounded-full border border-white/10 bg-transparent text-slate-500 hover:bg-white/5"}
              >
                {downloadingCert === m.key
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : certReady ? <Download className="w-4 h-4 mr-2" /> : <Award className="w-4 h-4 mr-2" />}
                {certReady ? "Download certificate" : `Unlocks at ${CERT_THRESHOLD} solved`}
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
