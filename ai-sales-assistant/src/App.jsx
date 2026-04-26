// src/App.jsx
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import LoginPage from "./components/pages/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import OverviewPage from "./components/pages/OverviewPage";
import ConversationsPage from "./components/pages/ConversationsPage";
import OrdersPage from "./components/pages/OrdersPage";
import FollowUpPage from "./components/pages/FollowUpPage";
import SettingsPage from "./components/pages/SettingsPage";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import BillingPage from "./components/pages/BillingPage";

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

  // ── STATE FROM SUPABASE ──
  const [businessName, setBusinessName] = useState("SalesBot");
  const [userName, setUserName] = useState("Team Lead");
  const [profileId, setProfileId] = useState(null);
  const [badges, setBadges] = useState({ conversations: 3, orders: 2, followups: 1 });
  const [trialExpired, setTrialExpired] = useState(false);

  // ── LOAD PROFILE FROM SUPABASE ──
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, business_name, full_name, trial_ends_at, plan, is_active")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        setBusinessName(profile.business_name || "SalesBot");
        setUserName(profile.full_name || "Team Lead");

        // Check trial
        if (profile.trial_ends_at) {
          const trialEnd = new Date(profile.trial_ends_at);
          setTrialExpired(trialEnd < new Date() && profile.plan === "free");
        }
      }
    }

    loadProfile();
  }, [user]);

  // ── REALTIME SUBSCRIPTION: Listen for profile changes ──
  useEffect(() => {
    if (!user || !profileId) return;

    // Subscribe to changes on THIS user's profile row
    const channel = supabase
      .channel(`profile-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profileId}`,
        },
        (payload) => {
          console.log("Profile updated via realtime:", payload.new);
          const updated = payload.new;
          if (updated.business_name) setBusinessName(updated.business_name);
          if (updated.full_name) setUserName(updated.full_name);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profileId]);

  // ── GET INITIALS ──
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070a" }}>
        <div style={{ color: "#6366f1", fontSize: 13 }}>Loading {businessName}...</div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={signIn} />;

  const PageComponent = PAGES[page] || OverviewPage;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#07070a", color: "#f8fafc" }}>
      <Sidebar
        activePage={page}
        onNavigate={(p) => { setPage(p); setSidebar(false); }}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        onSignOut={signOut}
        businessName={businessName}
        userInitials={userInitials}
        badges={badges}
        trialExpired={trialExpired}
      />
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#07070a" }}>
        <TopBar page={page} onMenuClick={() => setSidebar(true)} />
        <main className="flex-1 overflow-hidden p-6" style={{ background: "#07070a" }}>
          {page === "settings" ? (
            <SettingsPage profileId={profileId} />
          ) : page === "billing" ? (
            <BillingPage profileId={profileId} userEmail={user.email} />
          ) : (
            <PageComponent key={page} />
          )}
        </main>
      </div>
    </div>
  );
}