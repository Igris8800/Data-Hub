import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const processedRef = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");
    if (!sessionId) {
      nav("/", { replace: true });
      return;
    }
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        if (data?.token) localStorage.setItem("datahub_token", data.token);
        await refresh();
        window.history.replaceState({}, "", "/");
        nav("/", { replace: true });
      } catch (e) {
        setError(e?.response?.data?.detail || "Auth exchange failed");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117]" data-testid="auth-callback">
      <div className="text-center">
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-[#00D4FF] mx-auto mb-4" />
            <p className="text-slate-400 font-mono-editor text-sm">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}
