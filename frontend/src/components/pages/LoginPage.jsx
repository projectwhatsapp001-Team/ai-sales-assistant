// src/components/pages/LoginPage.jsx
import { useState } from "react";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070a" }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 56, height: 56, background: "#6366f1" }}>
            <Zap size={28} style={{ color: "#fff" }} />
          </div>
        </div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 24, color: "#f8fafc", textAlign: "center", marginBottom: 8 }}>
          Welcome to SalesBot
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 32 }}>
          Sign in to manage Betty and your sales
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bettysales.com"
              style={{ width: "100%", padding: "12px 14px", background: "#0f0f14", border: "1px solid #2a2a35", borderRadius: 10, color: "#f8fafc", fontSize: 14, outline: "none" }}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2a2a35"; }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "12px 14px", background: "#0f0f14", border: "1px solid #2a2a35", borderRadius: 10, color: "#f8fafc", fontSize: 14, outline: "none", paddingRight: 44 }}
                onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
                onBlur={(e) => { e.target.style.borderColor = "#2a2a35"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl cursor-pointer transition-colors"
            style={{
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}