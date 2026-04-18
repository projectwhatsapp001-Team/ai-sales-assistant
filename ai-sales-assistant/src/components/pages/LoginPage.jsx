// src/pages/LoginPage.jsx
import { useState } from "react";
import { Zap, Eye, EyeOff, Loader } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0f0d" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 fade-up"
        style={{ background: "#111710", border: "1px solid #1f2a1e" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: "#22c55e" }}
          >
            <Zap size={18} style={{ color: "#000", fill: "#000" }} />
          </div>
          <span
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: "#fff",
            }}
          >
            SalesBot
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "#fff",
              marginBottom: 6,
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: "#4a6a44" }}>
            Sign in to your dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              style={{
                fontSize: 12,
                color: "#7a9a74",
                fontWeight: 500,
                display: "block",
                marginBottom: 6,
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: "100%",
                background: "#192018",
                border: "1px solid #243024",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#e8f5e2",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#22c55e";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#243024";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontSize: 12,
                color: "#7a9a74",
                fontWeight: 500,
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "#192018",
                  border: "1px solid #243024",
                  borderRadius: 8,
                  padding: "10px 40px 10px 14px",
                  fontSize: 13,
                  color: "#e8f5e2",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#22c55e";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#243024";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#4a6a44",
                  padding: 0,
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all"
            style={{
              background: loading ? "#166534" : "#22c55e",
              color: "#000",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#16a34a";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#22c55e";
            }}
          >
            {loading ? (
              <>
                <Loader size={15} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer note */}
        <p
          className="text-center mt-6"
          style={{ fontSize: 11, color: "#2a4a24" }}
        >
          Access restricted to authorised team members only.
        </p>
      </div>
    </div>
  );
}
