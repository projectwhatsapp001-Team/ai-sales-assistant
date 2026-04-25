// src/components/pages/OverviewPage.jsx
import { useState, useEffect } from "react";
import { MessageSquare, Users, Clock, ChevronRight, ChevronLeft, Hand } from "lucide-react";
import { apiGet } from "../../lib/api";

const MOCK_OPPORTUNITIES = [
  {
    id: "1",
    customers: { full_name: "John Smith", phone_number: "+233 24 123 4567" },
    status: "buying",
    message: "I'm interested in your premium package...",
    time: "5m ago",
    needs_human: false,
    typing: true,
  },
  {
    id: "2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 987 6543" },
    status: "asking",
    message: "Asked price and next steps",
    time: "6m ago",
    needs_human: false,
  },
  {
    id: "3",
    customers: { full_name: "Kemi Adeyemi", phone_number: "+233 20 456 7890" },
    status: "buying",
    message: "Can I pay on delivery?",
    time: "7m ago",
    needs_human: true,
  },
  {
    id: "4",
    customers: { full_name: "+234 810 555 1234", phone_number: "+234 810 555 1234" },
    status: "follow-up",
    message: "Need to confirm with my partner...",
    time: "12m ago",
    needs_human: false,
  },
];

const STATUS_CONFIG = {
  buying: { label: "Buying", bg: "rgba(16,185,129,0.15)", color: "#10b981", border: "rgba(16,185,129,0.3)" },
  asking: { label: "Asking", bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  "follow-up": { label: "Follow-Up", bg: "rgba(100,116,139,0.15)", color: "#64748b", border: "rgba(100,116,139,0.3)" },
  "needs-human": { label: "Needs Human", bg: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "rgba(244,63,94,0.3)" },
};

function MetricCard({ label, value, icon: Icon, color, pulse, subtext }) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{ background: "#18181f", border: "1px solid #2a2a35" }}
    >
      <div
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          width: 48,
          height: 48,
          background: pulse ? "rgba(244,63,94,0.15)" : "rgba(99,102,241,0.1)",
          border: pulse ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(99,102,241,0.2)",
        }}
      >
        {pulse ? (
          <div className="relative flex items-center justify-center">
            <Hand size={22} style={{ color: "#f43f5e" }} />
            <span className="absolute rounded-full pulse-ring" style={{ width: 44, height: 44, border: "2px solid #f43f5e" }} />
            <span className="absolute rounded-full pulse-ring" style={{ width: 44, height: 44, border: "2px solid #f43f5e", animationDelay: "1s" }} />
          </div>
        ) : (
          <Icon size={22} style={{ color: color || "#818cf8" }} />
        )}
      </div>
      <div>
        <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </p>
        <p
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 40,
            fontWeight: 700,
            color: pulse ? "#f43f5e" : "#f8fafc",
            lineHeight: 1,
            marginTop: 6,
          }}
        >
          {value}
        </p>
        {subtext && (
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{subtext}</p>
        )}
      </div>
    </div>
  );
}

