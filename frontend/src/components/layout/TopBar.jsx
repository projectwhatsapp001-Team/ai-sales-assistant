// src/components/layout/TopBar.jsx
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  Bell,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const TITLES = {
  overview: "Performance Overview",
  conversations: "Customer Conversations",
  orders: "Order Management",
  followups: "Follow-up Automation",
  analytics: "Business Analytics",
  settings: "Account Settings",
  billing: "Billing & Subscription",
};

const NOTIF_CONFIG = {
  handoff: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  order: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  followup: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
};

export default function TopBar({ page, onMenuClick, onNavigate, profileId }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!profileId) return;

    supabase
      .from("conversations")
      .select("id, message, created_at, needs_human, status, customers(full_name)")
      .eq("profile_id", profileId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        const mapped = data.map((row) => ({
          id: row.id,
          type: row.needs_human ? "handoff" : "order",
          title: row.needs_human ? "Human handoff needed" : "New message received",
          body: row.customers?.full_name
            ? `${row.customers.full_name}: ${(row.message || "").slice(0, 60)}`
            : (row.message || "").slice(0, 70),
          time: formatTimeAgo(row.created_at),
          read: false,
        }));
        setNotifications(mapped);
      });

    const channel = supabase
      .channel(`topbar-notifs-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          const row = payload.new;
          const newNotif = {
            id: row.id + "-" + Date.now(),
            type: row.needs_human ? "handoff" : "order",
            title: row.needs_human ? "⚠️ Human handoff needed" : "New message",
            body: (row.message || "").slice(0, 70),
            time: "just now",
            read: false,
          };
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profileId]);

  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  
  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  function handleNotifClick(notif) {
    markRead(notif.id);
    setNotifOpen(false);
    if (onNavigate) onNavigate("conversations");
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-syne font-bold text-lg sm:text-xl text-slate-50 tracking-tight">
          {TITLES[page] || "Overview"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center group">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-500 ${
            searchOpen ? "w-64 bg-slate-900 border-indigo-500/50" : "w-10 bg-transparent border-transparent"
          } border`}>
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-slate-500 hover:text-indigo-400 transition-colors"
            >
              <Search size={18} />
            </button>
            <input
              ref={searchRef}
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs text-slate-50 w-full placeholder:text-slate-600 transition-opacity duration-300 ${searchOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            />
            {searchOpen && (
              <button onClick={() => {setSearchOpen(false); setSearchQuery("");}} className="text-slate-600 hover:text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`p-2.5 rounded-2xl transition-all relative ${
              notifOpen ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 items-center justify-center text-[9px] font-black text-white border-2 border-slate-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-4 w-80 sm:w-96 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shadow-black z-50 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 bg-slate-900/80">
                <p className="text-sm font-bold text-slate-50">Notifications</p>
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Mark All Read
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide divide-y divide-slate-800/40">
                {notifications.length === 0 ? (
                  <div className="py-16 text-center">
                    <Bell size={32} className="mx-auto text-slate-800 mb-4 opacity-50" />
                    <p className="text-xs text-slate-500 font-medium">No new activity to report.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.order;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`group flex items-start gap-4 px-6 py-5 cursor-pointer transition-all ${
                          notif.read ? "bg-transparent opacity-60" : "bg-indigo-500/5 hover:bg-indigo-500/10"
                        }`}
                      >
                        <div className={`flex items-center justify-center rounded-xl flex-shrink-0 w-10 h-10 border border-slate-800 shadow-inner transition-colors ${cfg.bg}`}>
                          <Icon size={16} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={`text-[13px] font-bold truncate ${notif.read ? "text-slate-400" : "text-slate-50"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {notif.body}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock size={10} className="text-slate-600" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-600">
                              {notif.time}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-500 transition-colors self-center" />
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="p-4 border-t border-slate-800/50 bg-slate-900/80">
                <button 
                  onClick={() => {setNotifOpen(false); onNavigate("conversations");}}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-slate-200 transition-all border border-slate-800/50"
                >
                  View Activity Center
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
