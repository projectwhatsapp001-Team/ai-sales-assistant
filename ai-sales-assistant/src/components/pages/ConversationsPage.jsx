// src/components/pages/ConversationsPage.jsx
import { useState, useEffect } from "react";
import {
  Search,
  Phone,
  Hand,
  Send,
  ChevronLeft,
  MoreVertical,
  Clock,
  MessageCircle,
} from "lucide-react";
import { apiGet } from "../../lib/api";

const MOCK_CONVERSATIONS = [
  {
    id: "1",
    customers: { full_name: "John Smith", phone_number: "+233 24 123 4567" },
    status: "buying",
    last_message: "I'm interested in your premium package...",
    time: "5m ago",
    unread: 0,
    needs_human: false,
    messages: [
      { id: 1, from: "customer", text: "Hi, do you have the premium package in stock?", time: "10:30 AM" },
      { id: 2, from: "ai", text: "Hello! Yes, our premium package is available. It includes 3 items for GH₵450. Would you like to place an order?", time: "10:31 AM" },
      { id: 3, from: "customer", text: "I'm interested in your premium package. Can you tell me more about what's included?", time: "10:35 AM" },
    ],
  },
  {
    id: "2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 987 6543" },
    status: "asking",
    last_message: "Asked price and next steps",
    time: "6m ago",
    unread: 1,
    needs_human: false,
    messages: [
      { id: 1, from: "customer", text: "How much is the shea butter?", time: "10:20 AM" },
      { id: 2, from: "ai", text: "Our organic shea butter is GH₵120 for 500ml. We also have a 1L size for GH₵200.", time: "10:21 AM" },
      { id: 3, from: "customer", text: "What about delivery to Kumasi?", time: "10:25 AM" },
    ],
  },
  {
    id: "3",
    customers: { full_name: "Kemi Adeyemi", phone_number: "+233 20 456 7890" },
    status: "buying",
    last_message: "Can I pay on delivery?",
    time: "7m ago",
    unread: 0,
    needs_human: true,
    messages: [
      { id: 1, from: "customer", text: "I want to order 2 boxes", time: "10:15 AM" },
      { id: 2, from: "ai", text: "Great! 2 boxes of shea butter at GH₵120 each = GH₵240. Shall I confirm this order?", time: "10:16 AM" },
      { id: 3, from: "customer", text: "Can I pay on delivery?", time: "10:18 AM" },
      { id: 4, from: "ai", text: "I understand you'd prefer to pay on delivery. Let me check if that's available for your location...", time: "10:19 AM", pending: true },
    ],
  },
  {
    id: "4",
    customers: { full_name: "+234 810 555 1234", phone_number: "+234 810 555 1234" },
    status: "follow-up",
    last_message: "Need to confirm with my partner...",
    time: "12m ago",
    unread: 0,
    needs_human: false,
    messages: [
      { id: 1, from: "customer", text: "I'll get back to you", time: "9:45 AM" },
      { id: 2, from: "ai", text: "No problem! I'll follow up with you tomorrow. Is there a specific time that works best?", time: "9:46 AM" },
      { id: 3, from: "customer", text: "Need to confirm with my partner first", time: "10:00 AM" },
    ],
  },
];

