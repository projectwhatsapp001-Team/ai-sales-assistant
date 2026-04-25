// src/components/pages/ConversationsPage.jsx
import { useState, useEffect, useRef } from "react";
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
import { supabase } from "../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "";

const MOCK_CONVERSATIONS = [
  {
    id: "1",
    customer_id: "c1",
    customers: { full_name: "John Smith", phone_number: "+233 24 123 4567" },
    status: "buying",
    last_message: "I'm interested in your premium package...",
    time: "5m ago",
    unread: 0,
    needs_human: false,
    messages: [
      {
        id: 1,
        from: "customer",
        text: "Hi, do you have the premium package in stock?",
        time: "10:30 AM",
      },
      {
        id: 2,
        from: "ai",
        text: "Hello! Yes, our premium package is available for GH₵450. Would you like to place an order?",
        time: "10:31 AM",
      },
      {
        id: 3,
        from: "customer",
        text: "I'm interested. Can you tell me more about what's included?",
        time: "10:35 AM",
      },
    ],
  },
  {
    id: "2",
    customer_id: "c2",
    customers: { full_name: "Alice Johnson", phone_number: "+233 54 987 6543" },
    status: "asking",
    last_message: "What about delivery to Kumasi?",
    time: "6m ago",
    unread: 1,
    needs_human: false,
    messages: [
      {
        id: 1,
        from: "customer",
        text: "How much is the shea butter?",
        time: "10:20 AM",
      },
      {
        id: 2,
        from: "ai",
        text: "Our organic shea butter is GH₵120 for 500ml.",
        time: "10:21 AM",
      },
      {
        id: 3,
        from: "customer",
        text: "What about delivery to Kumasi?",
        time: "10:25 AM",
      },
    ],
  },
  {
    id: "3",
    customer_id: "c3",
    customers: { full_name: "Kemi Adeyemi", phone_number: "+233 20 456 7890" },
    status: "buying",
    last_message: "Can I pay on delivery?",
    time: "7m ago",
    unread: 0,
    needs_human: true,
    messages: [
      {
        id: 1,
        from: "customer",
        text: "I want to order 2 boxes",
        time: "10:15 AM",
      },
      {
        id: 2,
        from: "ai",
        text: "2 boxes at GH₵120 each = GH₵240. Shall I confirm?",
        time: "10:16 AM",
      },
      {
        id: 3,
        from: "customer",
        text: "Can I pay on delivery?",
        time: "10:18 AM",
      },
    ],
  },
  {
    id: "4",
    customer_id: "c4",
    customers: {
      full_name: "+234 810 555 1234",
      phone_number: "+234 810 555 1234",
    },
    status: "follow-up",
    last_message: "Need to confirm with my partner...",
    time: "12m ago",
    unread: 0,
    needs_human: false,
    messages: [
      {
        id: 1,
        from: "customer",
        text: "I'll get back to you",
        time: "9:45 AM",
      },
      {
        id: 2,
        from: "ai",
        text: "No problem! I'll follow up tomorrow.",
        time: "9:46 AM",
      },
      {
        id: 3,
        from: "customer",
        text: "Need to confirm with my partner first",
        time: "10:00 AM",
      },
    ],
  },
];

const STATUS_CONFIG = {
  buying: {
    label: "Buying",
    bg: "rgba(16,185,129,0.15)",
    color: "#10b981",
    border: "rgba(16,185,129,0.3)",
  },
  asking: {
    label: "Asking",
    bg: "rgba(245,158,11,0.15)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
  "follow-up": {
    label: "Follow-Up",
    bg: "rgba(100,116,139,0.15)",
    color: "#64748b",
    border: "rgba(100,116,139,0.3)",
  },
  "needs-human": {
    label: "Needs Human",
    bg: "rgba(244,63,94,0.15)",
    color: "#f43f5e",
    border: "rgba(244,63,94,0.3)",
  },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "needs-human", label: "Needs Human" },
  { id: "buying", label: "Buying" },
  { id: "asking", label: "Asking" },
  { id: "follow-up", label: "Follow-Up" },
];

