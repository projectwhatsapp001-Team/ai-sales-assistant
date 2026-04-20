// src/components/pages/AnalyticsPage.jsx
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { apiGet } from "../../lib/api";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181f", border: "1px solid #2a2a35", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
      <p style={{ color: "#64748b" }}>{label}</p>
      <p style={{ color: "#818cf8", fontWeight: 700 }}>{payload[0].value} orders</p>
    </div>
  );
}

const FALLBACK_CHART = [
  { day: "Mon", sales: 0 },
  { day: "Tue", sales: 0 },
  { day: "Wed", sales: 0 },
  { day: "Thu", sales: 0 },
  { day: "Fri", sales: 0 },
  { day: "Sat", sales: 0 },
  { day: "Sun", sales: 0 },
];

export default function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [ordersData, convsData, followupsData] = await Promise.all([
          apiGet("/orders").catch(() => []),
          apiGet("/conversations").catch(() => []),
          apiGet("/followups").catch(() => []),
        ]);
        setOrders(ordersData);
        setConversations(convsData);
        setFollowups(followupsData);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const total = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const conversionRate = conversations.length > 0 ? Math.round((orders.length / conversations.length) * 100) : 0;

  const chartData = loading ? FALLBACK_CHART : (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    orders.forEach((o) => { const day = days[new Date(o.created_at).getDay()]; counts[day]++; });
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, sales: counts[day] }));
  })();

  const stats = [
    { label: "Total Conversations", value: loading ? "..." : conversations.length.toString(), change: "+12%", up: true },
    { label: "Total Orders", value: loading ? "..." : orders.length.toString(), change: "+8%", up: true },
    { label: "Conversion Rate", value: loading ? "..." : `${conversionRate}%`, change: "-2%", up: false },
    { label: "Total Revenue", value: loading ? "..." : `GH₵ ${total.toFixed(2)}`, change: "+15%", up: true },
  ];

  return (
    <div className="fade-up space-y-4">
      <div className="mb-4 px-4 py-3 rounded-lg" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
        <p style={{ fontSize: 13, color: "#818cf8" }}>Analytics — historical data and performance metrics. The Overview page shows live action items.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
            <p style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>{s.value}</p>
            <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11, fontWeight: 500, color: s.up ? "#10b981" : "#f43f5e" }}>
              {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {s.change} this week
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-5" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
        <div className="mb-5">
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, color: "#f8fafc", fontSize: 14 }}>Orders This Week</p>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Daily order volume</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} barSize={26}>
            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
            <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={i === 5 ? "#6366f1" : "#2a2a35"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}