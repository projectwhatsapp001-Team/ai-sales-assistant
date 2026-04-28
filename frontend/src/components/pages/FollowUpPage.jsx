// frontend/src/components/pages/FollowUpPage.jsx
import { useState, useEffect } from "react";
import { 
  Clock, 
  ChevronRight, 
  Calendar, 
  MessageSquare, 
  Filter, 
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { apiGet } from "../../lib/api";

const MOCK_FOLLOWUPS = [
  {
    id: "flw_1",
    customers: { full_name: "John Smith", phone_number: "+233 24 111 2222" },
    scheduled_for: "2026-04-21T10:00:00Z",
    message_type: "Remind to order",
    status: "pending",
  },
  {
    id: "flw_2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 333 4444" },
    scheduled_for: "2026-04-21T14:30:00Z",
    message_type: "Check satisfaction",
    status: "sent",
  },
];

export default function FollowUpPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchFollowups() {
      try {
        setLoading(true);
        const data = await apiGet("/followups").catch(() => null);
        if (!data || data.length === 0) setFollowups(MOCK_FOLLOWUPS);
        else setFollowups(data);
      } catch (err) {
        setError(err.message);
        setFollowups(MOCK_FOLLOWUPS);
      } finally {
        setLoading(false);
      }
    }
    fetchFollowups();
  }, []);

  const filtered =
    statusFilter === "all"
      ? followups
      : followups.filter((f) => f.status === statusFilter);

  const pendingCount = followups.filter((f) => f.status === "pending").length;

  return (
    <div className="fade-up flex flex-col h-full bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto scrollbar-hide">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock size={20} />
            </div>
            <p className="font-syne font-bold text-2xl text-slate-50 tracking-tight">
              Follow-up Automation
            </p>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Manage automated reminders and customer re-engagement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <p className="text-xs font-bold text-slate-300">Queue Active</p>
          </div>
        </div>
      </div>

      {/* Stats Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Tasks", value: followups.length, icon: Calendar, color: "text-slate-50" },
          { label: "Pending Now", value: pendingCount, icon: Clock, color: "text-amber-500" },
          { label: "Sent Today", value: followups.filter(f => f.status === 'sent').length, icon: CheckCircle2, color: "text-emerald-500" }
        ].map((s, i) => (
          <div key={i} className="rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-lg hover:bg-slate-800/40 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <s.icon size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{s.label}</p>
            </div>
            <p className={`font-syne text-3xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["all", "pending", "sent", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs font-bold transition-all border capitalize ${
                statusFilter === f
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  : "bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-64 focus-within:border-indigo-500/50 transition-all">
          <Search size={14} className="text-slate-600" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="bg-transparent border-none outline-none text-xs text-slate-50 w-full placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Responsive Tasks Container */}
      <div className="rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-800 shadow-2xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <th className="px-6 py-5 text-left">Task Reference</th>
                <th className="px-6 py-5 text-left">Recipient</th>
                <th className="px-6 py-5 text-left">Type</th>
                <th className="px-6 py-5 text-left">Scheduled</th>
                <th className="px-6 py-5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <Loader2 size={24} className="mx-auto text-indigo-500 animate-spin mb-3" />
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Accessing schedule...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-xs text-slate-500 font-medium">
                    No follow-up tasks currently in queue.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const name = f.customers?.full_name || "Unknown";
                  const date = new Date(f.scheduled_for).toLocaleString("en-GB", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  });
                  const shortId = `#${f.id.slice(-6).toUpperCase()}`;

                  return (
                    <tr key={f.id} className="group hover:bg-slate-800/40 transition-colors cursor-pointer">
                      <td className="px-6 py-5 font-mono text-[11px] font-bold text-indigo-400/70 group-hover:text-indigo-400 transition-colors">{shortId}</td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-50">{name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{f.customers?.phone_number}</p>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-400 font-medium">{f.message_type}</td>
                      <td className="px-6 py-5 text-[11px] text-slate-500 font-bold uppercase tracking-tighter">{date}</td>
                      <td className="px-6 py-5">
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-md border ${
                          f.status === "sent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          f.status === "cancelled" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          {f.status}
                        </span>
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
              <p className="text-xs text-slate-500 font-medium">Loading schedule...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 font-medium">
              No tasks found.
            </div>
          ) : (
            filtered.map((f) => {
              const name = f.customers?.full_name || "Unknown";
              const date = new Date(f.scheduled_for).toLocaleString("en-GB", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              });
              const shortId = `#${f.id.slice(-6).toUpperCase()}`;

              return (
                <div key={f.id} className="p-5 active:bg-slate-800/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{shortId}</p>
                      <p className="text-sm font-bold text-slate-50">{name}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-md border ${
                      f.status === "sent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      f.status === "cancelled" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-1">{f.message_type}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{date}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-700" />
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
