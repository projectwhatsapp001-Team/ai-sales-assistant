// frontend/src/components/pages/SignupPage.jsx
import { useState } from "react";
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage({ onSwitchToLogin }) {
  const [step, setStep] = useState("form"); // form | verify
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    if (!businessName.trim() || businessName.trim().length < 2) {
      errors.businessName = "Enter your business name (at least 2 characters)";
    }
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (password !== confirm) {
      errors.confirm = "Passwords do not match";
    }
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { business_name: businessName.trim() },
          // This URL must be in your Supabase allowed redirect URLs list
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user && !data?.session) {
        // Email confirmation required — show verify screen
        setStep("verify");
      }
      // If session exists (email confirmation disabled in Supabase),
      // the auth state change in useAuth will auto-redirect to dashboard
    } catch (err) {
      const msg = err?.message || "";
      if (
        msg.includes("already registered") ||
        msg.includes("User already exists")
      ) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else if (msg.includes("Password should be")) {
        setError("Password too weak. Use at least 8 characters.");
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(
          msg || "Sign up failed. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inp = (hasErr) => ({
    width: "100%",
    padding: "12px 14px",
    background: "#0f0f14",
    border: `1px solid ${hasErr ? "#f43f5e" : "#2a2a35"}`,
    borderRadius: 10,
    color: "#f8fafc",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  });

  // ── Email sent screen ─────────────────────────────────────
  if (step === "verify") {
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
            maxWidth: 420,
            padding: 40,
            borderRadius: 20,
            background: "#18181f",
            border: "1px solid #2a2a35",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 30,
            }}
          >
            ✉️
          </div>
          <p
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "#f8fafc",
              marginBottom: 12,
            }}
          >
            Check your email
          </p>
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              lineHeight: 1.7,
              marginBottom: 6,
            }}
          >
            We sent a confirmation link to
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#818cf8",
              marginBottom: 20,
            }}
          >
            {email}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Click the link in the email to activate your account and start your{" "}
            <span style={{ color: "#10b981", fontWeight: 500 }}>
              3-day free trial
            </span>
            . Check your spam folder if you don't see it.
          </p>
          <button
            onClick={onSwitchToLogin}
            style={{
              width: "100%",
              padding: "13px",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Go to Sign In
          </button>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 14 }}>
            Wrong email?{" "}
            <button
              onClick={() => setStep("form")}
              style={{
                background: "none",
                border: "none",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: 12,
                textDecoration: "underline",
              }}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Sign up form ──────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07070a",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
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

        <div
          style={{
            padding: 32,
            borderRadius: 20,
            background: "#18181f",
            border: "1px solid #2a2a35",
          }}
        >
          <h1
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: 24,
              color: "#f8fafc",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Start your{" "}
            <span style={{ color: "#10b981", fontWeight: 500 }}>
              3-day free trial
            </span>{" "}
            — no card required
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {[
              "Betty replies 24/7",
              "Orders auto-tracked",
              "Cancel anytime",
            ].map((b) => (
              <div
                key={b}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <CheckCircle size={11} color="#10b981" />
                <span style={{ fontSize: 11, color: "#64748b" }}>{b}</span>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.3)",
                marginBottom: 20,
              }}
            >
              <AlertCircle
                size={14}
                color="#f43f5e"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: "#f43f5e",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {error}
              </p>
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
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                placeholder="e.g. Ama's Beauty Store"
                autoComplete="organization"
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setFieldErrors((p) => ({ ...p, businessName: "" }));
                }}
                style={inp(!!fieldErrors.businessName)}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.businessName
                    ? "#f43f5e"
                    : "#2a2a35";
                }}
              />
              {fieldErrors.businessName && (
                <p style={{ fontSize: 11, color: "#f43f5e", marginTop: 4 }}>
                  {fieldErrors.businessName}
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
                Email *
              </label>
              <input
                type="email"
                value={email}
                placeholder="admin@yourbusiness.com"
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                style={inp(!!fieldErrors.email)}
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
                Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((p) => ({
                      ...p,
                      password: "",
                      confirm: "",
                    }));
                  }}
                  style={{ ...inp(!!fieldErrors.password), paddingRight: 44 }}
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
              {password.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 99,
                        transition: "background 0.2s",
                        background:
                          password.length >= i * 3
                            ? password.length >= 10
                              ? "#10b981"
                              : "#f59e0b"
                            : "#2a2a35",
                      }}
                    />
                  ))}
                </div>
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
                Confirm Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setFieldErrors((p) => ({ ...p, confirm: "" }));
                }}
                style={inp(!!fieldErrors.confirm)}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.confirm
                    ? "#f43f5e"
                    : "#2a2a35";
                }}
              />
              {fieldErrors.confirm && (
                <p style={{ fontSize: 11, color: "#f43f5e", marginTop: 4 }}>
                  {fieldErrors.confirm}
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
              {loading ? "Creating account..." : "Start Free Trial →"}
            </button>
          </form>

          <p
            style={{
              fontSize: 12,
              color: "#475569",
              textAlign: "center",
              marginTop: 20,
              lineHeight: 1.6,
            }}
          >
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              style={{
                background: "none",
                border: "none",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
