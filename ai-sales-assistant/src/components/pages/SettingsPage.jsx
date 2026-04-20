// src/components/pages/SettingsPage.jsx
import { useState } from "react";
import { User, Bell, Shield, CreditCard, Globe, Bot, ChevronRight, Save, CheckCircle, LogOut, Trash2 } from "lucide-react";

const SECTIONS = [
  { id: "ai", label: "Betty AI", icon: Bot, description: "Persona, tone, auto-reply settings" },
  { id: "profile", label: "Profile", icon: User, description: "Name, email, phone" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts for orders, handoffs, follow-ups" },
  { id: "security", label: "Security", icon: Shield, description: "Password, API keys" },
  { id: "payments", label: "Payment Setup", icon: CreditCard, description: "Paystack, Flutterwave, Stripe" },
  { id: "business", label: "Business Info", icon: Globe, description: "Company, currency, timezone" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (activeSection) {
    const SectionIcon = activeSection.icon;
    return (
      <div className="fade-up max-w-xl">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 mb-6 cursor-pointer"
          style={{ background: "none", border: "none", color: "#64748b", fontSize: 13 }}
        >
          ← Back to Settings
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <SectionIcon size={18} style={{ color: "#818cf8" }} />
            </div>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc" }}>{activeSection.label}</p>
          </div>
          <p style={{ fontSize: 12, color: "#64748b" }}>{activeSection.description}</p>
        </div>

        <div className="rounded-xl p-5 space-y-4" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
          {activeSection.id === "ai" && (
            <>
              <Field label="AI Name" defaultValue="Betty" />
              <Select label="Response Tone" options={[{ value: "friendly", label: "Friendly" }, { value: "professional", label: "Professional" }, { value: "formal", label: "Formal" }, { value: "playful", label: "Playful" }]} defaultValue="friendly" />
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>System Prompt</label>
                <textarea
                  defaultValue="You are Betty, a friendly AI sales assistant. You help customers find products, answer questions, and process orders."
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", background: "#0f0f14", border: "1px solid #2a2a35", borderRadius: 8, color: "#f8fafc", fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.6 }}
                  onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a35"; }}
                />
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Instructions that tell Betty how to behave with customers.</p>
              </div>
              <div className="space-y-3 p-4 rounded-lg" style={{ background: "#0f0f14", border: "1px solid #2a2a35" }}>
                <Toggle label="Auto-Reply — Betty responds automatically" defaultOn={true} />
                <div style={{ height: 1, background: "#2a2a35" }} />
                <Toggle label="Auto Follow-up — Chase abandoned carts" defaultOn={true} />
                <div style={{ height: 1, background: "#2a2a35" }} />
                <Toggle label="Human Handoff — Escalate when stuck" defaultOn={true} />
              </div>
            </>
          )}

          {activeSection.id === "profile" && (
            <>
              <Field label="Full Name" defaultValue="Team Lead" />
              <Field label="Email" type="email" defaultValue="admin@bettysales.com" />
              <Field label="Phone" defaultValue="+233 24 000 0000" />
            </>
          )}

          {activeSection.id === "notifications" && (
            <div className="space-y-3">
              <Toggle label="New order alert" defaultOn={true} />
              <Toggle label="Human handoff alert" defaultOn={true} />
              <Toggle label="Follow-up reminder" defaultOn={true} />
              <Toggle label="Daily summary email" defaultOn={false} />
            </div>
          )}

          {activeSection.id === "security" && (
            <>
              <Field label="Current Password" type="password" defaultValue="********" />
              <Field label="New Password" type="password" placeholder="Enter new password" />
              <div className="pt-2">
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>API Key</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#0f0f14", border: "1px solid #2a2a35" }}>
                  <code style={{ fontSize: 12, color: "#818cf8", fontFamily: "monospace", flex: 1 }}>sk_live_xxxxxxxxxxxxxxxx</code>
                  <button className="px-2 py-1 rounded text-xs cursor-pointer" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "none" }}>Copy</button>
                </div>
              </div>
            </>
          )}

          {activeSection.id === "payments" && (
            <>
              <Field label="Paystack Secret Key" placeholder="sk_live_..." />
              <Field label="Flutterwave Secret Key" placeholder="FLWSECK_TEST-..." />
              <Field label="Stripe Secret Key" placeholder="sk_live_..." />
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Keys are encrypted after saving.</p>
            </>
          )}

          {activeSection.id === "business" && (
            <>
              <Field label="Company Name" defaultValue="Betty Sales" />
              <Select label="Default Currency" options={[{ value: "GHS", label: "Ghana Cedi (GH₵)" }, { value: "NGN", label: "Nigerian Naira (₦)" }, { value: "USD", label: "US Dollar ($)" }]} defaultValue="GHS" />
              <Select label="Timezone" options={[{ value: "Africa/Accra", label: "Accra (GMT)" }, { value: "Africa/Lagos", label: "Lagos (WAT)" }]} defaultValue="Africa/Accra" />
            </>
          )}

          <div className="pt-4" style={{ borderTop: "1px solid #2a2a35" }}>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors"
              style={{ background: saved ? "#6366f1" : "rgba(99,102,241,0.15)", color: saved ? "#fff" : "#818cf8", border: "1px solid rgba(99,102,241,0.3)", fontSize: 13, fontWeight: 600 }}
            >
              {saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up max-w-xl">
      <div className="mb-6">
        <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc" }}>Settings</p>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Manage Betty and your account</p>
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "#22222c"; e.currentTarget.style.borderColor = "#3a3a45"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#18181f"; e.currentTarget.style.borderColor = "#2a2a35"; }}
            >
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 40, height: 40, background: section.id === "ai" ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)", border: section.id === "ai" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(99,102,241,0.2)" }}>
                <Icon size={18} style={{ color: section.id === "ai" ? "#818cf8" : "#818cf8" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 500, color: section.id === "ai" ? "#818cf8" : "#f8fafc" }}>
                  {section.label}
                  {section.id === "ai" && <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 10, fontWeight: 600 }}>CORE</span>}
                </p>
                <p className="truncate" style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{section.description}</p>
              </div>
              <ChevronRight size={16} style={{ color: "#64748b", flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors cursor-pointer text-left" style={{ background: "#18181f", border: "1px solid #2a2a35" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#22222c"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#18181f"; }}>
          <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 40, height: 40, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <LogOut size={18} style={{ color: "#f43f5e" }} />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 500, color: "#f43f5e" }}>Sign Out</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Log out of this account</p>
          </div>
        </button>

        <button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors cursor-pointer text-left" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.05)"; }}>
          <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 40, height: 40, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <Trash2 size={18} style={{ color: "#f43f5e" }} />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 500, color: "#f43f5e" }}>Delete Account</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Permanently remove all data</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function Field({ label, type = "text", defaultValue, placeholder }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", background: "#0f0f14", border: "1px solid #2a2a35", borderRadius: 8, color: "#f8fafc", fontSize: 13, outline: "none" }}
        onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
        onBlur={(e) => { e.target.style.borderColor = "#2a2a35"; }}
      />
    </div>
  );
}

function Toggle({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ fontSize: 13, color: "#f8fafc" }}>{label}</span>
      <button
        onClick={() => setOn(!on)}
        className="relative flex-shrink-0 cursor-pointer"
        style={{ width: 40, height: 22, borderRadius: 99, background: on ? "#6366f1" : "#2a2a35", border: "none", padding: 0, transition: "background 0.2s" }}
      >
        <span style={{ position: "absolute", top: 3, left: on ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

function Select({ label, options, defaultValue }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>{label}</label>
      <select
        defaultValue={defaultValue}
        style={{ width: "100%", padding: "10px 12px", background: "#0f0f14", border: "1px solid #2a2a35", borderRadius: 8, color: "#f8fafc", fontSize: 13, outline: "none", cursor: "pointer" }}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}