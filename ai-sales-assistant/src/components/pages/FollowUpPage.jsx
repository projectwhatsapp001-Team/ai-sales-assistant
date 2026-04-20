// src/components/pages/FollowUpPage.jsx
import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { apiGet } from "../../lib/api";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  sent: { label: "Sent", bg: "rgba(16,185,129,0.15)", color: "#10b981", border: "rgba(16,185,129,0.3)" },
  failed: { label: "Failed", bg: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "rgba(244,63,94,0.3)" },
};

const MOCK_FOLLOWUPS = [
  {
    id: "1",
    customers: { full_name: "John Smith", phone_number: "+233 24 123 4567" },
    type: "abandoned_cart",
    message: "Hi John, you left some items in your cart. Complete your order now!",
    scheduled_for: "2026-04-20T14:00:00Z",
    status: "pending",
  },
  {
    id: "2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 987 6543" },
    type: "payment_reminder",
    message: "Reminder: Your payment for order #A3F7B2C1 is still pending.",
    scheduled_for: "2026-04-20T16:00:00Z",
    status: "sent",
  },
  {
    id: "3",
    customers: { full_name: "Kemi Adeyemi", phone_number: "+233 20 456 7890" },
    type: "feedback_request",
    message: "How was your experience? We'd love your feedback!",
    scheduled_for: "2026-04-19T10:00:00Z",
    status: "failed",
  },
];

export default function FollowUpPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowups() {
      try {
        setLoading(true);
        const data = await apiGet("/followups").catch(() => null);
        if (!data || data.length === 0) setFollowups(MOCK_FOLLOWUPS);
        else setFollowups(data);
      } catch (err) {
        setFollowups(MOCK_FOLLOWUPS);
      } finally {
        setLoading(false);
      }
    }
    fetchFollowups();
  }, []);

  const pendingCount = followups.filter((f) => f.status === "pending").length;
  const sentCount = followups.filter((f) => f.status === "sent").length;

  return (
    <div className="fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc" }}>Follow-ups</p>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{followups.length} total · {pendingCount} pending · {sentCount} sent</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: loading ? "..." : followups.length, color: "#f8fafc" },
          { label: "Pending", value: loading ? "..." : pendingCount, color: "#f59e0b" },
          { label: "Sent", value: loading ? "..." : sentCount, color: "#10b981" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl px-4 py-3" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
            <p style={{ fontSize: 11, color: "#64748b" }}>{s.label}</p>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
        {loading ? (
          <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>Loading follow-ups...</div>
        ) : followups.length === 0 ? (
          <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>No follow-ups scheduled</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a35" }}>
                  {["Customer", "Type", "Message", "Scheduled", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {followups.map((f, i) => {
                  const cfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.pending;
                  const name = f.customers?.full_name || "Unknown";
                  const date = new Date(f.scheduled_for).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr
                      key={f.id}
                      style={{ borderTop: i === 0 ? "none" : "1px solid #22222c", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#22222c"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 18px", color: "#f8fafc", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "12px 18px", color: "#94a3b8" }}>{f.type.replace("_", " ")}</td>
                      <td style={{ padding: "12px 18px", color: "#94a3b8", maxWidth: 300 }} className="truncate">{f.message}</td>
                      <td style={{ padding: "12px 18px", color: "#64748b", fontSize: 11 }}>{date}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <div className="flex gap-2">
                          <button style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><CheckCircle size={16} /></button>
                          <button style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer" }}><XCircle size={16} /></button>
                          <button style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer" }}><Send size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}