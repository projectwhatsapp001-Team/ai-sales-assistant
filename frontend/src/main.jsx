// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as Sentry from "@sentry/react";
import "./index.css";
import AuthCallback from "./components/pages/AuthCallback";

// ── Sentry (only in production) ────────────────────────────
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

// Detect if this is Supabase's auth callback redirect
// Handles both PKCE (?code=) and implicit (#access_token=) flows
function isAuthCallbackRoute() {
  const path = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;

  return (
    path === "/auth/callback" ||
    path === "/auth/confirm" ||
    search.includes("type=signup") ||
    search.includes("type=recovery") ||
    search.includes("code=") ||
    hash.includes("access_token=") ||
    hash.includes("type=signup")
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {isAuthCallbackRoute() ? <AuthCallback /> : <App />}
  </React.StrictMode>,
);
