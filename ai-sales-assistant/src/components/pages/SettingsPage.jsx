// src/components/pages/SettingsPage.jsx
import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Bot,
  ChevronRight,
  Save,
  CheckCircle,
  LogOut,
  Trash2,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { apiGet, apiPatch } from "../../lib/api";

const SECTIONS = [
  {
    id: "ai",
    label: "Betty AI",
    icon: Bot,
    description: "Persona, tone, auto-reply settings",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Name, email, phone",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alerts for orders, handoffs, follow-ups",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password, API keys",
  },
  {
    id: "payments",
    label: "Payment Setup",
    icon: CreditCard,
    description: "Paystack, Flutterwave, Stripe",
  },
  {
    id: "business",
    label: "Business Info",
    icon: Globe,
    description: "Company, currency, timezone",
  },
];

export default function SettingsPage({ profileId }) {
  const [activeSection, setActiveSection] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [aiSettings, setAiSettings] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // ── Load settings from Supabase on mount ─────────────────
  useEffect(() => {
    async function loadSettings() {
      if (!profileId) return;
      try {
        const [ai, prof] = await Promise.all([
          apiGet(`/settings/ai/${profileId}`).catch(() => null),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", profileId)
            .single()
            .then(({ data }) => data),
        ]);
        setAiSettings(ai || {});
        setProfileData(prof || {});
      } catch (err) {
        console.error("Settings load error:", err);
      }
    }
    loadSettings();
  }, [profileId]);

  // ── Save AI settings to Supabase ─────────────────────────
  async function saveAiSettings(updates) {
    setSaveState("saving");
    try {
      await apiPatch(`/settings/ai/${profileId}`, updates);
      setAiSettings((prev) => ({ ...prev, ...updates }));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      console.error("Save error:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  // ── Save profile to Supabase ──────────────────────────────
  async function saveProfile(updates) {
    setSaveState("saving");
    try {
      await supabase.from("profiles").update(updates).eq("id", profileId);
      setProfileData((prev) => ({ ...prev, ...updates }));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      console.error("Profile save error:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  // ── Section renderer ──────────────────────────────────────
  if (activeSection) {
    return (
      <SectionDetail
        section={activeSection}
        onBack={() => setActiveSection(null)}
        saveState={saveState}
        aiSettings={aiSettings}
        profileData={profileData}
        onSaveAi={saveAiSettings}
        onSaveProfile={saveProfile}
        profileId={profileId}
      />
    );
  }

  return (
    <div className="fade-up max-w-xl">
      <div className="mb-6">
        <p
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#f8fafc",
          }}
        >
          Settings
        </p>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          Manage Betty and your account
        </p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors cursor-pointer text-left"
              style={{ background: "#18181f", border: "1px solid #2a2a35" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#22222c";
                e.currentTarget.style.borderColor = "#3a3a45";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#18181f";
                e.currentTarget.style.borderColor = "#2a2a35";
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <Icon size={18} style={{ color: "#818cf8" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: section.id === "ai" ? "#818cf8" : "#f8fafc",
                  }}
                >
                  {section.label}
                  {section.id === "ai" && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        color: "#818cf8",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      CORE
                    </span>
                  )}
                </p>
                <p
                  className="truncate"
                  style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}
                >
                  {section.description}
                </p>
              </div>
              <ChevronRight
                size={16}
                style={{ color: "#64748b", flexShrink: 0 }}
              />
            </button>
          );
        })}
      </div>

      {/* Sign out / delete */}
      <div className="mt-6 space-y-2">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors cursor-pointer text-left"
          style={{ background: "#18181f", border: "1px solid #2a2a35" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#22222c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#18181f";
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <LogOut size={18} style={{ color: "#f43f5e" }} />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 500, color: "#f43f5e" }}>
              Sign Out
            </p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Log out of this account
            </p>
          </div>
        </button>

        <button
          className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors cursor-pointer text-left"
          style={{
            background: "rgba(244,63,94,0.05)",
            border: "1px solid rgba(244,63,94,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(244,63,94,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(244,63,94,0.05)";
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <Trash2 size={18} style={{ color: "#f43f5e" }} />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 500, color: "#f43f5e" }}>
              Delete Account
            </p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Permanently remove all data
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Section detail view ───────────────────────────────────────
function SectionDetail({
  section,
  onBack,
  saveState,
  aiSettings,
  profileData,
  onSaveAi,
  onSaveProfile,
}) {
  const [localAi, setLocalAi] = useState(aiSettings || {});
  const [localProfile, setLocalProfile] = useState(profileData || {});

  const Icon = section.icon;

  function handleSave() {
    if (section.id === "ai") onSaveAi(localAi);
    if (section.id === "profile") onSaveProfile(localProfile);
    if (section.id === "business") onSaveProfile(localProfile);
  }

  const SaveBtn = () => (
    <button
      onClick={handleSave}
      disabled={saveState === "saving"}
      className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer"
      style={{
        background:
          saveState === "saved"
            ? "#6366f1"
            : saveState === "error"
              ? "rgba(244,63,94,0.15)"
              : "rgba(99,102,241,0.15)",
        color:
          saveState === "saved"
            ? "#fff"
            : saveState === "error"
              ? "#f43f5e"
              : "#818cf8",
        border: "1px solid rgba(99,102,241,0.3)",
        fontSize: 13,
        fontWeight: 600,
        opacity: saveState === "saving" ? 0.7 : 1,
      }}
    >
      {saveState === "saving" && <Loader2 size={14} className="animate-spin" />}
      {saveState === "saved" && <CheckCircle size={14} />}
      {saveState === "idle" || saveState === "error" ? (
        <Save size={14} />
      ) : null}
      {saveState === "saving"
        ? "Saving..."
        : saveState === "saved"
          ? "Saved!"
          : saveState === "error"
            ? "Error — retry"
            : "Save Changes"}
    </button>
  );

  return (
    <div className="fade-up max-w-xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 cursor-pointer"
        style={{
          background: "none",
          border: "none",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        ← Back to Settings
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <Icon size={18} style={{ color: "#818cf8" }} />
          </div>
          <p
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#f8fafc",
            }}
          >
            {section.label}
          </p>
        </div>
        <p style={{ fontSize: 12, color: "#64748b" }}>{section.description}</p>
      </div>

      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: "#18181f", border: "1px solid #2a2a35" }}
      >
        {/* ── Betty AI ─────────────────────────────────── */}
        {section.id === "ai" && (
          <>
            <Field
              label="AI Name"
              value={localAi.persona_name || "Betty"}
              onChange={(v) => setLocalAi((p) => ({ ...p, persona_name: v }))}
            />
            <SelectField
              label="Response Tone"
              value={localAi.persona_tone || "friendly"}
              options={[
                { value: "friendly", label: "Friendly" },
                { value: "professional", label: "Professional" },
                { value: "formal", label: "Formal" },
                { value: "playful", label: "Playful" },
              ]}
              onChange={(v) => setLocalAi((p) => ({ ...p, persona_tone: v }))}
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
                System Prompt
              </label>
              <textarea
                value={localAi.system_prompt || ""}
                onChange={(e) =>
                  setLocalAi((p) => ({ ...p, system_prompt: e.target.value }))
                }
                rows={4}
                placeholder="You are Betty, a friendly AI sales assistant..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f0f14",
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
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Instructions that tell Betty how to behave with customers.
              </p>
            </div>
            <div
              className="space-y-3 p-4 rounded-lg"
              style={{ background: "#0f0f14", border: "1px solid #2a2a35" }}
            >
              <Toggle
                label="Auto-Reply — Betty responds automatically"
                checked={localAi.auto_mode !== false}
                onChange={(v) => setLocalAi((p) => ({ ...p, auto_mode: v }))}
              />
              <div style={{ height: 1, background: "#2a2a35" }} />
              <Toggle
                label="Auto Follow-up — Chase abandoned carts"
                checked={localAi.auto_followup !== false}
                onChange={(v) =>
                  setLocalAi((p) => ({ ...p, auto_followup: v }))
                }
              />
              <div style={{ height: 1, background: "#2a2a35" }} />
              <Toggle
                label="Human Handoff — Escalate when stuck"
                checked={true}
                onChange={() => {}}
              />
            </div>
          </>
        )}

        {/* ── Profile ──────────────────────────────────── */}
        {section.id === "profile" && (
          <>
            <Field
              label="Full Name"
              value={localProfile.full_name || ""}
              onChange={(v) => setLocalProfile((p) => ({ ...p, full_name: v }))}
            />
            <Field
              label="Email"
              value={localProfile.email || ""}
              onChange={(v) => setLocalProfile((p) => ({ ...p, email: v }))}
              type="email"
            />
            <Field
              label="Phone"
              value={localProfile.phone_number || ""}
              onChange={(v) =>
                setLocalProfile((p) => ({ ...p, phone_number: v }))
              }
            />
          </>
        )}

        {/* ── Notifications ──────────────────────────── */}
        {section.id === "notifications" && (
          <div className="space-y-3">
            <Toggle
              label="New order alert"
              checked={true}
              onChange={() => {}}
            />
            <Toggle
              label="Human handoff alert"
              checked={true}
              onChange={() => {}}
            />
            <Toggle
              label="Follow-up reminder"
              checked={true}
              onChange={() => {}}
            />
            <Toggle
              label="Daily summary email"
              checked={false}
              onChange={() => {}}
            />
          </div>
        )}

        {/* ── Security ─────────────────────────────── */}
        {section.id === "security" && (
          <>
            <Field
              label="Current Password"
              type="password"
              value=""
              onChange={() => {}}
            />
            <Field
              label="New Password"
              type="password"
              value=""
              onChange={() => {}}
              placeholder="Enter new password"
            />
            <div className="pt-2">
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                API Key
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "#0f0f14", border: "1px solid #2a2a35" }}
              >
                <code
                  style={{
                    fontSize: 12,
                    color: "#818cf8",
                    fontFamily: "monospace",
                    flex: 1,
                  }}
                >
                  sk_live_xxxxxxxxxxxxxxxx
                </code>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText("sk_live_xxxxxxxxxxxxxxxx")
                  }
                  className="px-2 py-1 rounded cursor-pointer"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    color: "#818cf8",
                    border: "none",
                    fontSize: 11,
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Payments ─────────────────────────────── */}
        {section.id === "payments" && (
          <>
            <Field
              label="Paystack Secret Key"
              value=""
              onChange={() => {}}
              placeholder="sk_live_..."
            />
            <Field
              label="Flutterwave Secret Key"
              value=""
              onChange={() => {}}
              placeholder="FLWSECK_TEST-..."
            />
            <Field
              label="Stripe Secret Key"
              value=""
              onChange={() => {}}
              placeholder="sk_live_..."
            />
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Keys are encrypted after saving.
            </p>
          </>
        )}

        {/* ── Business ─────────────────────────────── */}
        {section.id === "business" && (
          <>
            <Field
              label="Company Name"
              value={localProfile.business_name || ""}
              onChange={(v) =>
                setLocalProfile((p) => ({ ...p, business_name: v }))
              }
            />
            <SelectField
              label="Default Currency"
              value={localProfile.currency || "GHS"}
              options={[
                { value: "GHS", label: "Ghana Cedi (GH₵)" },
                { value: "NGN", label: "Nigerian Naira (₦)" },
                { value: "USD", label: "US Dollar ($)" },
              ]}
              onChange={(v) => setLocalProfile((p) => ({ ...p, currency: v }))}
            />
            <SelectField
              label="Timezone"
              value={localProfile.timezone || "Africa/Accra"}
              options={[
                { value: "Africa/Accra", label: "Accra (GMT)" },
                { value: "Africa/Lagos", label: "Lagos (WAT)" },
              ]}
              onChange={(v) => setLocalProfile((p) => ({ ...p, timezone: v }))}
            />
          </>
        )}

        {/* ── Save button (for sections that write to DB) ── */}
        {["ai", "profile", "business"].includes(section.id) && (
          <div className="pt-4" style={{ borderTop: "1px solid #2a2a35" }}>
            <SaveBtn />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable form components ──────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder }) {
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "#0f0f14",
          border: "1px solid #2a2a35",
          borderRadius: 8,
          color: "#f8fafc",
          fontSize: 13,
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#6366f1";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#2a2a35";
        }}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ fontSize: 13, color: "#f8fafc" }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 cursor-pointer"
        style={{
          width: 40,
          height: 22,
          borderRadius: 99,
          background: checked ? "#6366f1" : "#2a2a35",
          border: "none",
          padding: 0,
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 20 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

function SelectField({ label, options, value, onChange }) {
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "#0f0f14",
          border: "1px solid #2a2a35",
          borderRadius: 8,
          color: "#f8fafc",
          fontSize: 13,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
