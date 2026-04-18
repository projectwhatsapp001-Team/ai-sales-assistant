// src/pages/OverviewPage.jsx
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { apiGet } from "../../lib/api";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#192018",
        border: "1px solid #243024",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
      }}
    >
      <p style={{ color: "#4a6a44" }}>{label}</p>
      <p style={{ color: "#22c55e", fontWeight: 700 }}>
        {payload[0].value} orders
      </p>
    </div>
  );
}

// Fallback stats if API not ready yet
const FALLBACK_STATS = [
  { label: "Total Conversations", value: "—", change: "—", up: true },
  { label: "Orders Logged", value: "—", change: "—", up: true },
  { label: "Follow-ups Sent", value: "—", change: "—", up: true },
  { label: "Conversion Rate", value: "—", change: "—", up: false },
];

const FALLBACK_CHART = [
  { day: "Mon", sales: 0 },
  { day: "Tue", sales: 0 },
  { day: "Wed", sales: 0 },
  { day: "Thu", sales: 0 },
  { day: "Fri", sales: 0 },
  { day: "Sat", sales: 0 },
  { day: "Sun", sales: 0 },
];

export default function OverviewPage() {
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [ordersData, convsData, followupsData] = await Promise.all([
          apiGet("/orders"),
          apiGet("/conversations"),
          apiGet("/followups"),
        ]);
        setOrders(ordersData);
        setConversations(convsData);
        setFollowups(followupsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Build stats from real data
  const stats = [
    {
      label: "Total Conversations",
      value: loading ? "..." : conversations.length.toString(),
      change: "+12%",
      up: true,
    },
    {
      label: "Orders Logged",
      value: loading ? "..." : orders.length.toString(),
      change: "+8%",
      up: true,
    },
    {
      label: "Follow-ups Sent",
      value: loading
        ? "..."
        : followups.filter((f) => f.status === "sent").length.toString(),
      change: "+23%",
      up: true,
    },
    {
      label: "Conversion Rate",
      value: loading
        ? "..."
        : conversations.length > 0
          ? `${Math.round((orders.length / conversations.length) * 100)}%`
          : "0%",
      change: "-2%",
      up: false,
    },
  ];

  // Build chart data — orders grouped by day of week
  const chartData = loading
    ? FALLBACK_CHART
    : (() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const counts = {
          Sun: 0,
          Mon: 0,
          Tue: 0,
          Wed: 0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
        };
        orders.forEach((o) => {
          const day = days[new Date(o.created_at).getDay()];
          counts[day]++;
        });
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
          day,
          sales: counts[day],
        }));
      })();

  const liveChats = conversations.slice(0, 4);

  return (
    <div className="fade-up space-y-4">
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          Could not load data: {error}. Showing fallback display.
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-4"
            style={{ background: "#111710", border: "1px solid #1f2a1e" }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#4a6a44",
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {s.value}
            </p>
            <div
              className="flex items-center gap-1 mt-1"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: s.up ? "#22c55e" : "#f87171",
              }}
            >
              {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {s.change} this week
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Live Chats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div
          className="lg:col-span-3 rounded-xl p-5"
          style={{ background: "#111710", border: "1px solid #1f2a1e" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 600,
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                Orders This Week
              </p>
              <p style={{ fontSize: 11, color: "#4a6a44", marginTop: 2 }}>
                Daily order volume
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} barSize={26}>
              <XAxis
                dataKey="day"
                tick={{ fill: "#4a6a44", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#4a6a44", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(34,197,94,0.05)" }}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 5 ? "#22c55e" : "#1f2a1e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="lg:col-span-2 rounded-xl"
          style={{ background: "#111710", border: "1px solid #1f2a1e" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
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
              Live Chats
            </p>
            <span
              className="flex items-center gap-1.5"
              style={{ fontSize: 11, color: "#22c55e" }}
            >
              <span
                className="pulse-dot rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              {conversations.filter((c) => c.status === "buying").length} buying
            </span>
          </div>

          {loading ? (
            <div
              className="px-4 py-8 text-center"
              style={{ fontSize: 12, color: "#4a6a44" }}
            >
              Loading conversations...
            </div>
          ) : liveChats.length === 0 ? (
            <div
              className="px-4 py-8 text-center"
              style={{ fontSize: 12, color: "#4a6a44" }}
            >
              No conversations yet
            </div>
          ) : (
            <div>
              {liveChats.map((c, i) => {
                const name = c.customers?.full_name || "Unknown";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);
                return (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid #1f2a1e",
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        background: "#192018",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#22c55e",
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#fff",
                          }}
                        >
                          {name}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#4a6a44",
                            flexShrink: 0,
                          }}
                        >
                          {new Date(c.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p
                        style={{ fontSize: 11, color: "#4a6a44", marginTop: 2 }}
                        className="truncate"
                      >
                        {c.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
