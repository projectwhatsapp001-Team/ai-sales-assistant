// frontend/src/App.jsx
import { useState, useEffect, useRef, Component } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./components/pages/LoginPage";
import SignupPage from "./components/pages/SignupPage";
import AuthCallback from "./components/pages/AuthCallback";
import OnboardingModal from "./components/pages/OnboardingModal";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import OverviewPage from "./components/pages/OverviewPage";
import ConversationsPage from "./components/pages/ConversationsPage";
import OrdersPage from "./components/pages/OrdersPage";
import FollowUpPage from "./components/pages/FollowUpPage";
import SettingsPage from "./components/pages/SettingsPage";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import BillingPage from "./components/pages/BillingPage";
import { AlertTriangle, Loader2, Zap, Clock, ShieldAlert } from "lucide-react";

// ── SAFE SUPABASE IMPORT ──
let supabase = null;
try {
  const mod = await import("./lib/supabase.js");
  supabase = mod.supabase;
} catch (e) {
  console.warn("⚠️ Supabase not loaded — using localStorage only:", e.message);
}

// ── ERROR BOUNDARY ──
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>
            <h2 className="font-syne font-bold text-2xl text-slate-50 mb-3 tracking-tight">System Interruption</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              {this.state.error?.message || "An unexpected intelligence fault occurred. Betty needs a quick restart."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              Restart SalesBot
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PAGES = {
  overview: OverviewPage,
  conversations: ConversationsPage,
  orders: OrdersPage,
  followups: FollowUpPage,
  settings: SettingsPage,
  analytics: AnalyticsPage,
  billing: BillingPage,
};

export default function App() {
  if (window.location.pathname === "/auth/callback") {
    return (
      <ErrorBoundary>
        <AuthCallback />
      </ErrorBoundary>
    );
  }

  const { user, loading, signIn, signOut } = useAuth();
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);
  const [authView, setAuthView] = useState("login");

  const [businessName, setBusinessName] = useState(() => localStorage.getItem("betty-business-name") || "SalesBot");
  const [userName, setUserName] = useState(() => localStorage.getItem("betty-user-name") || "Team Lead");
  const [profileId, setProfileId] = useState(null);
  const [badges, setBadges] = useState({ conversations: 0, orders: 0, followups: 0 });
  const [trialExpired, setTrialExpired] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const mountedRef = useRef(true);
  const badgeIntervalRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      const localBiz = localStorage.getItem("betty-business-name");
      const localName = localStorage.getItem("betty-user-name");
      if (localBiz) setBusinessName(localBiz);
      if (localName) setUserName(localName);

      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, business_name, full_name, trial_ends_at, plan, is_active")
          .eq("user_id", user.id)
          .single();

        if (!mountedRef.current) return;
        if (error || !data) return;

        if (data.business_name) {
          setBusinessName(data.business_name);
          localStorage.setItem("betty-business-name", data.business_name);
        }
        if (data.full_name) {
          setUserName(data.full_name);
          localStorage.setItem("betty-user-name", data.full_name);
        }
        setProfileId(data.id);

        if (!data.business_name || data.business_name === "My Business") setShowOnboarding(true);

        const now = new Date();
        const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        const isPaid = ["starter", "pro"].includes(data.plan);
        const isInTrial = trialEndsAt != null && now < trialEndsAt;
        if (!isPaid && !isInTrial) {
          setTrialExpired(true);
          setPage("billing");
        }
      } catch (err) {
        console.log("Supabase profile error:", err.message);
      }
    }
    loadProfile();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      const biz = localStorage.getItem("betty-business-name");
      const name = localStorage.getItem("betty-user-name");
      if (biz && biz !== businessName) setBusinessName(biz);
      if (name && name !== userName) setUserName(name);
    }, 1000);
    return () => clearInterval(interval);
  }, [businessName, userName]);

  useEffect(() => {
    if (!supabase || !user || !profileId) return;
    async function fetchBadges() {
      try {
        const [c, o, f] = await Promise.all([
          supabase.from("conversations").select("id,needs_human,is_read").eq("profile_id", profileId),
          supabase.from("orders").select("id,status").eq("profile_id", profileId),
          supabase.from("follow_ups").select("id,status").eq("profile_id", profileId),
        ]);
        if (!mountedRef.current) return;
        setBadges({
          conversations: Array.isArray(c.data) ? c.data.filter((x) => x.needs_human || !x.is_read).length : 0,
          orders: Array.isArray(o.data) ? o.data.filter((x) => x.status === "pending").length : 0,
          followups: Array.isArray(f.data) ? f.data.filter((x) => x.status === "pending").length : 0,
        });
      } catch (err) {
        console.log("Badge fetch error:", err.message);
      }
    }
    fetchBadges();
    badgeIntervalRef.current = setInterval(fetchBadges, 60000);
    return () => clearInterval(badgeIntervalRef.current);
  }, [user, profileId]);

  const userInitials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 animate-pulse">
            <Zap size={32} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="font-syne font-bold text-slate-50 text-xl tracking-tight">Waking Betty...</p>
            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
              <Loader2 size={14} className="animate-spin" />
              <span>Authenticating secure session</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        {authView === "signup" ? (
          <SignupPage onSwitchToLogin={() => setAuthView("login")} />
        ) : (
          <LoginPage onLogin={signIn} onSwitchToSignup={() => setAuthView("signup")} />
        )}
      </ErrorBoundary>
    );
  }

  const PageComponent = PAGES[page] || OverviewPage;

  function handleNavigate(p) {
    if (trialExpired && p !== "billing") return;
    setPage(p);
    setSidebar(false);
  }

  return (
    <ErrorBoundary>
      {showOnboarding && (
        <OnboardingModal
          userId={user.id}
          onComplete={(updated) => {
            if (!mountedRef.current) return;
            setBusinessName(updated.business_name || "SalesBot");
            setUserName(updated.full_name || "Team Lead");
            setShowOnboarding(false);
          }}
        />
      )}

      {trialExpired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6">
          <div className="max-w-md w-full p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
              <Clock size={40} className="text-amber-500" />
            </div>
            <h2 className="font-syne font-bold text-2xl text-slate-50 mb-3 tracking-tight">Trial Period Concluded</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Your free intelligence trial has ended. To continue leveraging Betty for automated sales, please upgrade to a production plan.
            </p>
            <button
              onClick={() => setPage("billing")}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              Unlock Unlimited AI
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
        <Sidebar
          activePage={page}
          onNavigate={handleNavigate}
          open={sidebarOpen}
          onClose={() => setSidebar(false)}
          onSignOut={signOut}
          businessName={businessName}
          userInitials={userInitials}
          badges={badges}
          trialExpired={trialExpired}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar
            page={page}
            onMenuClick={() => setSidebar(true)}
            onNavigate={handleNavigate}
            profileId={profileId}
          />
          <main className="flex-1 overflow-hidden bg-slate-950">
            <div className="h-full w-full overflow-y-auto scrollbar-hide">
              <div className="max-w-[1600px] mx-auto h-full">
                {page === "settings" ? (
                  <div className="p-6 sm:p-10"><SettingsPage profileId={profileId} /></div>
                ) : page === "billing" ? (
                  <div className="p-6 sm:p-10"><BillingPage profileId={profileId} userEmail={user?.email} /></div>
                ) : (
                  <PageComponent key={page} />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
