import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const startGoogleAuth = () => {
  const redirectUrl = window.location.origin + "/";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

export default function AuthModal({ open, onOpenChange }) {
  const { login, signup } = useAuth();
  const [busy, setBusy] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success("Welcome back!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signup(signupData.name, signupData.email, signupData.password);
      toast.success("Account created — happy learning!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Signup failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151B23] border-white/10 max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight">Welcome to Data Hub</DialogTitle>
          <DialogDescription className="text-slate-400">Save your progress, XP and streaks across devices.</DialogDescription>
        </DialogHeader>

        <Button
          onClick={startGoogleAuth}
          className="w-full bg-white text-[#0D1117] hover:bg-slate-100 font-medium"
          data-testid="google-login-btn"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px bg-white/10 flex-1" /> OR <span className="h-px bg-white/10 flex-1" />
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 bg-[#0D1117]">
            <TabsTrigger value="login" data-testid="tab-login">Log in</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 mt-4">
              <div>
                <Label htmlFor="li-email">Email</Label>
                <Input id="li-email" type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} className="bg-[#0D1117] border-white/10" data-testid="login-email-input" required />
              </div>
              <div>
                <Label htmlFor="li-pw">Password</Label>
                <Input id="li-pw" type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} className="bg-[#0D1117] border-white/10" data-testid="login-password-input" required />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF]" data-testid="login-submit-btn">
                {busy ? "Signing in…" : "Log in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 mt-4">
              <div>
                <Label htmlFor="su-name">Name</Label>
                <Input id="su-name" value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="bg-[#0D1117] border-white/10" data-testid="signup-name-input" required />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} className="bg-[#0D1117] border-white/10" data-testid="signup-email-input" required />
              </div>
              <div>
                <Label htmlFor="su-pw">Password (min 6)</Label>
                <Input id="su-pw" type="password" minLength={6} value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} className="bg-[#0D1117] border-white/10" data-testid="signup-password-input" required />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1]" data-testid="signup-submit-btn">
                {busy ? "Creating…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
