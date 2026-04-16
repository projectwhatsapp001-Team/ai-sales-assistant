import { stats, salesData, conversations } from "../../lib/mockData";
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

export default function OverviewPage() {
  return (
    <div className="fade-up space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-4 transition-all"
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
            <span
              className="rounded-full px-2 py-1"
              style={{
                fontSize: 11,
                color: "#22c55e",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              +8% vs last week
            </span>
          </div>

          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={salesData} barSize={26}>
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
                {salesData.map((_, i) => (
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

          <div className="divide-y" style={{ borderColor: "#1f2a1e" }}>
            {conversations.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
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
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>
                      {c.name}
                    </p>
                    <p
                      style={{ fontSize: 11, color: "#4a6a44", flexShrink: 0 }}
                    >
                      {c.time}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
