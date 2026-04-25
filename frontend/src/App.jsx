// src/App.jsx
import { useState, useEffect, Component } from "react";
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

// ── Error Boundary ────────────────────────────────────────────
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
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#07070a" }}
        >
          <div
            className="max-w-md p-8 rounded-2xl text-center"
            style={{ background: "#18181f", border: "1px solid #2a2a35" }}
          >
            <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
            <p
              style={{
                fontFamily: "Syne, sans-serif",
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

  // ── Load profile ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);

        // Check if this is a new user who hasn't set their business name yet
        const isNewUser =
          !data.business_name || data.business_name === "My Business";
        if (isNewUser) setShowOnboarding(true);

        // ── Trial enforcement ─────────────────────────────
        const now = new Date();
        const trialEndsAt = data.trial_ends_at
          ? new Date(data.trial_ends_at)
          : null;
        const isPaid = ["starter", "pro"].includes(data.plan);
        const isInTrial = trialEndsAt && now < trialEndsAt;

        if (!isPaid && !isInTrial) {
          setTrialExpired(true);
          setPage("billing"); // Force redirect to billing
        }
      })
      .catch(console.error);
  }, [user]);

  // ── Load live badge counts ────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function fetchBadges() {
      try {
        const [convs, orders, followups] = await Promise.all([
          apiGet("/conversations").catch(() => []),
          apiGet("/orders").catch(() => []),
          apiGet("/followups").catch(() => []),
        ]);
        setBadges({
          conversations: Array.isArray(convs)
            ? convs.filter((c) => c.needs_human || c.unread > 0).length
            : 0,
          orders: Array.isArray(orders)
            ? orders.filter((o) => o.status === "pending").length
            : 0,
          followups: Array.isArray(followups)
            ? followups.filter((f) => f.status === "pending").length
            : 0,
        });
      } catch (err) {
        console.error("Badge load error:", err);
      }
    }
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Loading screen ────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#07070a" }}
      >
        <div className="flex flex-col items-center gap-3">
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
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={signIn} />
      </ErrorBoundary>
    );
  }

  const businessName = profile?.business_name || "SalesBot";
  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "TL";
  const PageComponent = PAGES[page] || OverviewPage;

  const pageProps = {};
  if (page === "settings") {
    pageProps.profileId = profile?.id;
  }
  if (page === "billing") {
    pageProps.profileId = profile?.id;
    pageProps.userEmail = user?.email;
  }

  // ── Handle navigate — block if trial expired ──────────────
  function handleNavigate(p) {
    if (trialExpired && p !== "billing") return; // lock to billing
    setPage(p);
    setSidebar(false);
  }

  return (
    <ErrorBoundary>
      {/* Onboarding modal — shows for new users */}
      {showOnboarding && (
        <OnboardingModal
          userId={user.id}
          onComplete={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Trial expired banner */}
      {trialExpired && page !== "billing" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="max-w-md w-full mx-4 p-8 rounded-2xl text-center"
            style={{
              background: "#18181f",
              border: "1px solid rgba(244,63,94,0.4)",
            }}
          >
            <p style={{ fontSize: 40, marginBottom: 16 }}>⏰</p>
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Your free trial has ended
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Subscribe to keep Betty running and serving your customers. Plans
              start at GH₵99/month.
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
        className="flex h-screen overflow-hidden"
        style={{ background: "#07070a", color: "#f8fafc" }}
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
          className="flex flex-col flex-1 overflow-hidden"
          style={{ background: "#07070a" }}
        >
          <TopBar
            page={page}
            onMenuClick={() => setSidebar(true)}
            onNavigate={handleNavigate}
            profileId={profile?.id}
          />
          <main
            className="flex-1 overflow-hidden p-6"
            style={{ background: "#07070a" }}
          >
            <PageComponent key={page} {...pageProps} />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
