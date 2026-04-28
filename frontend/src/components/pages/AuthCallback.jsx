// frontend/src/components/pages/AuthCallback.jsx
// Supabase redirects here after the user clicks the confirmation email link.
// URL will look like: /auth/callback?code=xxxx  (PKCE flow)
// or:                 /auth/callback#access_token=xxx (implicit flow)
// We exchange the code/token for a session and redirect to the dashboard.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("confirming"); // confirming | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        // ── Try PKCE flow (code in query params) ─────────────
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const type = params.get("type"); // "signup" | "recovery" etc.

        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.session) {
            setStatus("success");
            setTimeout(() => {
              window.location.replace("/");
            }, 1800);
            return;
          }
        }

        // ── Try implicit flow (token in hash) ─────────────────
        const hash = window.location.hash;
        if (hash.includes("access_token")) {
          // Supabase JS picks this up automatically via getSession()
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data?.session) {
            setStatus("success");
            setTimeout(() => {
              window.location.replace("/");
            }, 1800);
            return;
          }
        }

        // ── Already have a session (user clicked link twice) ──
        const { data: existing } = await supabase.auth.getSession();
        if (existing?.session) {
          setStatus("success");
          setTimeout(() => {
            window.location.replace("/");
          }, 1000);
          return;
        }

        // ── No code, no token, no session ────────────────────
        setStatus("error");
        setErrorMsg(
          "Confirmation link is invalid or has expired. Please request a new one.",
        );
      } catch (err) {
        console.error("Auth callback error:", err.message);
        setStatus("error");
        setErrorMsg(
          err.message || "Something went wrong. Please try signing in.",
        );
      }
    }

    handleCallback();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07070a",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          padding: 40,
          borderRadius: 20,
          background: "#18181f",
          border: "1px solid #2a2a35",
          textAlign: "center",
        }}
      >
        {status === "confirming" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 26,
              }}
            >
              ⚡
            </div>
            <p
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Confirming your account...
            </p>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
              Please wait a moment.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <span
                  key={i}
                  className="pulse-dot"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#6366f1",
                    display: "inline-block",
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 26,
              }}
            >
              ✅
            </div>
            <p
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Account confirmed!
            </p>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Redirecting you to the dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                background: "rgba(244,63,94,0.15)",
                border: "1px solid rgba(244,63,94,0.3)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 26,
              }}
            >
              ❌
            </div>
            <p
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Confirmation failed
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              {errorMsg}
            </p>
            <button
              onClick={() => window.location.replace("/")}
              style={{
                width: "100%",
                padding: "12px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
