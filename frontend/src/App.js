import React from "react";
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
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import AuthCallback from "@/pages/AuthCallback";

function AppShell() {
  const location = useLocation();
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
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
