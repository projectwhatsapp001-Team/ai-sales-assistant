// src/components/layout/TopBar.jsx
import { Menu, Bell } from "lucide-react";

export default function TopBar({ page, onMenuClick }) {
  const titles = {
    overview: "Overview",
    conversations: "Conversations",
    orders: "Orders",
    followups: "Follow-ups",
    analytics: "Analytics",
    settings: "Settings",
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-3"
      style={{ borderBottom: "1px solid #1a1a22", background: "#07070a" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20, color: "#f8fafc" }}>
          {titles[page] || "Overview"}
        </h1>
      </div>
      <button
        className="relative"
        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
      >
        <Bell size={18} />
        <span
          className="absolute -top-1 -right-1 rounded-full"
          style={{ width: 8, height: 8, background: "#f43f5e", border: "2px solid #07070a" }}
        />
      </button>
    </header>
  );
}