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
  ChevronRight,
  LogOut,
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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-950 border-r border-slate-800 transition-all duration-500 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } shadow-2xl shadow-black/50`}
      >
        {/* ── App Brand ── */}
        <div className="flex items-center gap-4 px-6 py-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center justify-center rounded-xl w-10 h-10 bg-indigo-500 shadow-xl shadow-indigo-500/20">
              <Bot size={22} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-syne font-extrabold text-lg text-slate-50 tracking-tight leading-none truncate">
              {businessName || "SalesBot"}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${trialExpired ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${trialExpired ? "text-rose-500" : "text-slate-500"}`}>
                {trialExpired ? "Trial Expired" : "Betty Online"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── AI Assistant Toggle/Status ── */}
        <div className="px-4 mb-8">
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 group cursor-pointer hover:bg-indigo-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Core Intelligence</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500 text-[9px] font-black text-white">AI</span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Betty is currently handling <span className="text-slate-200 font-bold">12 active</span> customers across WhatsApp.
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            const isLocked = trialExpired && item.id !== "billing";
            const Icon = item.icon;
            const isBilling = item.id === "billing";

            return (
              <button
                key={item.id}
                onClick={() => !isLocked && onNavigate(item.id)}
                className={`w-full group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${
                  isLocked ? "cursor-not-allowed opacity-30 grayscale" : "cursor-pointer"
                } ${
                  isActive
                    ? `bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/5`
                    : `bg-transparent border border-transparent text-slate-500 hover:bg-slate-900/50 hover:text-slate-300`
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                )}
                
                <Icon size={18} className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span className="flex-1 text-left text-[13px] font-bold tracking-tight">
                  {item.label}
                </span>
                
                {item.badge != null && item.badge > 0 && (
                  <span
                    className={`flex items-center justify-center rounded-lg min-w-[20px] h-5 px-1.5 text-[10px] font-black transition-all duration-300 ${
                      isActive ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                    }`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}

                {isBilling && trialExpired && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 animate-pulse">
                    <X size={12} className="text-white" />
                  </div>
                )}
                
                <ChevronRight size={14} className={`opacity-0 transition-all duration-300 -translate-x-2 ${isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-40 group-hover:translate-x-0"}`} />
              </button>
            );
          })}
        </nav>

        {/* ── User Profile & Actions ── */}
        <div className="p-6 border-t border-slate-800/50 mt-auto">
          <div className="flex items-center gap-4 mb-6 p-2 rounded-2xl hover:bg-slate-900/50 transition-colors cursor-pointer group">
            <div className="relative">
              <div className="flex items-center justify-center rounded-xl w-10 h-10 bg-slate-900 text-xs font-black text-indigo-400 border border-slate-800 shadow-inner">
                {userInitials || "TL"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-50 group-hover:text-indigo-400 transition-colors">
                {businessName || "Administrator"}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Admin Account</p>
            </div>
          </div>
          
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-[12px] font-bold text-slate-500 bg-slate-900/50 border border-slate-800 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95"
          >
            <LogOut size={16} />
            Sign Out Session
          </button>
        </div>
      </aside>
    </>
  );
}
