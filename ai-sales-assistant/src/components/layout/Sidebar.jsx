// src/components/layout/Sidebar.jsx
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  RefreshCw,
  Settings,
  X,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "conversations", label: "Conversations", Icon: MessageSquare },
  { id: "orders", label: "Orders", Icon: ShoppingBag },
  { id: "followups", label: "Follow-ups", Icon: RefreshCw },
  { id: "settings", label: "Settings", Icon: Settings },
];

export default function Sidebar({
  activePage,
  onNavigate,
  open,
  onClose,
  onSignOut,
}) {
  return (
    <>
      {/* Mobile dark overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 flex flex-col
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "220px",
          background: "#111710",
          borderRight: "1px solid #1f2a1e",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid #1f2a1e" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 30, height: 30, background: "#22c55e" }}
            >
              <Zap size={14} style={{ color: "#000", fill: "#000" }} />
            </div>
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#fff",
              }}
            >
              BETTY
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden"
            style={{ color: "#4a6a44" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* AI Status Badge */}
        <div
          className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-lg"
          style={{ background: "#192018", border: "1px solid #243024" }}
        >
          <span
            className="pulse-dot rounded-full flex-shrink-0"
            style={{
              width: 7,
              height: 7,
              background: "#22c55e",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 500 }}>
            Betty is online
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 mt-2 space-y-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  border: active
                    ? "1px solid rgba(34,197,94,0.25)"
                    : "1px solid transparent",
                  background: active ? "rgba(34,197,94,0.10)" : "transparent",
                  color: active ? "#22c55e" : "#7a9a74",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "#192018";
                    e.currentTarget.style.color = "#e8f5e2";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#7a9a74";
                  }
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer — User info + Sign Out */}
        <div className="p-3" style={{ borderTop: "1px solid #1f2a1e" }}>
          {/* User Info */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                background: "#243024",
                fontSize: 11,
                fontWeight: 700,
                color: "#22c55e",
              }}
            >
              TL
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                Team Lead
              </p>
              <p style={{ fontSize: 11, color: "#4a6a44" }}>Admin</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="w-full rounded-lg py-1.5 transition-all"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              border: "1px solid #1f2a1e",
              color: "#4a6a44",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#1f2a1e";
              e.currentTarget.style.color = "#4a6a44";
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
