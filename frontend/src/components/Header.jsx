import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Flame, Zap, Crown, LogOut, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import AuthModal from "@/components/AuthModal";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/excel", label: "Excel" },
  { to: "/sql", label: "SQL" },
  { to: "/python", label: "Python" },
  { to: "/powerbi", label: "Power BI" },
  { to: "/stats", label: "Statistics" },
  { to: "/roadmap", label: "Roadmap" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();

  return (
    <>
      <header className="fixed top-11 inset-x-0 z-40 backdrop-blur-xl bg-[#0D1117]/70 border-b border-white/10 data-[promo-hidden=true]:top-0" id="site-header">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-heading" data-testid="brand-link">
            <span className="w-8 h-8 rounded-md bg-gradient-to-br from-[#00D4FF] to-[#00FF88] flex items-center justify-center text-[#0D1117] font-bold text-lg">D</span>
            <span className="text-lg font-semibold tracking-tight">Data Hub</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s/g,'-')}`}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "text-[#00D4FF]" : "text-slate-300 hover:text-white hover:bg-white/5"}`
                }
                end
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-[#00D4FF]" data-testid="header-xp">
                    <Zap className="w-4 h-4" /> {user.xp}
                  </div>
                  <div className="flex items-center gap-1 text-[#00FF88]" data-testid="header-streak">
                    <Flame className="w-4 h-4" /> {user.streak}
                  </div>
                  {user.is_premium && (
                    <div className="flex items-center gap-1 text-yellow-400" data-testid="header-premium-badge">
                      <Crown className="w-4 h-4" /> Premium
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => nav("/profile")} data-testid="header-profile-btn">
                  <User className="w-4 h-4 mr-1" /> {user.name?.split(" ")?.[0] ?? "You"}
                </Button>
                <Button variant="ghost" size="sm" onClick={logout} data-testid="header-logout-btn" title="Logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setAuthOpen(true)}
                className="rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF] font-medium"
                data-testid="header-login-btn"
              >
                Sign In
              </Button>
            )}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-white/5"
              onClick={() => setMobileOpen(v => !v)}
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0D1117]">
            <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
              {NAV.map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm ${isActive ? "text-[#00D4FF] bg-white/5" : "text-slate-300"}`}
                  end
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
