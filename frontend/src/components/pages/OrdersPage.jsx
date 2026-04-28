// src/components/pages/OrdersPage.jsx
import { useState, useEffect } from "react";
import { apiGet } from "../../lib/api";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ChevronRight, 
  Loader2, 
  TrendingUp,
  Clock,
  CheckCircle2
} from "lucide-react";

const CURRENCIES = {
  GHS: { symbol: "GH₵", rate: 1, name: "Ghana Cedi" },
  NGN: { symbol: "₦", rate: 92.5, name: "Nigerian Naira" },
};

const MOCK_ORDERS = [
  {
    id: "ord_a3f7b2c1",
    customers: { full_name: "John Smith", phone_number: "+233 24 111 2222" },
    items: [{ name: "Shea Butter 500ml" }, { name: "Coconut Oil 250ml" }],
    total_amount: 340.0,
    status: "pending",
    created_at: "2026-04-20T10:15:00Z",
  },
  {
    id: "ord_b8e9d4f2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 333 4444" },
    items: [{ name: "Black Soap 3-pack" }],
    total_amount: 120.0,
    status: "confirmed",
    created_at: "2026-04-20T09:30:00Z",
  },
  {
    id: "ord_c1d2e3f4",
    customers: { full_name: "Michael Brown", phone_number: "+233 20 555 6666" },
    items: [
      { name: "Hair Growth Oil" },
      { name: "Face Scrub" },
      { name: "Body Lotion" },
    ],
    total_amount: 580.0,
    status: "processing",
    created_at: "2026-04-19T16:45:00Z",
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
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("betty-currency") || "GHS",
  );
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

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);
  const total = filtered.reduce(
    (sum, o) => sum + (parseFloat(o.total_amount) || 0),
    0,
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="fade-up flex flex-col h-full bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto scrollbar-hide">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShoppingCart size={20} />
            </div>
            <p className="font-syne font-bold text-2xl text-slate-50 tracking-tight">
              Order Management
            </p>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Track and process customer orders in real-time.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/20">
            {Object.keys(CURRENCIES).map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                  currency === c
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[
          {
            label: "Active Orders",
            value: loading ? "..." : filtered.length,
            icon: ShoppingCart,
            color: "text-slate-50",
            sub: "Total volume",
          },
          {
            label: "Gross Revenue",
            value: loading ? "..." : formatCurrency(total, currency),
            icon: TrendingUp,
            color: "text-indigo-400",
            sub: "Selected filter",
          },
          {
            label: "Pending Fulfillment",
            value: loading ? "..." : pendingCount,
            icon: Clock,
            color: "text-amber-500",
            sub: "Action required",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-xl shadow-black/10 transition-all hover:bg-slate-800/40 hover:-translate-y-1 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-slate-800 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                <s.icon size={18} />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.label}</p>
            </div>
            <p className={`font-syne text-3xl font-bold ${s.color}`}>
              {s.value}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <p className="text-[11px] text-slate-500 font-medium">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === f.id
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  : "bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-auto focus-within:border-indigo-500/50 transition-all">
          <Search size={14} className="text-slate-600" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            className="bg-transparent border-none outline-none text-xs text-slate-50 w-full placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Responsive Table/Card Container */}
      <div className="rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-800 shadow-2xl shadow-black/40">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                {[
                  "Order ID",
                  "Customer Details",
                  "Items Purchased",
                  "Total Amount",
                  "Current Status",
                  "Timestamp",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 size={24} className="mx-auto text-indigo-500 animate-spin mb-3" />
                    <p className="text-xs text-slate-500 font-medium">Fetching orders from cloud...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-xs text-slate-500 font-medium italic">
                    No orders matching the selected filter were found.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const name = o.customers?.full_name || "Unknown";
                  const itemList = Array.isArray(o.items)
                    ? o.items.map((it) => it.name || it).join(", ")
                    : "N/A";
                  const date = new Date(o.created_at).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "short", year: "2-digit" },
                  );
                  const shortId = `#${o.id.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      key={o.id}
                      className="group transition-all hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="px-6 py-5 font-mono text-[11px] font-black text-indigo-400/80 group-hover:text-indigo-400 transition-colors">
                        {shortId}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-50 group-hover:text-indigo-400 transition-colors">{name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{o.customers?.phone_number}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-slate-400 truncate max-w-[200px] leading-relaxed">
                          {itemList}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-slate-50">
                          {formatCurrency(parseFloat(o.total_amount), currency)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-md border shadow-sm ${
                            o.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5" :
                            o.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5" :
                            o.status === "processing" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/5" :
                            o.status === "delivered" ? "bg-slate-800 text-slate-400 border-slate-700 shadow-slate-500/5" :
                            "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                        {date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 size={24} className="mx-auto text-indigo-500 animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 font-medium italic">
              No orders found.
            </div>
          ) : (
            filtered.map((o) => {
              const name = o.customers?.full_name || "Unknown";
              const date = new Date(o.created_at).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
              );
              const shortId = `#${o.id.slice(-6).toUpperCase()}`;

              return (
                <div key={o.id} className="p-5 active:bg-slate-800/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{shortId}</p>
                      <p className="text-sm font-bold text-slate-50">{name}</p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-md border shadow-sm ${
                        o.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        o.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        o.status === "processing" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        o.status === "delivered" ? "bg-slate-800 text-slate-400 border-slate-700" :
                        "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium mb-1">Items: {o.items?.length || 0}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-tighter">{date}</p>
                    </div>
                    <p className="text-sm font-black text-slate-50">
                      {formatCurrency(parseFloat(o.total_amount), currency)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
