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
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#07070a",
          }}
        >
          <div
            style={{
              maxWidth: 400,
              padding: 32,
              borderRadius: 16,
              background: "#18181f",
              border: "1px solid #2a2a35",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
            <p
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Something went wrong
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                padding: "10px 24px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload App
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
  // ── HANDLE AUTH CALLBACK (email confirmation redirect) ──
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

  // ── STATE: Read from localStorage first (your fix) ──
  const [businessName, setBusinessName] = useState(() => {
    return localStorage.getItem("betty-business-name") || "SalesBot";
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("betty-user-name") || "Team Lead";
  });
  const [profileId, setProfileId] = useState(null);
  const [badges, setBadges] = useState({
    conversations: 0,
    orders: 0,
    followups: 0,
  });
  const [trialExpired, setTrialExpired] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const mountedRef = useRef(true);
  const badgeIntervalRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── LOAD: Try Supabase, fall back to localStorage ──
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
          .select(
            "id, business_name, full_name, trial_ends_at, plan, is_active",
          )
          .eq("user_id", user.id)
          .single();

        if (!mountedRef.current) return;
        if (error || !data) {
          console.log("Supabase profile not found, using localStorage");
          return;
        }

        if (data.business_name) {
          setBusinessName(data.business_name);
          localStorage.setItem("betty-business-name", data.business_name);
        }
        if (data.full_name) {
          setUserName(data.full_name);
          localStorage.setItem("betty-user-name", data.full_name);
        }
        setProfileId(data.id);

        const isNew =
          !data.business_name || data.business_name === "My Business";
        if (isNew) setShowOnboarding(true);

        const now = new Date();
        const trialEndsAt = data.trial_ends_at
          ? new Date(data.trial_ends_at)
          : null;
        const isPaid = ["starter", "pro"].includes(data.plan);
        const isInTrial = trialEndsAt != null && now < trialEndsAt;
        if (!isPaid && !isInTrial) {
          setTrialExpired(true);
          setPage("billing");
        }
      } catch (err) {
        console.log("Supabase error (using localStorage):", err.message);
      }
    }

    loadProfile();
  }, [user]);

  // ── REALTIME: Poll localStorage every 1 second (your fix) ──
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

  // ── BADGES: Try Supabase, use defaults if fails ──
  useEffect(() => {
    if (!supabase || !user || !profileId) return;

    async function fetchBadges() {
      try {
        const [c, o, f] = await Promise.all([
          supabase
            .from("conversations")
            .select("id,needs_human,is_read")
            .eq("profile_id", profileId),
          supabase
            .from("orders")
            .select("id,status")
            .eq("profile_id", profileId),
          supabase
            .from("follow_ups")
            .select("id,status")
            .eq("profile_id", profileId),
        ]);
        if (!mountedRef.current) return;
        setBadges({
          conversations: Array.isArray(c.data)
            ? c.data.filter((x) => x.needs_human || !x.is_read).length
            : 0,
          orders: Array.isArray(o.data)
            ? o.data.filter((x) => x.status === "pending").length
            : 0,
          followups: Array.isArray(f.data)
            ? f.data.filter((x) => x.status === "pending").length
            : 0,
        });
      } catch (err) {
        console.log("Badge fetch error:", err.message);
      }
    }

    fetchBadges();
    if (badgeIntervalRef.current) clearInterval(badgeIntervalRef.current);
    badgeIntervalRef.current = setInterval(fetchBadges, 60000);
    return () => {
      if (badgeIntervalRef.current) clearInterval(badgeIntervalRef.current);
    };
  }, [user, profileId]);

  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── LOADING ──
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07070a",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "#6366f1",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            ⚡
          </div>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Loading {businessName}...
          </p>
        </div>
      </div>
    );
  }

  // ── NOT LOGGED IN: Login or Signup ──
  if (!user) {
    return (
      <ErrorBoundary>
        {authView === "signup" ? (
          <SignupPage onSwitchToLogin={() => setAuthView("login")} />
        ) : (
          <LoginPage
            onLogin={signIn}
            onSwitchToSignup={() => setAuthView("signup")}
          />
        )}
      </ErrorBoundary>
    );
  }

  // ── LOGGED IN: Dashboard ──
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.9)",
          }}
        >
          <div
            style={{
              maxWidth: 400,
              width: "100%",
              margin: "0 16px",
              padding: 32,
              borderRadius: 16,
              background: "#18181f",
              border: "1px solid rgba(244,63,94,0.4)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 40, marginBottom: 16 }}>⏰</p>
            <p
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Free trial ended
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Subscribe to keep Betty running. Plans from GH₵99/month.
            </p>
            <button
              onClick={() => setPage("billing")}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                padding: "12px 32px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              View Plans & Subscribe
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: "#07070a",
          color: "#f8fafc",
        }}
      >
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
            background: "#07070a",
          }}
        >
          <TopBar
            page={page}
            onMenuClick={() => setSidebar(true)}
            onNavigate={handleNavigate}
            profileId={profileId}
          />
          <main
            style={{
              flex: 1,
              overflow: "hidden",
              padding: 24,
              background: "#07070a",
            }}
          >
            {page === "settings" ? (
              <SettingsPage profileId={profileId} />
            ) : page === "billing" ? (
              <BillingPage profileId={profileId} userEmail={user?.email} />
            ) : (
              <PageComponent key={page} />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
