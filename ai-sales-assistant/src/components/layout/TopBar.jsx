import { Menu, Bell, Search } from "lucide-react";

const PAGE_TITLES = {
  overview: "Overview",
  conversations: "Conversations",
  orders: "Orders",
  followups: "Follow-ups",
};

export default function TopBar({ page, onMenuClick }) {
  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: 52,
        background: "#0a0f0d",
        borderBottom: "1px solid #1f2a1e",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden"
          style={{ color: "#4a6a44" }}
        >
          <Menu size={20} />
        </button>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 600,
            fontSize: 16,
            color: "#fff",
          }}
        >
          {PAGE_TITLES[page] || "Dashboard"}
        </h1>
      </div>

      {/* Right: search + bell */}
      <div className="flex items-center gap-2">
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#111710", border: "1px solid #1f2a1e" }}
        >
          <Search size={13} style={{ color: "#4a6a44" }} />
          <input
            type="text"
            placeholder="Search..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "#e8f5e2",
              width: 130,
            }}
          />
        </div>

        <div
          className="relative flex items-center justify-center rounded-lg cursor-pointer"
          style={{
            width: 30,
            height: 30,
            background: "#111710",
            border: "1px solid #1f2a1e",
          }}
        >
          <Bell size={14} style={{ color: "#4a6a44" }} />
          <span
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "#22c55e",
              top: 5,
              right: 5,
            }}
          />
        </div>
      </div>
    </header>
  );
}
