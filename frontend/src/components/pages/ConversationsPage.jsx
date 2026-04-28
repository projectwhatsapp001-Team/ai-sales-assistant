// frontend/src/components/pages/ConversationsPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Phone,
  Hand,
  Send,
  ChevronLeft,
  MoreVertical,
  Clock,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { apiGet, getStreamUrl } from "../../lib/api";
import { supabase } from "../../lib/supabase";

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
        text: "Hello! Yes, our premium package is available for GH₵450. Would you like to order?",
        time: "10:31 AM",
      },
      {
        id: 3,
        from: "customer",
        text: "I'm interested. Can you tell me more?",
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
        text: "2 boxes = GH₵240. Shall I confirm?",
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
    ],
  },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "needs-human", label: "Needs Human" },
  { id: "buying", label: "Buying" },
  { id: "asking", label: "Asking" },
  { id: "follow-up", label: "Follow-Up" },
];

function TypingBubble() {
  return (
    <div className="flex justify-end mb-4">
      <div className="px-4 py-3 rounded-2xl rounded-br-sm flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
        {[0, 0.2, 0.4].map((delay, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isCustomer = message.from === "customer";
  return (
    <div
      className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 ${
          isCustomer
            ? "bg-slate-900 border border-slate-800 rounded-bl-sm text-slate-50"
            : "bg-indigo-600/90 backdrop-blur-sm border border-indigo-500/30 rounded-br-sm text-white"
        }`}
      >
        <p className="text-[13px] leading-relaxed font-medium">
          {message.text}
        </p>
        <div className={`flex items-center gap-1.5 mt-1.5 ${isCustomer ? "text-slate-500" : "text-white/60"}`}>
          <p className="text-[10px] font-bold uppercase tracking-tighter">
            {message.time}
          </p>
        </div>
      </div>
    </div>
  );
}

function StreamingMessage({ text }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl rounded-br-sm bg-indigo-600/90 backdrop-blur-sm border border-indigo-500/30 text-white shadow-sm">
        <p className="text-[13px] leading-relaxed font-medium">
          {text}
          <span className="w-1.5 h-3.5 bg-white/40 inline-block ml-1 animate-pulse align-middle" />
        </p>
      </div>
    </div>
  );
}

function ConvItem({ data, isActive, onClick }) {
  const status = data.needs_human ? "needs-human" : data.status;
  const name = data.customers?.full_name || "Unknown";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusStyles = {
    buying: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    asking: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "follow-up": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "needs-human": "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  const labels = {
    buying: "Buying",
    asking: "Asking",
    "follow-up": "Follow-Up",
    "needs-human": "Needs Human",
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-300 ${
        isActive
          ? "bg-slate-900 shadow-inner"
          : "bg-transparent hover:bg-slate-900/50"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />
      )}
      
      <div className="relative">
        <div
          className={`flex items-center justify-center rounded-full flex-shrink-0 w-12 h-12 text-[13px] font-bold transition-all duration-300 ${
            data.needs_human
              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              : "bg-slate-800 text-slate-400 border border-slate-700 shadow-inner group-hover:border-indigo-500/50"
          }`}
        >
          {initials}
        </div>
        {data.unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 items-center justify-center text-[9px] font-black text-white">
              {data.unread}
            </span>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p
            className={`truncate text-sm font-bold transition-colors ${
              isActive || data.unread > 0 ? "text-slate-50" : "text-slate-400 group-hover:text-slate-200"
            }`}
          >
            {name}
          </p>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter flex-shrink-0">
            {data.time}
          </span>
        </div>
        <p
          className={`truncate text-xs mt-0.5 ${
            data.unread > 0 ? "text-indigo-400 font-medium" : "text-slate-500"
          }`}
        >
          {data.last_message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border ${statusStyles[status]}`}>
            {labels[status]}
          </span>
          {data.needs_human && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [threadMessages, setThreadMessages] = useState({});
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

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

  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv?.customer_id || conv.customer_id.startsWith("c")) return;

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
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeId, conversations]);

  useEffect(() => {
    if (!activeId || threadMessages[activeId]) return;
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
  }, [activeId, conversations, threadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages, streamingText]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [activeId]);

  const sendMessage = useCallback(async () => {
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

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const url = await getStreamUrl(text, conv.customer_id || conv.id);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      let accumulated = "";

      es.addEventListener("token", (e) => {
        const { token } = JSON.parse(e.data);
        accumulated += token;
        setStreamingText(accumulated);
      });

      es.addEventListener("done", (e) => {
        const { fullReply } = JSON.parse(e.data);
        const reply = fullReply || accumulated;
        const aiMsg = {
          id: Date.now() + 1,
          from: "ai",
          text: reply,
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
        eventSourceRef.current = null;
      });

      es.addEventListener("error", () => {
        const fallbacks = [
          "I'm here to help! Let me look into that for you.",
          "Absolutely, I can assist with that request.",
          "Let me get those details for you right away.",
        ];
        const fallback =
          fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
        setStreamingText("");
        setIsStreaming(false);
        es.close();
        eventSourceRef.current = null;
      });
    } catch (err) {
      console.error("Stream error:", err);
      setIsStreaming(false);
      setStreamingText("");
    }
  }, [inputText, isStreaming, conversations, activeId]);

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
  
  const statusStyles = {
    buying: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    asking: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "follow-up": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "needs-human": "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  const labels = {
    buying: "Buying",
    asking: "Asking",
    "follow-up": "Follow-Up",
    "needs-human": "Needs Human",
  };

  const name = activeConversation?.customers?.full_name || "Unknown";
  const phone = activeConversation?.customers?.phone_number || "";

  return (
    <div className="fade-up flex h-full w-full bg-slate-950 overflow-hidden">
      {/* Left Panel */}
      <div className={`flex flex-col border-r border-slate-800 bg-slate-950/50 backdrop-blur-md w-full lg:w-[360px] lg:min-w-[360px] flex-shrink-0 ${showChat ? "hidden lg:flex" : "flex"}`}>
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <p className="font-syne font-bold text-lg text-slate-50 mb-4">Messages</p>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 bg-slate-900 border border-slate-800 group focus-within:border-indigo-500/50 transition-all">
            <Search size={16} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] text-slate-50 w-full placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg flex-shrink-0 cursor-pointer text-[11px] font-bold transition-all ${
                  filter === f.id
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-800/50">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={24} className="mx-auto text-indigo-500 animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-medium">Syncing conversations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center px-10">
              <MessageCircle size={32} className="mx-auto text-slate-800 mb-4 opacity-50" />
              <p className="text-xs text-slate-500 font-medium">No results found for your search.</p>
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
      <div className={`flex-1 flex flex-col bg-[#07070a] min-w-0 ${showChat ? "flex" : "hidden lg:flex"}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowChat(false)}
                  className="lg:hidden bg-slate-900 border border-slate-800 text-slate-500 cursor-pointer p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div
                  className={`flex items-center justify-center rounded-full w-11 h-11 text-[13px] font-bold ${
                    activeConversation.needs_human
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                      : "bg-slate-900 text-indigo-400 border border-slate-800 shadow-inner"
                  }`}
                >
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-slate-50 truncate max-w-[120px] sm:max-w-[200px]">
                      {name}
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border ${statusStyles[status]}`}>
                      {labels[status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-slate-500">
                    <Phone size={10} className="text-slate-600" />
                    <span className="text-[11px] font-medium">{phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeConversation.needs_human && (
                  <button
                    onClick={() =>
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === activeId ? { ...c, needs_human: false } : c,
                        ),
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all active:scale-95 shadow-lg shadow-rose-500/10"
                  >
                    <Hand size={14} /> Take Over
                  </button>
                )}
                <button className="bg-slate-900 border border-slate-800 text-slate-500 cursor-pointer p-2 rounded-xl hover:bg-slate-800 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-[#07070a] scrollbar-hide">
              <div className="text-center mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800/50">
                  Secure WhatsApp Encryption Active
                </span>
              </div>
              <div className="space-y-2">
                {activeMessages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
              {isStreaming && streamingText === "" && <TypingBubble />}
              {isStreaming && streamingText !== "" && (
                <StreamingMessage text={streamingText} />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-indigo-500/50 transition-all">
                  <input
                    type="text"
                    placeholder={
                      isStreaming ? "Betty is thinking..." : "Type your message..."
                    }
                    value={inputText}
                    disabled={isStreaming}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) sendMessage();
                    }}
                    className={`bg-transparent border-none outline-none text-[13px] text-slate-50 w-full placeholder:text-slate-600 ${isStreaming ? "opacity-50" : "opacity-100"}`}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isStreaming || !inputText.trim()}
                  className={`flex items-center justify-center rounded-2xl flex-shrink-0 w-12 h-12 border-none transition-all active:scale-95 shadow-xl shadow-indigo-500/10 ${
                    isStreaming || !inputText.trim()
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500 hover:rotate-12"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-950">
            <div className="text-center max-w-xs animate-in fade-in zoom-in duration-700">
              <div className="relative mb-6 mx-auto w-24 h-24 flex items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
                <MessageCircle size={40} className="text-slate-700" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-500 border-4 border-slate-950 animate-bounce" />
              </div>
              <p className="font-syne font-bold text-slate-50 text-lg mb-2">Your Conversations</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select a chat from the left to view the thread and interact with customers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
