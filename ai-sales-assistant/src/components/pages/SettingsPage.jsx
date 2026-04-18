// src/components/pages/SettingsPage.jsx
// AI Persona + Business Profile — both save buttons fully hooked to Supabase

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  Zap,
  Building2,
  Wifi,
  WifiOff,
} from "lucide-react";

// ── Supabase client ──────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// ── Reusable small components ────────────────────────────────

function SectionCard({ children, style }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "#111710", border: "1px solid #1f2a1e", ...style }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "#fff",
          marginBottom: 4,
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 12, color: "#4a6a44" }}>{subtitle}</p>
    </div>
  );
}

function Label({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 500,
        color: "#7a9a74",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  background: "#192018",
  border: "1px solid #243024",
  borderRadius: 8,
  padding: "9px 13px",
  fontSize: 13,
  color: "#e8f5e2",
  outline: "none",
};

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "#22c55e";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#243024";
      }}
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: 13, color: "#e8f5e2" }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0"
        style={{
          width: 40,
          height: 22,
          borderRadius: 99,
          background: checked ? "#22c55e" : "#243024",
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
          padding: 0,
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

function SaveButton({ loading, saved, label = "Save Changes" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2 rounded-lg transition-all"
      style={{
        background: saved ? "#166534" : loading ? "#166534" : "#22c55e",
        color: "#000",
        fontWeight: 600,
        fontSize: 13,
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = "#16a34a";
      }}
      onMouseLeave={(e) => {
        if (!loading)
          e.currentTarget.style.background = saved ? "#166534" : "#22c55e";
      }}
    >
      {loading ? (
        <>
          <Loader size={14} className="animate-spin" /> Saving...
        </>
      ) : saved ? (
        <>
          <CheckCircle size={14} /> Saved!
        </>
      ) : (
        <>
          <Save size={14} /> {label}
        </>
      )}
    </button>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-lg mt-3"
      style={{
        background: isError ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
        border: `1px solid ${isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
        color: isError ? "#f87171" : "#4ade80",
        fontSize: 12,
      }}
    >
      {isError ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
      {message}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function SettingsPage() {
  // ── Auth state ──
  const [userId, setUserId] = useState(null);
  const [profileId, setProfileId] = useState(null);

  // ── AI Persona state ──
  const [personaName, setPersonaName] = useState("Betty");
  const [personaTone, setPersonaTone] = useState("friendly");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const [autoFollowup, setAutoFollowup] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiToast, setAiToast] = useState({ message: "", type: "" });

  // ── Business Profile state ──
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [bizLoading, setBizLoading] = useState(false);
  const [bizSaved, setBizSaved] = useState(false);
  const [bizToast, setBizToast] = useState({ message: "", type: "" });

  // ── Page loading ──
  const [pageLoading, setPageLoading] = useState(true);

  // ────────────────────────────────────────────────────────────
  // Load existing data when the page mounts
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSettings() {
      try {
        // 1. Get the currently logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not authenticated");
        setUserId(user.id);

        // 2. Load their business profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setProfileId(profile.id);
          setBusinessName(profile.business_name || "");
          setPhone(profile.phone_number || "");
          setIndustry(profile.industry || "");
        }

        // 3. Load their AI settings (linked to profile)
        if (profile) {
          const { data: aiSettings } = await supabase
            .from("ai_settings")
            .select("*")
            .eq("profile_id", profile.id)
            .single();

          if (aiSettings) {
            setPersonaName(aiSettings.persona_name || "Betty");
            setPersonaTone(aiSettings.persona_tone || "friendly");
            setSystemPrompt(aiSettings.system_prompt || "");
            setAutoMode(aiSettings.auto_mode ?? true);
            setAutoFollowup(aiSettings.auto_followup ?? true);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err.message);
      } finally {
        setPageLoading(false);
      }
    }

    loadSettings();
  }, []);

  // ────────────────────────────────────────────────────────────
  // SAVE — AI Persona
  // Upserts into ai_settings table (inserts if new, updates if exists)
  // ────────────────────────────────────────────────────────────
  async function handleSaveAiPersona(e) {
    e.preventDefault();
    if (!profileId) {
      setAiToast({
        message: "No business profile found. Save your business profile first.",
        type: "error",
      });
      return;
    }

    try {
      setAiLoading(true);
      setAiToast({ message: "", type: "" });

      const { error } = await supabase.from("ai_settings").upsert(
        {
          profile_id: profileId,
          persona_name: personaName,
          persona_tone: personaTone,
          system_prompt: systemPrompt,
          auto_mode: autoMode,
          auto_followup: autoFollowup,
        },
        { onConflict: "profile_id" }, // update if profile_id already exists
      );

      if (error) throw error;

      setAiSaved(true);
      setAiToast({
        message: "AI persona saved successfully.",
        type: "success",
      });
      setTimeout(() => setAiSaved(false), 3000);
    } catch (err) {
      setAiToast({ message: `Failed to save: ${err.message}`, type: "error" });
    } finally {
      setAiLoading(false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // SAVE — Business Profile
  // Upserts into profiles table
  // ────────────────────────────────────────────────────────────
  async function handleSaveBusinessProfile(e) {
    e.preventDefault();
    if (!businessName.trim()) {
      setBizToast({ message: "Business name is required.", type: "error" });
      return;
    }
    if (!userId) {
      setBizToast({
        message: "Not authenticated. Please log in again.",
        type: "error",
      });
      return;
    }

    try {
      setBizLoading(true);
      setBizToast({ message: "", type: "" });

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            business_name: businessName,
            phone_number: phone,
            industry: industry,
          },
          { onConflict: "user_id" }, // update if user already has a profile
        )
        .select()
        .single();

      if (error) throw error;

      // Store the profile id so AI settings save works too
      if (data?.id) setProfileId(data.id);

      setBizSaved(true);
      setBizToast({
        message: "Business profile saved successfully.",
        type: "success",
      });
      setTimeout(() => setBizSaved(false), 3000);
    } catch (err) {
      setBizToast({ message: `Failed to save: ${err.message}`, type: "error" });
    } finally {
      setBizLoading(false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div style={{ color: "#22c55e", fontSize: 13 }}>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up space-y-5 max-w-2xl">
      {/* ── SECTION 1: AI Persona ── */}
      <SectionCard>
        <SectionTitle
          title="AI Identity & Persona"
          subtitle="Define how Betty speaks to your customers."
        />

        <form onSubmit={handleSaveAiPersona} className="space-y-4">
          {/* AI Name */}
          <div>
            <Label>AI Name</Label>
            <TextInput
              value={personaName}
              onChange={setPersonaName}
              placeholder="Betty"
            />
          </div>

          {/* Tone */}
          <div>
            <Label>Response Tone</Label>
            <select
              value={personaTone}
              onChange={(e) => setPersonaTone(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => {
                e.target.style.borderColor = "#22c55e";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#243024";
              }}
            >
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="formal">Formal</option>
              <option value="playful">Playful</option>
            </select>
          </div>

          {/* System Prompt */}
          <div>
            <Label>System Prompt</Label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are Betty, a friendly AI sales assistant. You help customers find products, answer questions, and process orders..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => {
                e.target.style.borderColor = "#22c55e";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#243024";
              }}
            />
            <p style={{ fontSize: 11, color: "#4a6a44", marginTop: 4 }}>
              This is the instruction that tells the AI how to behave with your
              customers.
            </p>
          </div>

          {/* Toggles */}
          <div
            className="space-y-3 p-4 rounded-lg"
            style={{ background: "#192018", border: "1px solid #243024" }}
          >
            <Toggle
              checked={autoMode}
              onChange={setAutoMode}
              label="Auto-Mode — AI replies to customers automatically"
            />
            <div style={{ height: 1, background: "#243024" }} />
            <Toggle
              checked={autoFollowup}
              onChange={setAutoFollowup}
              label="Auto Follow-up — AI chases abandoned carts automatically"
            />
          </div>

          {/* Toast + Save */}
          <Toast message={aiToast.message} type={aiToast.type} />
          <div className="flex justify-end pt-1">
            <SaveButton loading={aiLoading} saved={aiSaved} />
          </div>
        </form>
      </SectionCard>

      {/* ── SECTION 2: Business Profile ── */}
      <SectionCard>
        <SectionTitle
          title="Business Profile"
          subtitle="Your business details stored in the database."
        />

        <form onSubmit={handleSaveBusinessProfile} className="space-y-4">
          {/* Business Name */}
          <div>
            <Label>Business Name *</Label>
            <TextInput
              value={businessName}
              onChange={setBusinessName}
              placeholder="e.g. Akosua's Beauty Store"
            />
          </div>

          {/* Phone */}
          <div>
            <Label>WhatsApp Business Number</Label>
            <TextInput
              value={phone}
              onChange={setPhone}
              placeholder="+233 24 000 0000"
              type="tel"
            />
          </div>

          {/* Industry */}
          <div>
            <Label>Industry</Label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => {
                e.target.style.borderColor = "#22c55e";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#243024";
              }}
            >
              <option value="">Select your industry</option>
              <option value="beauty">Beauty & Skincare</option>
              <option value="fashion">Fashion & Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="electronics">Electronics</option>
              <option value="health">Health & Wellness</option>
              <option value="home">Home & Living</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Toast + Save */}
          <Toast message={bizToast.message} type={bizToast.type} />
          <div className="flex justify-end pt-1">
            <SaveButton
              loading={bizLoading}
              saved={bizSaved}
              label="Save Profile"
            />
          </div>
        </form>
      </SectionCard>

      {/* ── SECTION 3: WhatsApp Connection ── */}
      <SectionCard>
        <SectionTitle
          title="WhatsApp Connection"
          subtitle="Status of your WhatsApp Business API integration."
        />
        <div
          className="flex items-center justify-between p-4 rounded-lg"
          style={{ background: "#192018", border: "1px solid #243024" }}
        >
          <div className="flex items-center gap-3">
            <div style={{ color: "#4a6a44" }}>
              <WifiOff size={18} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>
                WhatsApp Business
              </p>
              <p style={{ fontSize: 11, color: "#4a6a44", marginTop: 1 }}>
                Not connected — waiting for backend setup
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 10px",
              borderRadius: 99,
              background: "rgba(234,179,8,0.15)",
              color: "#facc15",
              border: "1px solid rgba(234,179,8,0.3)",
            }}
          >
            Pending
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#2a4a24", marginTop: 10 }}>
          This will update automatically once your backend dev connects the
          WhatsApp Business API.
        </p>
      </SectionCard>

      {/* ── SECTION 4: Danger Zone ── */}
      <SectionCard style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
        <SectionTitle
          title="Danger Zone"
          subtitle="Irreversible actions. Be careful."
        />
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="px-5 py-2 rounded-lg transition-all"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          }}
        >
          Sign Out
        </button>
      </SectionCard>
    </div>
  );
}
