import { useState } from "react";
import { Search } from "lucide-react";
import { conversations } from "../../lib/mockData";

const STATUS_CONFIG = {
  buying: {
    label: "Buying",
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  browsing: {
    label: "Browsing",
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  ordered: {
    label: "Ordered",
    bg: "rgba(168,85,247,0.15)",
    color: "#c084fc",
    border: "rgba(168,85,247,0.3)",
  },
  abandoned: {
    label: "Abandoned",
    bg: "rgba(239,68,68,0.15)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

const FILTERS = ["all", "buying", "browsing", "ordered", "abandoned"];

export default function ConversationsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const matchStatus = filter === "all" || c.status === filter;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.message.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="fade-up space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
          style={{ background: "#111710", border: "1px solid #1f2a1e" }}
        >
          <Search size={13} style={{ color: "#4a6a44" }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "#e8f5e2",
              width: "100%",
            }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="capitalize rounded-lg px-3 py-1.5 transition-all"
              style={{
                fontSize: 12,
                fontWeight: 500,
                border:
                  filter === f
                    ? "1px solid rgba(34,197,94,0.25)"
                    : "1px solid #1f2a1e",
                background: filter === f ? "rgba(34,197,94,0.10)" : "#111710",
                color: filter === f ? "#22c55e" : "#4a6a44",
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#111710", border: "1px solid #1f2a1e" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid #1f2a1e" }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>
            {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 11, color: "#4a6a44" }}>
            Sorted by recent
          </span>
        </div>

        <div>
          {filtered.length === 0 ? (
            <p
              className="text-center py-12"
              style={{ fontSize: 13, color: "#4a6a44" }}
            >
              No conversations found
            </p>
          ) : (
            filtered.map((c, i) => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:opacity-90"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid #1f2a1e",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#192018";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      background: "#192018",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#22c55e",
                    }}
                  >
                    {c.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}
                      >
                        {c.name}
                      </p>
                      <span
                        className="rounded-full px-2"
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          padding: "1px 7px",
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p
                      className="truncate"
                      style={{ fontSize: 11, color: "#4a6a44" }}
                    >
                      {c.message}
                    </p>
                    <p style={{ fontSize: 10, color: "#2a4a24", marginTop: 2 }}>
                      {c.phone}
                    </p>
                  </div>

                  <div
                    className="flex-shrink-0"
                    style={{
                      fontSize: 11,
                      color: "#4a6a44",
                      textAlign: "right",
                    }}
                  >
                    {c.time}
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
