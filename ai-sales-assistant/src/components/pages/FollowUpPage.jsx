import { Send, Clock, CheckCheck } from "lucide-react";
import { followups } from "../../lib/mockData";

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
};

export default function FollowUpsPage() {
  return (
    <div className="fade-up space-y-3">
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
                color: s.color,
                marginTop: 4,
              }}
            >
              {s.count}
            </p>
          </div>
        ))}
      </div>

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

        <div>
          {followups.map((f, i) => {
            const cfg = STATUS_CONFIG[f.status];
            const Icon = cfg.Icon;
            const initials = f.customer
              .split(" ")
              .map((n) => n[0])
              .join("");

            return (
              <div
                key={f.id}
                className="flex items-center gap-3 px-5 py-4 transition-colors"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid #1f2a1e",
                  background: "transparent",
                }}
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
                    {f.customer}
                  </p>
                  <p style={{ fontSize: 11, color: "#7a9a74", marginTop: 2 }}>
                    {f.item}
                  </p>
                  <p style={{ fontSize: 10, color: "#2a4a24", marginTop: 2 }}>
                    {f.phone} · abandoned {f.abandoned}
                  </p>
                </div>

                {/* Status + Action */}
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
          })}
        </div>
      </div>
    </div>
  );
}
