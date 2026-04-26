// frontend/src/App.jsx
import { useState, useEffect, useRef, Component } from "react";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import { apiGet } from "./lib/api";
import LoginPage from "./components/pages/LoginPage";
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
    if (this.state.hasError)
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
  const { user, loading, signIn, signOut } = useAuth();
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState({
    conversations: 0,
    orders: 0,
    followups: 0,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const badgeIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load profile — guard against state updates on unmounted component
  useEffect(() => {
    if (!user) return;
    if (profileLoading) return; // prevent duplicate requests
    setProfileLoading(true);

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!mountedRef.current) return;
        if (error || !data) {
          setProfileLoading(false);
          return;
        }

        setProfile(data);
        setProfileLoading(false);

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
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        console.error("Profile load error:", err);
        setProfileLoading(false);
      });
  }, [user]); // only re-run when user changes

  // Badge counts — single interval, cleared on unmount
  useEffect(() => {
    if (!user) return;

    // Clear any existing interval before creating a new one
    if (badgeIntervalRef.current) clearInterval(badgeIntervalRef.current);

    async function fetchBadges() {
      if (!mountedRef.current) return;
      // Only fetch when page is visible
      if (document.hidden) return;
      try {
        const [convs, orders, followups] = await Promise.allSettled([
          apiGet("/conversations"),
          apiGet("/orders"),
          apiGet("/followups"),
        ]);
        if (!mountedRef.current) return;
        setBadges({
          conversations:
            convs.status === "fulfilled" && Array.isArray(convs.value)
              ? convs.value.filter((c) => c.needs_human || c.unread > 0).length
              : 0,
          orders:
            orders.status === "fulfilled" && Array.isArray(orders.value)
              ? orders.value.filter((o) => o.status === "pending").length
              : 0,
          followups:
            followups.status === "fulfilled" && Array.isArray(followups.value)
              ? followups.value.filter((f) => f.status === "pending").length
              : 0,
        });
      } catch (err) {
        console.error("Badge fetch error:", err.message);
      }
    }

    fetchBadges();
    badgeIntervalRef.current = setInterval(fetchBadges, 60000);
    return () => {
      if (badgeIntervalRef.current) clearInterval(badgeIntervalRef.current);
    };
  }, [user]); // only recreate interval when user changes

  if (loading)
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
          <p style={{ color: "#64748b", fontSize: 13 }}>Loading SalesBot...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <ErrorBoundary>
        <LoginPage onLogin={signIn} />
      </ErrorBoundary>
    );

  const businessName = profile?.business_name || "SalesBot";
  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "TL";
  const PageComponent = PAGES[page] || OverviewPage;

  const pageProps = {};
  if (page === "settings") pageProps.profileId = profile?.id;
  if (page === "billing") {
    pageProps.profileId = profile?.id;
    pageProps.userEmail = user?.email;
  }

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
            setProfile(updated);
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
            profileId={profile?.id}
          />
          <main
            style={{
              flex: 1,
              overflow: "hidden",
              padding: 24,
              background: "#07070a",
            }}
          >
            <PageComponent key={page} {...pageProps} />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
