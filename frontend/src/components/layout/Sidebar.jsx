// src/components/layout/Sidebar.jsx
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Clock,
  BarChart3,
  Settings,
  Zap,
  X,
  Bot,
  CreditCard,
} from "lucide-react";

export default function Sidebar({
  activePage,
  onNavigate,
  open,
  onClose,
  onSignOut,
  businessName,
  userInitials,
  badges = {},
  trialExpired,
}) {
  const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "conversations",
      label: "Conversations",
      icon: MessageSquare,
      badge: badges.conversations,
    },
    { id: "orders", label: "Orders", icon: ShoppingCart, badge: badges.orders },
    {
      id: "followups",
      label: "Follow-ups",
      icon: Clock,
      badge: badges.followups,
    },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: 240,
          background: "#0f0f14",
          borderRight: "1px solid #1a1a22",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid #1a1a22" }}
        >
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "#6366f1" }}
          >
            <Bot size={18} style={{ color: "#fff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: "#f8fafc",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {businessName || "SalesBot"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: trialExpired ? "#f43f5e" : "#64748b",
              }}
            >
              {trialExpired ? "Trial expired" : "Betty is online"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden"
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Betty AI Button */}
        <div className="px-3 py-3">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
            style={{
              background: "rgba(99,102,241,0.1)",
              color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.2)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Zap size={16} />
            <span>Betty</span>
            <span
              className="ml-auto flex items-center justify-center rounded-md"
              style={{
                width: 22,
                height: 18,
                background: "#6366f1",
                fontSize: 9,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              AI
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            const isLocked = trialExpired && item.id !== "billing";
            const Icon = item.icon;
            const isBilling = item.id === "billing";

            return (
              <button
                key={item.id}
                onClick={() => !isLocked && onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                style={{
                  background: isActive ? "#18181f" : "transparent",
                  color: isLocked
                    ? "#3a3a45"
                    : isActive
                      ? isBilling
                        ? "#f59e0b"
                        : "#818cf8"
                      : isBilling
                        ? "#f59e0b"
                        : "#64748b",
                  border: isActive
                    ? "1px solid #2a2a35"
                    : "1px solid transparent",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isLocked) {
                    e.currentTarget.style.background = "#18181f";
                    e.currentTarget.style.color = isBilling
                      ? "#f59e0b"
                      : "#94a3b8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = isLocked
                      ? "#3a3a45"
                      : isBilling
                        ? "#f59e0b"
                        : "#64748b";
                  }
                }}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 20,
                      height: 20,
                      background: isActive ? "#6366f1" : "#2a2a35",
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? "#fff" : "#64748b",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {isBilling && trialExpired && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: "#f43f5e",
                      color: "#fff",
                      padding: "1px 5px",
                      borderRadius: 99,
                    }}
                  >
                    !
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid #1a1a22" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                background: "#18181f",
                fontSize: 11,
                fontWeight: 700,
                color: "#818cf8",
                border: "1px solid #2a2a35",
              }}
            >
              {userInitials || "TL"}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate"
                style={{ fontSize: 12, fontWeight: 500, color: "#f8fafc" }}
              >
                {businessName || "Admin"}
              </p>
              <p style={{ fontSize: 11, color: "#64748b" }}>Admin</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors"
            style={{
              fontSize: 12,
              color: "#64748b",
              background: "transparent",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f43f5e";
              e.currentTarget.style.background = "rgba(244,63,94,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
