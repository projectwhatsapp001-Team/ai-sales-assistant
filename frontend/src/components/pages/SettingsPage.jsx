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
  ChevronLeft,
  Key,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { apiGet, apiPatch } from "../../lib/api";

const SECTIONS = [
  {
    id: "ai",
    label: "Betty AI Configuration",
    icon: Bot,
    description: "Persona, tone, and automated reply logic",
  },
  {
    id: "profile",
    label: "Personal Profile",
    icon: User,
    description: "Your name, email, and contact details",
  },
  {
    id: "notifications",
    label: "System Alerts",
    icon: Bell,
    description: "Real-time updates and daily summaries",
  },
  {
    id: "security",
    label: "Security & API",
    icon: Shield,
    description: "Credentials and integration keys",
  },
  {
    id: "payments",
    label: "Payment Gateways",
    icon: CreditCard,
    description: "Connect Paystack or Stripe",
  },
  {
    id: "business",
    label: "Business Details",
    icon: Globe,
    description: "Company identity and regional settings",
  },
];

export default function SettingsPage({ profileId }) {
  const [activeSection, setActiveSection] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [aiSettings, setAiSettings] = useState(null);
  const [profileData, setProfileData] = useState(null);

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

  async function saveAiSettings(updates) {
    setSaveState("saving");
    try {
      await apiPatch(`/settings/ai/${profileId}`, updates);
      setAiSettings((prev) => ({ ...prev, ...updates }));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  async function saveProfile(updates) {
    setSaveState("saving");
    try {
      await supabase.from("profiles").update(updates).eq("id", profileId);
      setProfileData((prev) => ({ ...prev, ...updates }));
      if (updates.business_name) localStorage.setItem("betty-business-name", updates.business_name);
      if (updates.full_name) localStorage.setItem("betty-user-name", updates.full_name);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

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
      />
    );
  }

  return (
    <div className="fade-up max-w-2xl pb-10">
      <div className="mb-10">
        <h1 className="font-syne font-bold text-2xl text-slate-50 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Customize your SalesBot experience and manage preferences.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section)}
              className="w-full flex flex-col gap-4 p-6 rounded-3xl transition-all duration-300 cursor-pointer text-left bg-slate-900 border border-slate-800 hover:bg-slate-800/40 hover:-translate-y-1 hover:border-slate-700 group shadow-xl shadow-black/5"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center justify-center rounded-2xl flex-shrink-0 w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <Icon size={20} className="text-indigo-400" />
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-50 group-hover:text-indigo-400 transition-colors">
                  {section.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">
                  {section.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/20 active:scale-95"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <button
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 active:scale-95 shadow-lg shadow-rose-500/5"
        >
          <Trash2 size={18} />
          Delete Account
        </button>
      </div>
    </div>
  );
}

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
    else if (["profile", "business"].includes(section.id)) onSaveProfile(localProfile);
  }

  const isSaving = saveState === "saving";
  const isSaved = saveState === "saved";
  const isError = saveState === "error";

  return (
    <div className="fade-up max-w-xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-8 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Overview
      </button>

      <div className="mb-10 flex items-center gap-6">
        <div className="flex items-center justify-center rounded-3xl w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
          <Icon size={28} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-2xl text-slate-50 tracking-tight">{section.label}</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{section.description}</p>
        </div>
      </div>

      <div className="rounded-3xl p-8 space-y-8 bg-slate-900 border border-slate-800 shadow-2xl">
        {section.id === "ai" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field
                label="AI Persona Name"
                value={localAi.persona_name || "Betty"}
                onChange={(v) => setLocalAi((p) => ({ ...p, persona_name: v }))}
              />
              <SelectField
                label="Conversation Tone"
                value={localAi.persona_tone || "friendly"}
                options={[
                  { value: "friendly", label: "Friendly & Warm" },
                  { value: "professional", label: "Professional & Precise" },
                  { value: "formal", label: "Formal & Resolute" },
                  { value: "playful", label: "Playful & Energetic" },
                ]}
                onChange={(v) => setLocalAi((p) => ({ ...p, persona_tone: v }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">
                System Intelligence Directive
              </label>
              <textarea
                value={localAi.system_prompt || ""}
                onChange={(e) => setLocalAi((p) => ({ ...p, system_prompt: e.target.value }))}
                rows={5}
                placeholder="You are SalesBot's core intelligence..."
                className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[13px] text-slate-50 outline-none resize-none leading-relaxed focus:border-indigo-500/50 transition-all shadow-inner"
              />
              <p className="text-[10px] text-slate-500 mt-3 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                This prompt defines Betty's knowledge base and boundaries.
              </p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              <Toggle
                label="Autonomous Mode"
                checked={localAi.auto_mode !== false}
                onChange={(v) => setLocalAi((p) => ({ ...p, auto_mode: v }))}
              />
              <div className="h-px bg-slate-800/50" />
              <Toggle
                label="Proactive Follow-ups"
                checked={localAi.auto_followup !== false}
                onChange={(v) => setLocalAi((p) => ({ ...p, auto_followup: v }))}
              />
            </div>
          </>
        )}

        {section.id === "profile" && (
          <div className="space-y-6">
            <Field
              label="Full Name"
              value={localProfile.full_name || ""}
              onChange={(v) => setLocalProfile((p) => ({ ...p, full_name: v }))}
            />
            <Field
              label="Email Address"
              value={localProfile.email || ""}
              onChange={(v) => setLocalProfile((p) => ({ ...p, email: v }))}
              type="email"
            />
            <Field
              label="WhatsApp Phone"
              value={localProfile.phone_number || ""}
              onChange={(v) => setLocalProfile((p) => ({ ...p, phone_number: v }))}
            />
          </div>
        )}

        {section.id === "notifications" && (
          <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <Toggle label="Push: New Order Alerts" checked={true} onChange={() => {}} />
            <div className="h-px bg-slate-800/50" />
            <Toggle label="Push: Human Handoff Requests" checked={true} onChange={() => {}} />
            <div className="h-px bg-slate-800/50" />
            <Toggle label="Email: Daily Performance Summary" checked={false} onChange={() => {}} />
          </div>
        )}

        {section.id === "security" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Current Password" type="password" value="" onChange={() => {}} />
              <Field label="New Password" type="password" value="" onChange={() => {}} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Live API Intelligence Key</p>
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner group">
                <Key size={16} className="text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
                <code className="text-xs text-indigo-400 font-mono flex-1">sk_live_••••••••••••••••</code>
                <button
                  onClick={() => navigator.clipboard.writeText("sk_live_secret_key")}
                  className="px-4 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/20 transition-all border border-indigo-500/20 active:scale-95"
                >
                  Copy Key
                </button>
              </div>
            </div>
          </div>
        )}

        {section.id === "business" && (
          <div className="space-y-6">
            <Field
              label="Legal Business Name"
              value={localProfile.business_name || ""}
              onChange={(v) => setLocalProfile((p) => ({ ...p, business_name: v }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SelectField
                label="Primary Currency"
                value={localProfile.currency || "GHS"}
                options={[
                  { value: "GHS", label: "Ghana Cedi (GH₵)" },
                  { value: "NGN", label: "Nigerian Naira (₦)" },
                  { value: "USD", label: "US Dollar ($)" },
                ]}
                onChange={(v) => setLocalProfile((p) => ({ ...p, currency: v }))}
              />
              <SelectField
                label="Operating Timezone"
                value={localProfile.timezone || "Africa/Accra"}
                options={[
                  { value: "Africa/Accra", label: "Accra (GMT)" },
                  { value: "Africa/Lagos", label: "Lagos (WAT)" },
                ]}
                onChange={(v) => setLocalProfile((p) => ({ ...p, timezone: v }))}
              />
            </div>
          </div>
        )}

        {["ai", "profile", "business"].includes(section.id) && (
          <div className="pt-8 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-xl ${
                isSaved 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : isError 
                    ? "bg-rose-500 text-white shadow-rose-500/20"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20"
              } ${isSaving ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <CheckCircle size={16} /> : <Save size={16} />}
              {isSaving ? "Processing..." : isSaved ? "Changes Saved!" : isError ? "Save Failed — Retry" : "Commit Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-[13px] text-slate-50 outline-none focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-slate-700 font-medium"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[13px] font-bold text-slate-300 group-hover:text-slate-50 transition-colors">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          checked ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-slate-800"
        }`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-[13px] text-slate-50 outline-none cursor-pointer focus:border-indigo-500/50 transition-all appearance-none shadow-inner font-medium"
        >
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-slate-400 transition-colors">
          <ChevronRight size={14} className="rotate-90" />
        </div>
      </div>
    </div>
  );
}
