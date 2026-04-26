// frontend/src/components/pages/BillingPage.jsx
import { useState, useEffect, useRef } from "react";
import {
  Zap,
  CheckCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { apiPost } from "../../lib/api";

const TRIAL_DAYS = 3;
const PLANS = [
  {
    id: "starter",
    title: "Starter",
    price: "GH₵ 99",
    period: "/month",
    popular: false,
    features: [
      "Up to 500 WhatsApp conversations/month",
      "Betty AI auto-replies",
      "Order tracking",
      "Follow-up automation",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    price: "GH₵ 249",
    period: "/month",
    popular: true,
    features: [
      "Unlimited WhatsApp conversations",
      "Betty AI auto-replies",
      "Order tracking",
      "Follow-up automation",
      "Advanced analytics",
      "Human handoff alerts",
      "Priority support",
      "Custom AI persona",
    ],
  },
];

// Only allow real Paystack URLs
function isValidPaystackUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return [
      "paystack.com",
      "checkout.paystack.com",
      "standard.paystack.com",
    ].some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

export default function BillingPage({ profileId, userEmail }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadStatus();
  }, [profileId]);

  async function loadStatus() {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      let prof = null;

      if (profileId) {
        const { data } = await supabase
          .from("profiles")
          .select("id,plan,trial_ends_at,subscription_code,is_active")
          .eq("id", profileId)
          .single();
        prof = data;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("id,plan,trial_ends_at,subscription_code,is_active")
            .eq("user_id", user.id)
            .single();
          prof = data;
        }
      }

      if (!mountedRef.current) return;

      if (!prof) {
        setStatus({
          plan: "free",
          is_active: false,
          is_in_trial: false,
          trial_days_left: 0,
        });
        return;
      }

      const now = new Date();
      const trialEndsAt = prof.trial_ends_at
        ? new Date(prof.trial_ends_at)
        : null;
      const isInTrial = trialEndsAt != null && now < trialEndsAt;
      // Use Math.max to prevent negative days
      const trialDaysLeft = isInTrial
        ? Math.max(0, Math.ceil((trialEndsAt - now) / 86400000))
        : 0;

      setStatus({
        plan: prof.plan || "free",
        is_active: prof.is_active ?? false,
        is_in_trial: isInTrial,
        trial_days_left: trialDaysLeft,
        trial_ends_at: prof.trial_ends_at,
        profileId: prof.id,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message);
      setStatus({
        plan: "free",
        is_active: false,
        is_in_trial: false,
        trial_days_left: 0,
      });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function handleSubscribe(planId) {
    setCheckoutLoading(planId);
    try {
      let email = userEmail;
      if (!email) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        email = user?.email;
      }

      if (!email)
        throw new Error("Email not found. Please update your profile.");

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address on your account.");
      }

      const pid = profileId || status?.profileId;
      if (!pid) throw new Error("Profile not found. Please refresh.");

      const data = await apiPost("/billing/initialize", {
        profileId: pid,
        email: email.trim(),
        planId,
      });

      // Validate URL before redirecting — prevent open redirect attacks
      if (!isValidPaystackUrl(data?.authorization_url)) {
        throw new Error(
          "Invalid payment URL received. Please contact support.",
        );
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert(`Could not start checkout: ${err.message}`);
    } finally {
      if (mountedRef.current) setCheckoutLoading(null);
    }
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 256,
          gap: 12,
        }}
      >
        <Loader2 size={28} color="#6366f1" className="animate-spin" />
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Loading billing info...
        </p>
      </div>
    );

  const isPaid = ["starter", "pro"].includes(status?.plan);
  const isInTrial = status?.is_in_trial;
  const daysLeft = status?.trial_days_left ?? 0;
  const currentPlan = status?.plan || "free";

  return (
    <div className="fade-up space-y-6" style={{ maxWidth: 680 }}>
      <div>
        <p
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#f8fafc",
          }}
        >
          Subscription & Billing
        </p>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          Manage your plan and payment
        </p>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <p style={{ fontSize: 12, color: "#f59e0b" }}>
            Could not reach billing server — showing cached status.
          </p>
          <button
            onClick={loadStatus}
            style={{
              background: "none",
              border: "none",
              color: "#f59e0b",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {isInTrial && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <Clock size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>
              Free Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Subscribe now to keep Betty running after your trial ends.
            </p>
          </div>
        </div>
      )}

      {!isPaid && !isInTrial && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(244,63,94,0.08)",
            border: "1px solid rgba(244,63,94,0.25)",
          }}
        >
          <AlertTriangle size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#f43f5e" }}>
              No active plan
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Subscribe to activate Betty.
            </p>
          </div>
        </div>
      )}

      {isPaid && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>
              Active —{" "}
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Betty is live and serving your customers.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              style={{
                position: "relative",
                padding: 20,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                background: plan.popular ? "rgba(99,102,241,0.06)" : "#18181f",
                border: plan.popular
                  ? "1px solid rgba(99,102,241,0.35)"
                  : isCurrentPlan
                    ? "1px solid rgba(16,185,129,0.35)"
                    : "1px solid #2a2a35",
              }}
            >
              {plan.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#6366f1",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    padding: "2px 10px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                  }}
                >
                  MOST POPULAR
                </span>
              )}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Zap size={15} color={plan.popular ? "#818cf8" : "#64748b"} />
                  <p
                    style={{
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#f8fafc",
                    }}
                  >
                    {plan.title}
                  </p>
                  {isCurrentPlan && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        background: "rgba(16,185,129,0.15)",
                        color: "#10b981",
                        border: "1px solid rgba(16,185,129,0.3)",
                        padding: "1px 6px",
                        borderRadius: 99,
                      }}
                    >
                      CURRENT
                    </span>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 4 }}
                >
                  <p
                    style={{
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 800,
                      fontSize: 30,
                      color: plan.popular ? "#818cf8" : "#f8fafc",
                    }}
                  >
                    {plan.price}
                  </p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>
                    {plan.period}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>
                  ✓ {TRIAL_DAYS}-day free trial
                </p>
              </div>
              <ul
                style={{
                  flex: 1,
                  marginBottom: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 20px 0",
                }}
              >
                {plan.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <CheckCircle
                      size={12}
                      color="#10b981"
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={checkoutLoading === plan.id || isCurrentPlan}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: isCurrentPlan
                    ? "#2a2a35"
                    : plan.popular
                      ? "#6366f1"
                      : "rgba(99,102,241,0.12)",
                  color: isCurrentPlan ? "#64748b" : "#fff",
                  border: isCurrentPlan
                    ? "1px solid #2a2a35"
                    : plan.popular
                      ? "none"
                      : "1px solid rgba(99,102,241,0.3)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor:
                    isCurrentPlan || checkoutLoading === plan.id
                      ? "not-allowed"
                      : "pointer",
                  opacity: checkoutLoading === plan.id ? 0.7 : 1,
                }}
              >
                {checkoutLoading === plan.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Redirecting...
                  </>
                ) : isCurrentPlan ? (
                  <>
                    <CheckCircle size={14} />
                    Current Plan
                  </>
                ) : (
                  <>
                    <CreditCard size={14} />
                    Start {TRIAL_DAYS}-Day Free Trial
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: "#18181f",
          border: "1px solid #2a2a35",
        }}
      >
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
          <span style={{ color: "#818cf8", fontWeight: 500 }}>
            {TRIAL_DAYS}-day free trial
          </span>{" "}
          — No charge until trial ends. Cancel anytime. Payments processed by{" "}
          <span style={{ color: "#f8fafc" }}>Paystack</span>. Subscriptions
          auto-renew monthly.
        </p>
      </div>
    </div>
  );
}
