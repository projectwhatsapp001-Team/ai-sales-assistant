// src/pages/OrdersPage.jsx
import { useState, useEffect } from "react";
import { apiGet, apiPut } from "../../lib/api";

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
  processing: {
    label: "Processing",
    bg: "rgba(251,146,60,0.15)",
    color: "#fb923c",
    border: "rgba(251,146,60,0.3)",
  },
  delivered: {
    label: "Delivered",
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  cancelled: {
    label: "Cancelled",
    bg: "rgba(239,68,68,0.15)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await apiGet("/orders");
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const total = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total_amount) || 0),
    0,
  );

  return (
    <div className="fade-up space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Orders",
            value: loading ? "..." : orders.length,
            color: "#fff",
          },
          {
            label: "Total Revenue",
            value: loading ? "..." : `GH₵ ${total.toFixed(2)}`,
            color: "#22c55e",
          },
          {
            label: "Pending Orders",
            value: loading
              ? "..."
              : orders.filter((o) => o.status === "pending").length,
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

      {/* Table */}
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

        {loading ? (
          <div
            className="py-12 text-center"
            style={{ fontSize: 13, color: "#4a6a44" }}
          >
            Loading orders...
          </div>
        ) : error ? (
          <div
            className="py-12 text-center"
            style={{ fontSize: 13, color: "#f87171" }}
          >
            Error: {error}
          </div>
        ) : orders.length === 0 ? (
          <div
            className="py-12 text-center"
            style={{ fontSize: 13, color: "#4a6a44" }}
          >
            No orders yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #1f2a1e" }}>
                  {[
                    "Order ID",
                    "Customer",
                    "Items",
                    "Amount",
                    "Status",
                    "Date",
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
                {orders.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  const name = o.customers?.full_name || "Unknown";
                  const itemList = Array.isArray(o.items)
                    ? o.items.map((it) => it.name || it).join(", ")
                    : "N/A";
                  const date = new Date(o.created_at).toLocaleDateString();
                  const shortId = `#${o.id.slice(0, 8).toUpperCase()}`;

                  return (
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
                        {shortId}
                      </td>
                      <td
                        style={{
                          padding: "12px 18px",
                          color: "#fff",
                          fontWeight: 500,
                        }}
                      >
                        {name}
                      </td>
                      <td style={{ padding: "12px 18px", color: "#7a9a74" }}>
                        {itemList}
                      </td>
                      <td
                        style={{
                          padding: "12px 18px",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        GH₵ {parseFloat(o.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <span
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
                          {cfg.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 18px",
                          color: "#4a6a44",
                          fontSize: 11,
                        }}
                      >
                        {date}
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
