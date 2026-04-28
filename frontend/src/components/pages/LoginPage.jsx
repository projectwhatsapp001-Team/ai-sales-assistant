// frontend/src/components/pages/LoginPage.jsx
import { useState } from "react";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    if (!email.trim() || !EMAIL_RE.test(email.trim()))
      errors.email = "Enter a valid email address";
    if (!password || password.length < 8)
      errors.password = "Password must be at least 8 characters";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      const msg = err?.message || "";
      if (
        msg.includes("Invalid login credentials") ||
        msg.includes("invalid_grant")
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please check your email and confirm your account first.");
      } else if (msg.includes("Too many requests")) {
        setError("Too many login attempts. Please wait a few minutes.");
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "12px 14px",
    background: "#0f0f14",
    border: `1px solid ${hasError ? "#f43f5e" : "#2a2a35"}`,
    borderRadius: 10,
    color: "#f8fafc",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07070a",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 32,
          borderRadius: 20,
          background: "#18181f",
          border: "1px solid #2a2a35",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "#6366f1",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={28} color="#fff" />
          </div>
        </div>

        <h1
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#f8fafc",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#64748b",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Sign in to manage Betty and your sales
        </p>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.3)",
              marginBottom: 20,
            }}
          >
            <AlertCircle size={14} color="#f43f5e" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#f43f5e" }}>{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#94a3b8",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="admin@yourbusiness.com"
              autoComplete="email"
              style={inputStyle(!!fieldErrors.email)}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.email
                  ? "#f43f5e"
                  : "#2a2a35";
              }}
            />
            {fieldErrors.email && (
              <p style={{ fontSize: 11, color: "#f43f5e", marginTop: 4 }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#94a3b8",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  ...inputStyle(!!fieldErrors.password),
                  paddingRight: 44,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.password
                    ? "#f43f5e"
                    : "#2a2a35";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p style={{ fontSize: 11, color: "#f43f5e", marginTop: 4 }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#4f46e5" : "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
              marginTop: 4,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            style={{
              background: "none",
              border: "none",
              color: "#818cf8",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "underline",
            }}
          >
            Start free trial
          </button>
        </p>
      </div>
    </div>
  );
}