function TypingBubble() {
  return (
    <div className="flex justify-end mb-3">
      <div
        className="px-4 py-3 rounded-xl flex items-center gap-1.5"
        style={{
          background: "rgba(99,102,241,0.15)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderBottomRightRadius: 4,
        }}
      >
        <span
          className="pulse-dot rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "#818cf8",
            display: "inline-block",
          }}
        />
        <span
          className="pulse-dot rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "#818cf8",
            display: "inline-block",
            animationDelay: "0.2s",
          }}
        />
        <span
          className="pulse-dot rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "#818cf8",
            display: "inline-block",
            animationDelay: "0.4s",
          }}
        />
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isCustomer = message.from === "customer";
  return (
    <div
      className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-3`}
    >
      <div
        className="max-w-[70%] px-4 py-2.5 rounded-xl"
        style={{
          background: isCustomer ? "#18181f" : "rgba(99,102,241,0.15)",
          border: isCustomer
            ? "1px solid #2a2a35"
            : "1px solid rgba(99,102,241,0.3)",
          borderBottomLeftRadius: isCustomer ? 4 : 16,
          borderBottomRightRadius: isCustomer ? 16 : 4,
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: isCustomer ? "#f8fafc" : "#818cf8",
            lineHeight: 1.5,
          }}
        >
          {message.text}
        </p>
        <p
          className="text-right mt-1"
          style={{ fontSize: 10, color: "#64748b" }}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}

function StreamingMessage({ text }) {
  return (
    <div className="flex justify-end mb-3">
      <div
        className="max-w-[70%] px-4 py-2.5 rounded-xl"
        style={{
          background: "rgba(99,102,241,0.15)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderBottomRightRadius: 4,
        }}
      >
        <p style={{ fontSize: 13, color: "#818cf8", lineHeight: 1.5 }}>
          {text}
          <span
            className="pulse-dot inline-block ml-1"
            style={{
              width: 6,
              height: 6,
              background: "#818cf8",
              borderRadius: "50%",
              verticalAlign: "middle",
            }}
          />
        </p>
      </div>
    </div>
  );
}

function ConvItem({ data, isActive, onClick }) {
  const status = data.needs_human ? "needs-human" : data.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.buying;
  const name = data.customers?.full_name || "Unknown";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
      style={{
        background: isActive ? "#18181f" : "transparent",
        borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#141419";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
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
          border: data.needs_human
            ? "1px solid rgba(244,63,94,0.3)"
            : "1px solid #2a2a35",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: data.unread > 0 ? "#f8fafc" : "#94a3b8",
            }}
          >
            {name}
          </p>
          <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>
            {data.time}
          </span>
        </div>
        <p
          className="truncate"
          style={{
            fontSize: 12,
            color: data.unread > 0 ? "#818cf8" : "#64748b",
          }}
        >
          {data.last_message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              padding: "1px 7px",
              borderRadius: 99,
            }}
          >
            {cfg.label}
          </span>
          {data.needs_human && (
            <span
              className="pulse-dot rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#f43f5e",
                display: "inline-block",
              }}
            />
          )}
          {data.unread > 0 && (
            <span
              className="flex items-center justify-center rounded-full"
              style={{
                width: 16,
                height: 16,
                background: "#6366f1",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {data.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("needs-human");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [threadMessages, setThreadMessages] = useState({});
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // ── Fetch conversations ───────────────────────────────────
  useEffect(() => {
    async function fetchConvs() {
      try {
        setLoading(true);
        const data = await apiGet("/conversations").catch(() => null);
        setConversations(
          !data || data.length === 0 ? MOCK_CONVERSATIONS : data,
        );
      } catch {
        setConversations(MOCK_CONVERSATIONS);
      } finally {
        setLoading(false);
      }
    }
    fetchConvs();
  }, []);

  // ── Supabase Realtime — update thread when new message arrives
  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv?.customer_id || conv.customer_id.startsWith("c")) return; // mock data

    const channel = supabase
      .channel(`thread-${conv.customer_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `customer_id=eq.${conv.customer_id}`,
        },
        (payload) => {
          const row = payload.new;
          const newMsg = {
            id: row.id,
            from: row.role === "assistant" ? "ai" : "customer",
            text: row.message,
            time: new Date(row.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setThreadMessages((prev) => ({
            ...prev,
            [activeId]: [...(prev[activeId] || []), newMsg],
          }));
          // Also update the conversation list preview
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? { ...c, last_message: row.message, time: "just now" }
                : c,
            ),
          );
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeId, conversations]);

  // ── Load thread for selected conversation ─────────────────
  useEffect(() => {
    if (!activeId) return;
    if (threadMessages[activeId]) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;

    if (!conv.customer_id || conv.customer_id.startsWith("c")) {
      setThreadMessages((prev) => ({
        ...prev,
        [activeId]: conv.messages || [],
      }));
      return;
    }

    apiGet(`/conversations/thread/${conv.customer_id}`)
      .then((data) => {
        if (data?.messages)
          setThreadMessages((prev) => ({ ...prev, [activeId]: data.messages }));
      })
      .catch(() =>
        setThreadMessages((prev) => ({
          ...prev,
          [activeId]: conv.messages || [],
        })),
      );
  }, [activeId, conversations]);

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages, streamingText]);

  // ── Send message + SSE stream ─────────────────────────────
  function sendMessage() {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;

    const now = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setThreadMessages((prev) => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] || []),
        { id: Date.now(), from: "customer", text, time: now },
      ],
    }));
    setInputText("");
    setIsStreaming(true);
    setStreamingText("");

    const params = new URLSearchParams({
      message: text,
      customerId: conv.customer_id || conv.id,
    });
    const es = new EventSource(`${API_URL}/api/stream?${params}`);
    eventSourceRef.current = es;

    es.addEventListener("token", (e) => {
      setStreamingText((prev) => prev + JSON.parse(e.data).token);
    });

    es.addEventListener("done", (e) => {
      const { fullReply } = JSON.parse(e.data);
      const aiMsg = {
        id: Date.now() + 1,
        from: "ai",
        text: fullReply || streamingText,
        time: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setThreadMessages((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), aiMsg],
      }));
      setStreamingText("");
      setIsStreaming(false);
      es.close();
    });

    es.addEventListener("error", () => {
      if (!streamingText) {
        const fallback = [
          "Thanks for reaching out! Let me check that for you.",
          "Sure! Happy to help with that.",
          "Great question! Let me get those details.",
        ][Math.floor(Math.random() * 3)];
        setThreadMessages((prev) => ({
          ...prev,
          [activeId]: [
            ...(prev[activeId] || []),
            {
              id: Date.now() + 1,
              from: "ai",
              text: fallback,
              time: new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        }));
      }
      setStreamingText("");
      setIsStreaming(false);
      es.close();
    });
  }

  useEffect(() => () => eventSourceRef.current?.close(), []);

  const filtered = conversations.filter((c) => {
    const name = c.customers?.full_name || "";
    const matchStatus =
      filter === "all" || (c.needs_human ? "needs-human" : c.status) === filter;
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeMessages = threadMessages[activeId] || [];

  const status = activeConversation?.needs_human
    ? "needs-human"
    : activeConversation?.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.buying;
  const name = activeConversation?.customers?.full_name || "Unknown";
  const phone = activeConversation?.customers?.phone_number || "";

  return (
    <div className="fade-up flex h-full w-full">
      {/* Left Panel */}
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
        <div
          className="p-4"
          style={{ borderBottom: "1px solid #1a1a22", flexShrink: 0 }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
            style={{ background: "#18181f", border: "1px solid #2a2a35" }}
          >
            <Search size={14} style={{ color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#f8fafc",
                width: "100%",
              }}
            />
          </div>
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg flex-shrink-0 cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  border:
                    filter === f.id
                      ? "1px solid rgba(99,102,241,0.25)"
                      : "1px solid #2a2a35",
                  background:
                    filter === f.id ? "rgba(99,102,241,0.10)" : "#18181f",
                  color: filter === f.id ? "#818cf8" : "#64748b",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {loading ? (
            <div
              className="py-12 text-center"
              style={{ fontSize: 13, color: "#64748b" }}
            >
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-12 text-center"
              style={{ fontSize: 13, color: "#64748b" }}
            >
              No conversations found
            </div>
          ) : (
            filtered.map((c) => (
              <ConvItem
                key={c.id}
                data={c}
                isActive={c.id === activeId}
                onClick={() => {
                  setActiveId(c.id);
                  setShowChat(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={`flex-1 flex flex-col ${showChat ? "flex" : "hidden lg:flex"}`}
        style={{ background: "#07070a", minWidth: 0 }}
      >
        {activeConversation ? (
          <>
            {/* Chat header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderBottom: "1px solid #1a1a22",
                background: "#0f0f14",
                flexShrink: 0,
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChat(false)}
                  className="lg:hidden"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 38,
                    height: 38,
                    background: activeConversation.needs_human
                      ? "rgba(244,63,94,0.15)"
                      : "#18181f",
                    fontSize: 13,
                    fontWeight: 700,
                    color: activeConversation.needs_human
                      ? "#f43f5e"
                      : "#818cf8",
                    border: activeConversation.needs_human
                      ? "1px solid rgba(244,63,94,0.3)"
                      : "1px solid #2a2a35",
                  }}
                >
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#f8fafc",
                      }}
                    >
                      {name}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        padding: "1px 7px",
                        borderRadius: 99,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone size={10} style={{ color: "#64748b" }} />
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeConversation.needs_human && (
                  <button
                    onClick={() =>
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === activeId
                            ? { ...c, needs_human: false, status: "asking" }
                            : c,
                        ),
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#f43f5e",
                      background: "rgba(244,63,94,0.1)",
                      border: "1px solid rgba(244,63,94,0.3)",
                    }}
                  >
                    <Hand size={14} /> Take Over
                  </button>
                )}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4"
              style={{ minHeight: 0 }}
            >
              <div className="text-center mb-4">
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    background: "#18181f",
                    padding: "4px 12px",
                    borderRadius: 99,
                  }}
                >
                  <Clock size={10} className="inline mr-1" />
                  Today
                </span>
              </div>
              {activeMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isStreaming && streamingText === "" && <TypingBubble />}
              {isStreaming && streamingText !== "" && (
                <StreamingMessage text={streamingText} />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="px-5 py-3"
              style={{
                borderTop: "1px solid #1a1a22",
                background: "#0f0f14",
                flexShrink: 0,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg"
                  style={{ background: "#18181f", border: "1px solid #2a2a35" }}
                >
                  <input
                    type="text"
                    placeholder={
                      isStreaming ? "Betty is replying..." : "Type a message..."
                    }
                    value={inputText}
                    disabled={isStreaming}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) sendMessage();
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      color: "#f8fafc",
                      width: "100%",
                      opacity: isStreaming ? 0.5 : 1,
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isStreaming || !inputText.trim()}
                  className="flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    background: isStreaming ? "#2a2a35" : "#6366f1",
                    border: "none",
                    opacity: isStreaming ? 0.6 : 1,
                  }}
                >
                  <Send size={18} style={{ color: "#fff" }} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle
                size={48}
                style={{ color: "#2a2a35", margin: "0 auto 16px" }}
              />
              <p style={{ fontSize: 14, color: "#64748b" }}>
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
