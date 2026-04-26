// src/components/pages/OnboardingModal.jsx
// ── First-time setup modal ────────────────────────────────────
// Shows when a new user signs up and hasn't set their business name yet.
// Saves to Supabase profiles table and pre-fills Betty's system prompt.

import { useState } from "react";
import {
  Bot,
  Building2,
  Phone,
  ShoppingBag,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const INDUSTRIES = [
  "Beauty & Skincare",
  "Food & Beverages",
  "Fashion & Clothing",
  "Electronics",
  "Health & Wellness",
  "Home & Furniture",
  "Agriculture",
  "Services",
  "Other",
];

const STEPS = ["welcome", "business", "products", "done"];

export default function OnboardingModal({ userId, onComplete }) {
  const [step, setStep] = useState("welcome");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    phone_number: "",
    industry: "",
    products: "",
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFinish() {
    setLoading(true);
    try {
      // Generate a tailored system prompt based on what the business sells
      // Escape user input to prevent prompt injection
      const escapedBusiness = (form.business_name || "").replace(
        /["\\'\\\\]/g,
        "\\\\$&",
      );
      const escapedProducts = (form.products || "our products").replace(
        /["\\'\\\\]/g,
        "\\\\$&",
      );
      const escapedIndustry = (form.industry || "").replace(
        /["\\'\\\\]/g,
        "\\\\$&",
      );

      const systemPrompt = `You are Betty, a friendly AI sales assistant for ${escapedBusiness}. 
You help customers learn about ${escapedProducts} in the ${escapedIndustry} industry.
Keep replies short like WhatsApp texts — max 2-3 sentences. Be warm, helpful, and direct.
When a customer wants to buy, confirm their order details clearly.
Always be polite and professional.`;

      // Update profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          business_name: form.business_name,
          phone_number: form.phone_number,
          industry: form.industry,
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (profileError) throw profileError;

      // Upsert AI settings with the generated system prompt
      await supabase.from("ai_settings").upsert(
        {
          profile_id: updatedProfile.id,
          persona_name: "Betty",
          persona_tone: "friendly",
          system_prompt: systemPrompt,
          auto_mode: true,
          auto_followup: true,
        },
        { onConflict: "profile_id" },
      );

      setStep("done");
      setTimeout(() => onComplete(updatedProfile), 1800);
    } catch (err) {
      console.error("Onboarding save error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#0f0f14", border: "1px solid #2a2a35" }}
      >
        {/* Progress bar */}
        {step !== "done" && (
          <div style={{ height: 3, background: "#1a1a22" }}>
            <div
              style={{
                height: "100%",
                background: "#6366f1",
                width:
                  step === "welcome"
                    ? "25%"
                    : step === "business"
                      ? "60%"
                      : "90%",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        )}

        <div className="p-8">
          {/* ── Step: Welcome ── */}
          {step === "welcome" && (
            <div className="text-center">
              <div
                className="flex items-center justify-center rounded-2xl mx-auto mb-6"
                style={{ width: 72, height: 72, background: "#6366f1" }}
              >
                <Bot size={36} style={{ color: "#fff" }} />
              </div>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: "#f8fafc",
                  marginBottom: 12,
                }}
              >
                Welcome to SalesBot!
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 1.7,
                  marginBottom: 32,
                }}
              >
                Let's set up Betty for your business in under 2 minutes. Betty
                will auto-reply to your WhatsApp customers, log orders, and
                follow up on abandoned carts.
              </p>
              <button
                onClick={() => setStep("business")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer"
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Let's go <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step: Business info ── */}
          {step === "business" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={18} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#f8fafc",
                    }}
                  >
                    Your Business
                  </p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>
                    Tell Betty about your business
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <OnboardField
                  label="Business Name *"
                  placeholder="e.g. Ama's Beauty Store"
                  value={form.business_name}
                  onChange={(v) => update("business_name", v)}
                  icon={<Building2 size={14} />}
                />
                <OnboardField
                  label="WhatsApp Phone Number"
                  placeholder="e.g. +233 24 123 4567"
                  value={form.phone_number}
                  onChange={(v) => update("phone_number", v)}
                  icon={<Phone size={14} />}
                  type="tel"
                />
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
                    Industry
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 12px",
                      background: "#18181f",
                      border: "1px solid #2a2a35",
                      borderRadius: 8,
                      color: form.industry ? "#f8fafc" : "#64748b",
                      fontSize: 13,
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#6366f1";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#2a2a35";
                    }}
                  >
                    <option value="">Select your industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("welcome")}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "#18181f",
                    color: "#64748b",
                    border: "1px solid #2a2a35",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("products")}
                  disabled={!form.business_name.trim()}
                  style={{
                    flex: 2,
                    padding: "11px",
                    background: form.business_name.trim()
                      ? "#6366f1"
                      : "#2a2a35",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: form.business_name.trim()
                      ? "pointer"
                      : "not-allowed",
                    opacity: form.business_name.trim() ? 1 : 0.6,
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Products ── */}
          {step === "products" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={18} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#f8fafc",
                    }}
                  >
                    What do you sell?
                  </p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>
                    Betty will use this to answer customer questions
                  </p>
                </div>
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
                  Describe your products or services
                </label>
                <textarea
                  value={form.products}
                  onChange={(e) => update("products", e.target.value)}
                  placeholder="e.g. Organic shea butter, coconut oil, black soap, and other natural beauty products. Delivery available across Ghana."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    background: "#18181f",
                    border: "1px solid #2a2a35",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6366f1";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#2a2a35";
                  }}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginTop: 6,
                    lineHeight: 1.5,
                  }}
                >
                  The more detail you give, the smarter Betty's replies will be.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("business")}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "#18181f",
                    color: "#64748b",
                    border: "1px solid #2a2a35",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex items-center justify-center gap-2"
                  style={{
                    flex: 2,
                    padding: "11px",
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Setting up
                      Betty...
                    </>
                  ) : (
                    "Launch Betty ⚡"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === "done" && (
            <div className="text-center py-4">
              <div
                className="flex items-center justify-center rounded-full mx-auto mb-6"
                style={{
                  width: 72,
                  height: 72,
                  background: "rgba(16,185,129,0.15)",
                  border: "2px solid #10b981",
                }}
              >
                <CheckCircle size={36} style={{ color: "#10b981" }} />
              </div>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "#f8fafc",
                  marginBottom: 8,
                }}
              >
                Betty is ready! 🎉
              </p>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Your AI sales assistant has been configured for{" "}
                <span style={{ color: "#818cf8" }}>{form.business_name}</span>.
                Heading to your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  type = "text",
}) {
  return (
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
        {label}
      </label>
      <div
        className="flex items-center gap-2 px-3 rounded-lg"
        style={{ background: "#18181f", border: "1px solid #2a2a35" }}
        onFocus={() => {}}
      >
        <span style={{ color: "#64748b", flexShrink: 0 }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: "11px 0",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "#f8fafc",
          }}
          onFocus={(e) => {
            e.target.closest("div").style.borderColor = "#6366f1";
          }}
          onBlur={(e) => {
            e.target.closest("div").style.borderColor = "#2a2a35";
          }}
        />
      </div>
    </div>
  );
}
