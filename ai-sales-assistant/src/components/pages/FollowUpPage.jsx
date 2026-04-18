// src/pages/FollowUpsPage.jsx
import { useState, useEffect } from "react";
import { Send, Clock, CheckCheck } from "lucide-react";
import { apiGet, apiPatch } from "../../lib/api";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    Icon: Clock,
    bg: "rgba(234,179,8,0.15)",
    color: "#facc15",
    border: "rgba(234,179,8,0.3)",
  },
  sent: {
    label: "Sent",
    Icon: Send,
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  replied: {
    label: "Replied",
    Icon: CheckCheck,
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  cancelled: {
    label: "Cancelled",
    Icon: Clock,
    bg: "rgba(239,68,68,0.15)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFollowups() {
      try {
        setLoading(true);
        const data = await apiGet("/followups");
        setFollowups(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFollowups();
  }, []);

  async function handleSendNow(id) {
    try {
      await apiPatch(`/followups/${id}/send`, {});
      setFollowups((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "sent" } : f)),
      );
    } catch (err) {
      alert("Failed to send follow-up: " + err.message);
    }
  }

  return (
    <div className="fade-up space-y-3">
      {/* Info Banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: "#192018",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        <span
          className="pulse-dot rounded-full flex-shrink-0"
          style={{
            width: 7,
            height: 7,
            background: "#22c55e",
            display: "inline-block",
          }}
        />
        <p style={{ fontSize: 13, color: "#7a9a74" }}>
          AI automatically sends follow-up messages to customers who did not
          complete their order.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Pending Follow-ups",
            count: followups.filter((f) => f.status === "pending").length,
            color: "#facc15",
          },
          {
            label: "Messages Sent",
            count: followups.filter((f) => f.status === "sent").length,
            color: "#60a5fa",
          },
          {
            label: "Got Replies",
            count: followups.filter((f) => f.status === "replied").length,
            color: "#22c55e",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl px-4 py-3"
            style={{ background: "#111710", border: "1px solid #1f2a1e" }}
          >
            <p style={{ fontSize: 11, color: "#4a6a44" }}>{s.label}</p>
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: loading ? "#4a6a44" : s.color,
                marginTop: 4,
              }}
            >
              {loading ? "..." : s.count}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#111710", border: "1px solid #1f2a1e" }}
      >
        <div
          className="px-5 py-3"
          style={{ borderBottom: "1px solid #1f2a1e" }}
        >
          <p
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 600,
              color: "#fff",
              fontSize: 14,
            }}
          >
            Abandoned Carts
          </p>
        </div>

        {loading ? (
          <div
            className="py-12 text-center"
            style={{ fontSize: 13, color: "#4a6a44" }}
          >
            Loading follow-ups...
          </div>
        ) : error ? (
          <div
            className="py-12 text-center"
            style={{ fontSize: 13, color: "#f87171" }}
          >
            Error: {error}
          </div>
        ) : followups.length === 0 ? (
          <div
            className="py-12 text-center"
            style={{ fontSize: 13, color: "#4a6a44" }}
          >
            No follow-ups yet
          </div>
        ) : (
          followups.map((f, i) => {
            const cfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.pending;
            const Icon = cfg.Icon;
            const name = f.customers?.full_name || "Unknown";
            const phone = f.customers?.phone_number || "";
            const item =
              f.orders?.items?.[0]?.name || f.message_preview || "Unknown item";
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);
            const time = new Date(f.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={f.id}
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderTop: i === 0 ? "none" : "1px solid #1f2a1e" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#192018";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    background: "#192018",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#22c55e",
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>
                    {name}
                  </p>
                  <p style={{ fontSize: 11, color: "#7a9a74", marginTop: 2 }}>
                    {item}
                  </p>
                  <p style={{ fontSize: 10, color: "#2a4a24", marginTop: 2 }}>
                    {phone} · {time}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className="flex items-center gap-1.5"
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    <Icon size={9} />
                    {cfg.label}
                  </span>
                  {f.status === "pending" && (
                    <button
                      onClick={() => handleSendNow(f.id)}
                      style={{
                        fontSize: 11,
                        color: "#22c55e",
                        fontWeight: 500,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#4ade80";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#22c55e";
                      }}
                    >
                      Send Now →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
