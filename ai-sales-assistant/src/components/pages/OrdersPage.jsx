// src/components/pages/OrdersPage.jsx
import { useState, useEffect } from "react";
import { apiGet } from "../../lib/api";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  confirmed: { label: "Confirmed", bg: "rgba(16,185,129,0.15)", color: "#10b981", border: "rgba(16,185,129,0.3)" },
  processing: { label: "Processing", bg: "rgba(99,102,241,0.15)", color: "#818cf8", border: "rgba(99,102,241,0.3)" },
  delivered: { label: "Delivered", bg: "rgba(100,116,139,0.15)", color: "#64748b", border: "rgba(100,116,139,0.3)" },
  cancelled: { label: "Cancelled", bg: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "rgba(244,63,94,0.3)" },
};

const CURRENCIES = {
  GHS: { symbol: "GH₵", rate: 1, name: "Ghana Cedi" },
  NGN: { symbol: "₦", rate: 92.5, name: "Nigerian Naira" },
};

const MOCK_ORDERS = [
  {
    id: "ord_a3f7b2c1",
    customers: { full_name: "John Smith", phone_number: "+233 24 111 2222" },
    items: [{ name: "Shea Butter 500ml" }, { name: "Coconut Oil 250ml" }],
    total_amount: 340.00,
    status: "pending",
    created_at: "2026-04-20T10:15:00Z",
  },
  {
    id: "ord_b8e9d4f2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 333 4444" },
    items: [{ name: "Black Soap 3-pack" }],
    total_amount: 120.00,
    status: "confirmed",
    created_at: "2026-04-20T09:30:00Z",
  },
  {
    id: "ord_c1d2e3f4",
    customers: { full_name: "Michael Brown", phone_number: "+233 20 555 6666" },
    items: [{ name: "Hair Growth Oil" }, { name: "Face Scrub" }, { name: "Body Lotion" }],
    total_amount: 580.00,
    status: "processing",
    created_at: "2026-04-19T16:45:00Z",
  },
  {
    id: "ord_d5e6f7g8",
    customers: { full_name: "Sarah Williams", phone_number: "+233 27 777 8888" },
    items: [{ name: "Premium Package" }],
    total_amount: 450.00,
    status: "delivered",
    created_at: "2026-04-18T11:20:00Z",
  },
  {
    id: "ord_e9f0g1h2",
    customers: { full_name: "David Miller", phone_number: "+233 55 999 0000" },
    items: [{ name: "Shea Butter 1L" }],
    total_amount: 200.00,
    status: "cancelled",
    created_at: "2026-04-17T14:10:00Z",
  },
];

function formatCurrency(amount, currency) {
  const c = CURRENCIES[currency];
  const converted = amount * c.rate;
  return `${c.symbol} ${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState(() => localStorage.getItem("betty-currency") || "GHS");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await apiGet("/orders").catch(() => null);
        if (!data || data.length === 0) setOrders(MOCK_ORDERS);
        else setOrders(data);
      } catch (err) {
        setError(err.message);
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem("betty-currency", newCurrency);
  };

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const total = filtered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="fade-up space-y-4">
      {/* Header + Currency Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc" }}>Orders</p>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{orders.length} total · {pendingCount} pending</p>
        </div>
        <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
          {Object.keys(CURRENCIES).map((c) => (
            <button
              key={c}
              onClick={() => handleCurrencyChange(c)}
              className="px-3 py-1.5 text-sm font-medium transition-all cursor-pointer"
              style={{
                background: currency === c ? "rgba(99,102,241,0.15)" : "transparent",
                color: currency === c ? "#818cf8" : "#64748b",
                border: "none",
                borderRight: c === "GHS" ? "1px solid #2a2a35" : "none",
              }}
            >
              {CURRENCIES[c].symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orders", value: loading ? "..." : filtered.length, color: "#f8fafc" },
          { label: "Total Revenue", value: loading ? "..." : formatCurrency(total, currency), color: "#818cf8" },
          { label: "Pending", value: loading ? "..." : pendingCount, color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl px-4 py-3" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
            <p style={{ fontSize: 11, color: "#64748b" }}>{s.label}</p>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All Orders" },
          { id: "pending", label: "Pending" },
          { id: "confirmed", label: "Confirmed" },
          { id: "processing", label: "Processing" },
          { id: "delivered", label: "Delivered" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: statusFilter === f.id ? "rgba(99,102,241,0.10)" : "#18181f",
              color: statusFilter === f.id ? "#818cf8" : "#64748b",
              border: statusFilter === f.id ? "1px solid rgba(99,102,241,0.25)" : "1px solid #2a2a35",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
        {loading ? (
          <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>Loading orders...</div>
        ) : error ? (
          <div className="py-12 text-center" style={{ fontSize: 13, color: "#f43f5e" }}>Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>No orders found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a35" }}>
                  {["Order ID", "Customer", "Items", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  const name = o.customers?.full_name || "Unknown";
                  const itemList = Array.isArray(o.items) ? o.items.map((it) => it.name || it).join(", ") : "N/A";
                  const date = new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
                  const shortId = `#${o.id.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      key={o.id}
                      style={{ borderTop: i === 0 ? "none" : "1px solid #22222c", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#22222c"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", fontSize: 12, color: "#818cf8" }}>{shortId}</td>
                      <td style={{ padding: "12px 18px", color: "#f8fafc", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "12px 18px", color: "#94a3b8" }}>{itemList}</td>
                      <td style={{ padding: "12px 18px", color: "#f8fafc", fontWeight: 600 }}>{formatCurrency(parseFloat(o.total_amount), currency)}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px", color: "#64748b", fontSize: 11 }}>{date}</td>
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