const STATUS_CONFIG = {
  buying: { label: "Buying", bg: "rgba(16,185,129,0.15)", color: "#10b981", border: "rgba(16,185,129,0.3)" },
  asking: { label: "Asking", bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  "follow-up": { label: "Follow-Up", bg: "rgba(100,116,139,0.15)", color: "#64748b", border: "rgba(100,116,139,0.3)" },
  "needs-human": { label: "Needs Human", bg: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "rgba(244,63,94,0.3)" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "needs-human", label: "Needs Human" },
  { id: "buying", label: "Buying" },
  { id: "asking", label: "Asking" },
  { id: "follow-up", label: "Follow-Up" },
];

function ConversationListItem({ data, isActive, onClick }) {
  const status = data.needs_human ? "needs-human" : data.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.buying;
  const name = data.customers?.full_name || "Unknown";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
      style={{
        background: isActive ? "#18181f" : "transparent",
        borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#141419"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          background: data.needs_human ? "rgba(244,63,94,0.15)" : "#18181f",
          fontSize: 13,
          fontWeight: 700,
          color: data.needs_human ? "#f43f5e" : "#818cf8",
          border: data.needs_human ? "1px solid rgba(244,63,94,0.3)" : "1px solid #2a2a35",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="truncate" style={{ fontSize: 13, fontWeight: 500, color: data.unread > 0 ? "#f8fafc" : "#94a3b8" }}>
            {name}
          </p>
          <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{data.time}</span>
        </div>
        <p className="truncate" style={{ fontSize: 12, color: data.unread > 0 ? "#818cf8" : "#64748b" }}>
          {data.last_message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span style={{ fontSize: 10, fontWeight: 500, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "1px 7px", borderRadius: 99 }}>
            {cfg.label}
          </span>
          {data.needs_human && <span className="pulse-dot rounded-full" style={{ width: 6, height: 6, background: "#f43f5e", display: "inline-block" }} />}
          {data.unread > 0 && (
            <span className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#6366f1", fontSize: 10, fontWeight: 700, color: "#fff" }}>
              {data.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isCustomer = message.from === "customer";
  const isPending = message.pending;

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-3`}>
      <div
        className="max-w-[70%] px-4 py-2.5 rounded-xl"
        style={{
          background: isCustomer ? "#18181f" : "rgba(99,102,241,0.15)",
          border: isCustomer ? "1px solid #2a2a35" : "1px solid rgba(99,102,241,0.3)",
          borderBottomLeftRadius: isCustomer ? 4 : 16,
          borderBottomRightRadius: isCustomer ? 16 : 4,
        }}
      >
        <p style={{ fontSize: 13, color: isCustomer ? "#f8fafc" : "#818cf8", lineHeight: 1.5 }}>
          {message.text}
          {isPending && (
            <span className="inline-flex ml-2">
              <span className="pulse-dot rounded-full" style={{ width: 5, height: 5, background: "#64748b", display: "inline-block", marginRight: 3 }} />
              <span className="pulse-dot rounded-full" style={{ width: 5, height: 5, background: "#64748b", display: "inline-block", marginRight: 3, animationDelay: "0.2s" }} />
              <span className="pulse-dot rounded-full" style={{ width: 5, height: 5, background: "#64748b", display: "inline-block", animationDelay: "0.4s" }} />
            </span>
          )}
        </p>
        <p className="text-right mt-1" style={{ fontSize: 10, color: "#64748b" }}>{message.time}</p>
      </div>
    </div>
  );
}

function ChatHeader({ conversation, onBack, onTakeOver }) {
  if (!conversation) return null;
  const status = conversation.needs_human ? "needs-human" : conversation.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.buying;
  const name = conversation.customers?.full_name || "Unknown";
  const phone = conversation.customers?.phone_number || "";

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #1a1a22", background: "#0f0f14", flexShrink: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden" style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 38,
            height: 38,
            background: conversation.needs_human ? "rgba(244,63,94,0.15)" : "#18181f",
            fontSize: 13,
            fontWeight: 700,
            color: conversation.needs_human ? "#f43f5e" : "#818cf8",
            border: conversation.needs_human ? "1px solid rgba(244,63,94,0.3)" : "1px solid #2a2a35",
          }}
        >
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p style={{ fontSize: 14, fontWeight: 500, color: "#f8fafc" }}>{name}</p>
            <span style={{ fontSize: 10, fontWeight: 500, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "1px 7px", borderRadius: 99 }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone size={10} style={{ color: "#64748b" }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{phone}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {conversation.needs_human && (
          <button
            onClick={onTakeOver}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ fontSize: 12, fontWeight: 500, color: "#f43f5e", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.1)"; }}
          >
            <Hand size={14} /> Take Over
          </button>
        )}
        <button style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}>
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("needs-human");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        const data = await apiGet("/conversations").catch(() => null);
        if (!data || data.length === 0) setConversations(MOCK_CONVERSATIONS);
        else setConversations(data);
      } catch (err) {
        setError(err.message);
        setConversations(MOCK_CONVERSATIONS);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const filtered = conversations.filter((c) => {
    const name = c.customers?.full_name || "";
    const matchStatus = filter === "all" || (c.needs_human ? "needs-human" : c.status) === filter;
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || c.last_message?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeConversation = conversations.find((c) => c.id === activeId);

  const handleSelect = (id) => { setActiveId(id); setShowChat(true); };
  const handleTakeOver = () => { alert("Taking over conversation"); };

  if (error && conversations.length === 0) {
    return (
      <div className="fade-up p-6">
        <div className="px-4 py-3 rounded-lg" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", fontSize: 13 }}>
          Error loading conversations: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up flex h-full w-full">
      {/* Left Panel — Conversation List */}
      <div
        className={`flex flex-col border-r ${showChat ? "hidden lg:flex" : "flex"}`}
        style={{
          width: 340,
          minWidth: 340,
          background: "#0f0f14",
          borderColor: "#1a1a22",
          flexShrink: 0,
        }}
      >
        {/* Search + Filter */}
        <div className="p-4" style={{ borderBottom: "1px solid #1a1a22", flexShrink: 0 }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
            <Search size={14} style={{ color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#f8fafc", width: "100%" }}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  border: filter === f.id ? "1px solid rgba(99,102,241,0.25)" : "1px solid #2a2a35",
                  background: filter === f.id ? "rgba(99,102,241,0.10)" : "#18181f",
                  color: filter === f.id ? "#818cf8" : "#64748b",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>Loading conversations...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: "#64748b" }}>No conversations found</div>
          ) : (
            filtered.map((c) => (
              <ConversationListItem
                key={c.id}
                data={c}
                isActive={c.id === activeId}
                onClick={() => handleSelect(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel — Chat Thread */}
      <div
        className={`flex-1 flex flex-col ${showChat ? "flex" : "hidden lg:flex"}`}
        style={{ background: "#07070a", minWidth: 0 }}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              onBack={() => setShowChat(false)}
              onTakeOver={handleTakeOver}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ minHeight: 0 }}>
              <div className="text-center mb-4">
                <span style={{ fontSize: 11, color: "#64748b", background: "#18181f", padding: "4px 12px", borderRadius: 99 }}>
                  <Clock size={10} className="inline mr-1" /> Today
                </span>
              </div>
              {activeConversation.messages?.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>

            {/* Input */}
            <div className="px-5 py-3" style={{ borderTop: "1px solid #1a1a22", background: "#0f0f14", flexShrink: 0 }}>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#f8fafc", width: "100%" }}
                  />
                </div>
                <button
                  className="flex items-center justify-center rounded-lg cursor-pointer transition-colors flex-shrink-0"
                  style={{ width: 40, height: 40, background: "#6366f1", border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
                >
                  <Send size={18} style={{ color: "#fff" }} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
            <div className="text-center">
              <MessageCircle size={48} style={{ color: "#2a2a35", margin: "0 auto 16px" }} />
              <p style={{ fontSize: 14, color: "#64748b" }}>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}