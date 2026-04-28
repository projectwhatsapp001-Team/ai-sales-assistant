// src/components/pages/AnalyticsPage.jsx
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
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-md">
      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-indigo-400 font-bold">
        {payload[0].value} orders
      </p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [ordersData, convsData] = await Promise.all([
          apiGet("/orders").catch(() => []),
          apiGet("/conversations").catch(() => []),
        ]);
        setOrders(ordersData);
        setConversations(convsData);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const total = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total_amount) || 0),
    0,
  );
  const conversionRate =
    conversations.length > 0
      ? Math.round((orders.length / conversations.length) * 100)
      : 0;

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

  const stats = [
    {
      label: "Total Conversations",
      value: loading ? "..." : conversations.length.toString(),
      change: "+12%",
      up: true,
    },
    {
      label: "Total Orders",
      value: loading ? "..." : orders.length.toString(),
      change: "+8%",
      up: true,
    },
    {
      label: "Conversion Rate",
      value: loading ? "..." : `${conversionRate}%`,
      change: "-2%",
      up: false,
    },
    {
      label: "Total Revenue",
      value: loading ? "..." : `GH₵ ${total.toFixed(2)}`,
      change: "+15%",
      up: true,
    },
  ];

  return (
    <div className="fade-up space-y-6">
      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-5 py-3.5">
        <p className="text-sm text-indigo-400 font-medium">
          Analytics & Performance
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Historical trends and business growth metrics. Live actions are tracked on the Overview page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 bg-slate-900 border border-slate-800 hover:bg-slate-800/50 transition-all duration-300 group shadow-sm"
          >
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 group-hover:text-slate-400">
              {s.label}
            </p>
            <p className="font-syne text-3xl font-bold text-slate-50 leading-none">
              {s.value}
            </p>
            <div
              className={`flex items-center gap-1.5 mt-4 text-[11px] font-semibold ${
                s.up ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              <div className={`p-1 rounded-full ${s.up ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </div>
              <span>{s.change}</span>
              <span className="text-slate-500 font-normal">this week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-sm">
        <div className="mb-8">
          <p className="font-syne font-bold text-slate-50 text-base">
            Orders This Week
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            Daily order volume trends
          </p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(99,102,241,0.05)", radius: 4 }}
              />
              <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell 
                    key={i} 
                    fill={entry.sales > 0 ? "#6366f1" : "#1e293b"} 
                    className="transition-all duration-300 hover:fill-indigo-400"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