function OpportunityRow({ data, index }) {
  const status = data.needs_human ? "needs-human" : data.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.buying;
  const name = data.customers?.full_name || "Unknown";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColors = {
    buying: "#10b981",
    asking: "#f59e0b",
    "follow-up": "#6366f1",
    "needs-human": "#f43f5e",
  };

  return (
    <div
      className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors"
      style={{
        borderTop: index === 0 ? "none" : "1px solid #22222c",
        background: "transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#22222c"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 36,
          height: 36,
          background: data.needs_human ? "rgba(244,63,94,0.15)" : avatarColors[status] + "20",
          fontSize: 12,
          fontWeight: 700,
          color: data.needs_human ? "#f43f5e" : avatarColors[status],
          border: data.needs_human ? "1px solid rgba(244,63,94,0.3)" : "none",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>{name}</p>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            {cfg.label}
          </span>
          {data.needs_human && (
            <span className="pulse-dot rounded-full" style={{ width: 7, height: 7, background: "#f43f5e", display: "inline-block" }} />
          )}
        </div>
        <p className="truncate" style={{ fontSize: 13, color: "#64748b" }}>
          {data.message}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {data.typing && (
          <span style={{ fontSize: 11, color: "#64748b", background: "#22222c", padding: "2px 8px", borderRadius: 99 }}>
            Typing...
          </span>
        )}
        <span style={{ fontSize: 11, color: "#64748b" }}>{data.time}</span>
      </div>
    </div>
  );
}

function LiveChatRail({ open, onToggle, conversations }) {
  return (
    <div
      className="flex flex-col border-l"
      style={{
        width: open ? 280 : 48,
        background: "#0f0f14",
        borderColor: "#1a1a22",
        transition: "width 0.3s ease",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-b cursor-pointer"
        style={{ borderColor: "#1a1a22", background: "none", border: "none" }}
      >
        {open ? <ChevronRight size={18} style={{ color: "#64748b" }} /> : <ChevronLeft size={18} style={{ color: "#64748b" }} />}
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a1a22" }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, color: "#f8fafc", fontSize: 13 }}>
              Live Chats
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="pulse-dot rounded-full" style={{ width: 6, height: 6, background: "#10b981", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {conversations.filter((c) => c.status === "buying").length} buying
              </span>
            </div>
          </div>

          {conversations.slice(0, 6).map((c, i) => {
            const name = c.customers?.full_name || "Unknown";
            const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const status = c.needs_human ? "needs-human" : c.status;
            const dotColor = { buying: "#10b981", asking: "#f59e0b", "follow-up": "#6366f1", "needs-human": "#f43f5e" }[status] || "#64748b";

            return (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                style={{ borderTop: i === 0 ? "none" : "1px solid #1a1a22" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#18181f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div className="relative">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 32, height: 32, background: "#18181f", fontSize: 11, fontWeight: 700, color: "#64748b" }}
                  >
                    {initials}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
                    style={{ width: 10, height: 10, background: dotColor, borderColor: "#0f0f14" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate" style={{ fontSize: 12, fontWeight: 500, color: "#f8fafc" }}>{name}</p>
                  <p className="truncate" style={{ fontSize: 11, color: "#64748b" }}>{c.message?.slice(0, 25)}...</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!open && (
        <div className="flex flex-col items-center gap-3 py-4">
          {conversations.slice(0, 4).map((c) => {
            const name = c.customers?.full_name || "U";
            const initial = name[0]?.toUpperCase() || "U";
            const status = c.needs_human ? "needs-human" : c.status;
            const dotColor = { buying: "#10b981", asking: "#f59e0b", "follow-up": "#6366f1", "needs-human": "#f43f5e" }[status] || "#64748b";

            return (
              <div key={c.id} className="relative">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 32, height: 32, background: "#18181f", fontSize: 11, fontWeight: 700, color: "#64748b", border: "1px solid #2a2a35" }}
                  title={name}
                >
                  {initial}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
                  style={{ width: 8, height: 8, background: dotColor, borderColor: "#0f0f14" }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const [conversations, setConversations] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatRailOpen, setChatRailOpen] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [convsData, followupsData] = await Promise.all([
          apiGet("/conversations").catch(() => null),
          apiGet("/followups").catch(() => null),
        ]);
        if (!convsData || convsData.length === 0) setConversations(MOCK_OPPORTUNITIES);
        else setConversations(convsData);
        setFollowups(followupsData || []);
      } catch (err) {
        setError(err.message);
        setConversations(MOCK_OPPORTUNITIES);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const activeChats = conversations.filter((c) => c.status === "buying" || c.status === "asking").length;
  const humanHandoffs = conversations.filter((c) => c.needs_human).length;
  const pendingFollowups = followups.filter((f) => f.status === "pending").length || 92;
  const opportunities = conversations.filter((c) => c.status === "buying" || c.status === "asking" || c.status === "follow-up" || c.needs_human);

  return (
    <div className="fade-up flex h-full">
      <div className="flex-1 overflow-y-auto pr-4">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e" }}>
            Backend offline — showing demo data for layout preview.
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <MetricCard label="Active Chats" value={loading ? "..." : activeChats.toLocaleString()} icon={MessageSquare} color="#818cf8" subtext="Currently engaged with Betty" />
          <MetricCard label="Human Handoffs" value={loading ? "..." : humanHandoffs.toLocaleString()} icon={Users} color="#f43f5e" pulse={humanHandoffs > 0} subtext={humanHandoffs > 0 ? "Needs immediate attention" : "All clear"} />
          <MetricCard label="Pending Follow-ups" value={loading ? "..." : pendingFollowups.toLocaleString()} icon={Clock} color="#64748b" subtext="Auto-reminders queued" />
        </div>

        {/* New Opportunities List */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #22222c" }}>
            <div>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, color: "#f8fafc", fontSize: 15 }}>New Opportunities</p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{opportunities.length} conversations need attention</p>
            </div>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>No new opportunities</div>
          ) : (
            opportunities.map((c, i) => <OpportunityRow key={c.id} data={c} index={i} />)
          )}
        </div>
      </div>

      <LiveChatRail open={chatRailOpen} onToggle={() => setChatRailOpen(!chatRailOpen)} conversations={conversations} />
    </div>
  );
}