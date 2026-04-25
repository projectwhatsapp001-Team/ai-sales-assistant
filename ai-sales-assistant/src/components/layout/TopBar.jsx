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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const TITLES = {
  overview: "Overview",
  conversations: "Conversations",
  orders: "Orders",
  followups: "Follow-ups",
  analytics: "Analytics",
  settings: "Settings",
  billing: "Billing",
};

const NOTIF_ICONS = {
  handoff: { icon: AlertCircle, color: "#f43f5e" },
  order: { icon: CheckCircle, color: "#10b981" },
  followup: { icon: Clock, color: "#f59e0b" },
};

export default function TopBar({ page, onMenuClick, onNavigate, profileId }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Supabase Realtime — listen for new conversations ───────
  useEffect(() => {
    if (!profileId) return;

    // Load initial unread notifications
    supabase
      .from("conversations")
      .select(
        "id, message, created_at, needs_human, status, customers(full_name)",
      )
      .eq("profile_id", profileId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        const mapped = data.map((row) => ({
          id: row.id,
          type: row.needs_human ? "handoff" : "order",
          title: row.needs_human
            ? "Human handoff needed"
            : "New message received",
          body: row.customers?.full_name
            ? `${row.customers.full_name}: ${(row.message || "").slice(0, 60)}`
            : (row.message || "").slice(0, 70),
          time: formatTimeAgo(row.created_at),
          read: false,
        }));
        setNotifications(mapped);
      });

    // Realtime subscription — new conversations inserted
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

  // ── Close panel on outside click ───────────────────────────
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
    if (onNavigate) {
      onNavigate(notif.type === "handoff" ? "conversations" : "conversations");
    }
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-3 relative"
      style={{
        borderBottom: "1px solid #1a1a22",
        background: "#07070a",
        zIndex: 30,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          <Menu size={20} />
        </button>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "#f8fafc",
          }}
        >
          {TITLES[page] || "Overview"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {searchOpen ? (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: "#18181f",
              border: "1px solid #2a2a35",
              minWidth: 220,
            }}
          >
            <Search size={14} style={{ color: "#64748b", flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search conversations, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#f8fafc",
                width: "100%",
              }}
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <Search size={17} />
          </button>
        )}

        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative"
            style={{
              background: "none",
              border: "none",
              color: notifOpen ? "#818cf8" : "#64748b",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  background: "#f43f5e",
                  border: "2px solid #07070a",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-10 rounded-xl overflow-hidden"
              style={{
                width: 340,
                background: "#0f0f14",
                border: "1px solid #2a2a35",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                zIndex: 100,
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid #1a1a22" }}
              >
                <div className="flex items-center gap-2">
                  <p
                    style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}
                  >
                    Notifications
                  </p>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: "#f43f5e",
                        color: "#fff",
                        padding: "1px 6px",
                        borderRadius: 99,
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      fontSize: 11,
                      color: "#818cf8",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div
                    className="py-10 text-center"
                    style={{ fontSize: 13, color: "#64748b" }}
                  >
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif, i) => {
                    const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.order;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                        style={{
                          borderTop: i === 0 ? "none" : "1px solid #1a1a22",
                          background: notif.read
                            ? "transparent"
                            : "rgba(99,102,241,0.05)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#18181f";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = notif.read
                            ? "transparent"
                            : "rgba(99,102,241,0.05)";
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                          style={{
                            width: 32,
                            height: 32,
                            background: cfg.color + "20",
                          }}
                        >
                          <Icon size={15} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: notif.read ? 500 : 600,
                                color: notif.read ? "#94a3b8" : "#f8fafc",
                              }}
                            >
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span
                                className="rounded-full flex-shrink-0"
                                style={{
                                  width: 6,
                                  height: 6,
                                  background: "#6366f1",
                                  display: "inline-block",
                                }}
                              />
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            {notif.body}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: "#475569",
                              marginTop: 4,
                            }}
                          >
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
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
