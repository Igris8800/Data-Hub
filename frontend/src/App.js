import React, { useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Header from "@/components/Header";
import PromoBar from "@/components/PromoBar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import ExcelPage from "@/pages/ExcelPage";
import SQLPage from "@/pages/SQLPage";
import PythonPage from "@/pages/PythonPage";
import StatsPage from "@/pages/StatsPage";
import PowerBIPage from "@/pages/PowerBIPage";
import DaxPracticePage from "@/pages/DaxPracticePage";
import Roadmap from "@/pages/Roadmap";
import BlogIndex from "@/pages/BlogIndex";
import BlogPost from "@/pages/BlogPost";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import AuthCallback from "@/pages/AuthCallback";
import LegalPage from "@/pages/LegalPage";

function AppShell() {
  const location = useLocation();
  // Reset scroll to top on every route change (otherwise the browser keeps the previous page's scroll position).
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  // Meta Pixel: this is a client-routed SPA, so fire a PageView on each in-app navigation.
  // The base pixel in public/index.html already fires the PageView for the initial load, so skip the first run here.
  const fbqFirstNav = useRef(true);
  useEffect(() => {
    if (fbqFirstNav.current) { fbqFirstNav.current = false; return; }
    if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq("track", "PageView");
  }, [location.pathname]);
  // OAuth callback: session_id in URL fragment → process before routes render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <div className="App grain">
      <PromoBar />
      <Header />
      <main className="pt-[8.75rem]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/excel" element={<ExcelPage />} />
          <Route path="/sql" element={<SQLPage />} />
          <Route path="/python" element={<PythonPage />} />
          <Route path="/powerbi" element={<PowerBIPage />} />
          <Route path="/powerbi/dax" element={<DaxPracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/legal/:doc" element={<LegalPage />} />
          <Route path="/legal" element={<LegalPage />} />
        </Routes>
      </main>
      {location.pathname === "/" && <Footer />}
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
