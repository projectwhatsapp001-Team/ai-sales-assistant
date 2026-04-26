// src/components/pages/BillingPage.jsx
import { useState, useEffect } from "react";
import {
  Zap, CheckCircle, Clock, CreditCard, AlertTriangle,
  Loader2, RefreshCw, MapPin,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { apiPost } from "../../lib/api";

// ═══════════════════════════════════════════════════════
// PLANS — Now with both Ghana and Nigeria pricing
// ═══════════════════════════════════════════════════════
const PLANS = [
  {
    id: "starter",
    title: "Starter",
    prices: {
      GHS: { amount: "GH₵ 99", code: "GHS" },
      NGN: { amount: "₦ 15,000", code: "NGN" },
    },
    period: "/month",
    popular: false,
    features: [
      "Up to 500 WhatsApp conversations/month",
      "Betty AI auto-replies",
      "Order tracking & management",
      "Follow-up automation",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    prices: {
      GHS: { amount: "GH₵ 249", code: "GHS" },
      NGN: { amount: "₦ 35,000", code: "NGN" },
    },
    period: "/month",
    popular: true,
    features: [
      "Unlimited WhatsApp conversations",
      "Betty AI auto-replies",
      "Order tracking & management",
      "Follow-up automation",
      "Advanced analytics & reports",
      "Human handoff alerts",
      "Priority support",
      "Custom AI persona & tone",
    ],
  },
];

const TRIAL_DAYS = 3;
const COUNTRIES = [
  { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬" },
];

export default function BillingPage({ profileId, userEmail }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem("betty-billing-country") || "GH";
  });

  // ── Load billing status ─────────────────────────────────
  useEffect(() => {
    loadStatus();
  }, [profileId]);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      let prof = null;

      if (profileId) {
        const { data } = await supabase
          .from("profiles")
          .select("id, plan, trial_ends_at, subscription_code, is_active, country")
          .eq("id", profileId)
          .single();
        prof = data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("id, plan, trial_ends_at, subscription_code, is_active, country")
            .eq("user_id", user.id)
            .single();
          prof = data;
        }
      }

      if (!prof) {
        setStatus({
          plan: "free",
          is_active: false,
          is_in_trial: false,
          trial_days_left: 0,
        });
        return;
      }

      // Auto-detect country from profile if available
      if (prof.country && COUNTRIES.find(c => c.code === prof.country)) {
        setSelectedCountry(prof.country);
        localStorage.setItem("betty-billing-country", prof.country);
      }

      const now = new Date();
      const trialEndsAt = prof.trial_ends_at ? new Date(prof.trial_ends_at) : null;
      const isInTrial = trialEndsAt ? now < trialEndsAt : false;
      const trialDaysLeft = isInTrial
        ? Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))
        : 0;

      setStatus({
        plan: prof.plan || "free",
        is_active: prof.is_active ?? false,
        is_in_trial: isInTrial,
        trial_days_left: trialDaysLeft,
        trial_ends_at: prof.trial_ends_at,
        has_subscription: !!prof.subscription_code,
        profileId: prof.id,
        country: prof.country,
      });
    } catch (err) {
      console.error("Billing status error:", err);
      setError(err.message);
      setStatus({
        plan: "free",
        is_active: false,
        is_in_trial: false,
        trial_days_left: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planId) {
    setCheckoutLoading(planId);
    try {
      let email = userEmail;
      if (!email) {
        const { data: { user } } = await supabase.auth.getUser();
        email = user?.email;
      }

      const pid = profileId || status?.profileId;

      if (!pid || !email) {
        alert("Could not identify your account. Please refresh and try again.");
        return;
      }

      const data = await apiPost("/billing/initialize", {
        profileId: pid,
        email,
        planId,
        country: selectedCountry,
        currency: COUNTRIES.find(c => c.code === selectedCountry)?.currency,
      });

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL returned from server");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert(`Payment failed to start: ${err.message}. Make sure your backend is running.`);
    } finally {
      setCheckoutLoading(null);
    }
  }

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    localStorage.setItem("betty-billing-country", countryCode);
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="fade-up flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={28} style={{ color: "#6366f1" }} className="animate-spin" />
        <p style={{ fontSize: 13, color: "#64748b" }}>Loading billing info...</p>
      </div>
    );
  }

  const isPaid = ["starter", "pro"].includes(status?.plan);
  const isInTrial = status?.is_in_trial;
  const daysLeft = status?.trial_days_left || 0;
  const currentPlan = status?.plan || "free";
  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry);
  const currency = currentCountry?.currency || "GHS";

  return (
    <div className="fade-up space-y-6" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div>
        <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc" }}>
          Subscription & Billing
        </p>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          Manage your plan and payment details
        </p>
      </div>

      {/* Country Selector */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
        <MapPin size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Billing region:</span>
        <div className="flex gap-2">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              onClick={() => handleCountryChange(country.code)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
              style={{
                background: selectedCountry === country.code ? "rgba(99,102,241,0.15)" : "transparent",
                border: selectedCountry === country.code ? "1px solid rgba(99,102,241,0.4)" : "1px solid #2a2a35",
                color: selectedCountry === country.code ? "#818cf8" : "#64748b",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>({country.currency})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <p style={{ fontSize: 12, color: "#f59e0b" }}>
            Could not reach billing server — showing cached status.
          </p>
          <button onClick={loadStatus} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", flexShrink: 0 }}>
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Status banners */}
      {isInTrial && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <Clock size={20} style={{ color: "#f59e0b", flexShrink: 0 }} />
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
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
          style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
          <AlertTriangle size={20} style={{ color: "#f43f5e", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#f43f5e" }}>
              {currentPlan === "free" ? "No active plan" : "Trial ended"}
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Subscribe to activate Betty and start receiving WhatsApp messages.
            </p>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle size={20} style={{ color: "#10b981", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>
              Active — {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Betty is live and serving your customers.
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const price = plan.prices[currency] || plan.prices.GHS;
          return (
            <div
              key={plan.id}
              className="rounded-xl p-5 flex flex-col relative"
              style={{
                background: plan.popular ? "rgba(99,102,241,0.06)" : "#18181f",
                border: plan.popular
                  ? "1px solid rgba(99,102,241,0.35)"
                  : isCurrentPlan
                    ? "1px solid rgba(16,185,129,0.35)"
                    : "1px solid #2a2a35",
              }}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 px-3 py-0.5 rounded-full"
                  style={{
                    transform: "translateX(-50%)",
                    background: "#6366f1",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}>
                  MOST POPULAR
                </span>
              )}

              {/* Plan header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={15} style={{ color: plan.popular ? "#818cf8" : "#64748b" }} />
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                    {plan.title}
                  </p>
                  {isCurrentPlan && (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: "rgba(16,185,129,0.15)",
                      color: "#10b981",
                      border: "1px solid rgba(16,185,129,0.3)",
                      padding: "1px 6px",
                      borderRadius: 99,
                    }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 30, color: plan.popular ? "#818cf8" : "#f8fafc" }}>
                    {price.amount}
                  </p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>{plan.period}</p>
                </div>
                <p style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>
                  ✓ {TRIAL_DAYS}-day free trial included
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={12} style={{ color: "#10b981", marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={checkoutLoading === plan.id || isCurrentPlan}
                className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: isCurrentPlan ? "#2a2a35" : plan.popular ? "#6366f1" : "rgba(99,102,241,0.12)",
                  color: isCurrentPlan ? "#64748b" : "#fff",
                  border: isCurrentPlan ? "1px solid #2a2a35" : plan.popular ? "none" : "1px solid rgba(99,102,241,0.3)",
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: checkoutLoading === plan.id ? 0.7 : 1,
                  cursor: isCurrentPlan || checkoutLoading === plan.id ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                {checkoutLoading === plan.id ? (
                  <><Loader2 size={14} className="animate-spin" /> Redirecting to payment...</>
                ) : isCurrentPlan ? (
                  <><CheckCircle size={14} /> Current Plan</>
                ) : (
                  <><CreditCard size={14} /> Start {TRIAL_DAYS}-Day Free Trial</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment provider note */}
      <div className="px-4 py-3 rounded-lg" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
          <span style={{ color: "#818cf8", fontWeight: 500 }}>{TRIAL_DAYS}-day free trial</span> — No charge until trial ends.
          Cancel anytime. Payments processed securely by{" "}
          <span style={{ color: "#f8fafc" }}>Paystack</span> ({currentCountry?.name}).
          Subscriptions auto-renew monthly.
        </p>
      </div>
    </div>
  );
}