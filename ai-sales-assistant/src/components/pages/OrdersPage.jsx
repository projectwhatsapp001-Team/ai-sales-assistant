import { orders } from "../../lib/mockData";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "rgba(234,179,8,0.15)",
    color: "#facc15",
    border: "rgba(234,179,8,0.3)",
  },
  confirmed: {
    label: "Confirmed",
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  delivered: {
    label: "Delivered",
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 99,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function OrdersPage() {
  const total = orders.reduce((sum, o) => {
    const n = parseFloat(o.amount.replace(/[^\d.]/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="fade-up space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orders", value: orders.length, color: "#fff" },
          { label: "Total Revenue", value: `GH₵ ${total}`, color: "#22c55e" },
          {
            label: "Pending Orders",
            value: orders.filter((o) => o.status === "pending").length,
            color: "#facc15",
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
                fontSize: 22,
                fontWeight: 700,
                color: s.color,
                marginTop: 4,
              }}
            >
              {s.value}
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
            All Orders
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #1f2a1e" }}>
                {[
                  "Order ID",
                  "Customer",
                  "Item",
                  "Amount",
                  "Status",
                  "Time",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 18px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#4a6a44",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr
                  key={o.id}
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid #1f2a1e",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#192018";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td
                    style={{
                      padding: "12px 18px",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#22c55e",
                    }}
                  >
                    {o.id}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      color: "#fff",
                      fontWeight: 500,
                    }}
                  >
                    {o.customer}
                  </td>
                  <td style={{ padding: "12px 18px", color: "#7a9a74" }}>
                    {o.item}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    {o.amount}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      color: "#4a6a44",
                      fontSize: 11,
                    }}
                  >
                    {o.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
