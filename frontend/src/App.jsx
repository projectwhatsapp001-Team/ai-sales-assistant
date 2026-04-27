// frontend/src/App.jsx
import { useState, useEffect, useRef, Component } from "react";
import { useAuth } from "./hooks/useAuth";
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

// ── SAFE SUPABASE IMPORT ──
// Try to load supabase, but don't crash if .env is missing
let supabase = null;
try {
  const mod = await import("./lib/supabase.js");
  supabase = mod.supabase;
} catch (e) {
  console.warn("⚠️ Supabase not loaded — using localStorage only:", e.message);
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

  // ── STATE: Read from localStorage first (instant, no crash) ──
  const [businessName, setBusinessName] = useState(() => {
    return localStorage.getItem("betty-business-name") || "SalesBot";
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("betty-user-name") || "Team Lead";
  });
  const [profileId, setProfileId] = useState(null);
  const [badges, setBadges] = useState({ conversations: 3, orders: 2, followups: 1 });
  const [trialExpired, setTrialExpired] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── LOAD: Try Supabase, fall back to localStorage ──
  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // 1. Load from localStorage immediately (no wait)
      const localBiz = localStorage.getItem("betty-business-name");
      const localName = localStorage.getItem("betty-user-name");
      if (localBiz) setBusinessName(localBiz);
      if (localName) setUserName(localName);

      // 2. Try Supabase (if available)
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, business_name, full_name, trial_ends_at, plan, is_active")
          .eq("user_id", user.id)
          .single();

        if (!mountedRef.current) return;
        if (error || !data) {
          console.log("Supabase profile not found, using localStorage");
          return;
        }

        // Update from Supabase
        if (data.business_name) {
          setBusinessName(data.business_name);
          localStorage.setItem("betty-business-name", data.business_name);
        }
        if (data.full_name) {
          setUserName(data.full_name);
          localStorage.setItem("betty-user-name", data.full_name);
        }
        setProfileId(data.id);

        // Check trial
        const now = new Date();
        const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
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

  // ── REALTIME: Poll localStorage every 1 second ──
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
          supabase.from("conversations").select("id,needs_human,is_read").eq("profile_id", profileId),
          supabase.from("orders").select("id,status").eq("profile_id", profileId),
          supabase.from("follow_ups").select("id,status").eq("profile_id", profileId),
        ]);
        if (!mountedRef.current) return;
        setBadges({
          conversations: Array.isArray(c.data) ? c.data.filter(x => x.needs_human || !x.is_read).length : 3,
          orders: Array.isArray(o.data) ? o.data.filter(x => x.status === "pending").length : 2,
          followups: Array.isArray(f.data) ? f.data.filter(x => x.status === "pending").length : 1,
        });
      } catch (err) {
        console.log("Badge fetch error:", err.message);
      }
    }

    fetchBadges();
    const badgeInterval = setInterval(fetchBadges, 60000);
    return () => clearInterval(badgeInterval);
  }, [user, profileId]);

  const userInitials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07070a" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "#6366f1", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚡</div>
          <p style={{ color: "#64748b", fontSize: 13 }}>Loading {businessName}...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={signIn} />;

  const PageComponent = PAGES[page] || OverviewPage;

  function handleNavigate(p) {
    if (trialExpired && p !== "billing") return;
    setPage(p);
    setSidebar(false);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#07070a", color: "#f8fafc" }}>
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
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <TopBar page={page} onMenuClick={() => setSidebar(true)} />
        <main style={{ flex: 1, overflow: "hidden", padding: 24 }}>
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
  );
}