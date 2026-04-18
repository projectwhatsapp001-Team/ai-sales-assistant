// src/App.jsx
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./components/pages/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import OverviewPage from "./components/pages/OverviewPage";
import ConversationsPage from "./components/pages/ConversationsPage";
import OrdersPage from "./components/pages/OrdersPage";
import FollowUpPage from "./components/pages/FollowUpPage";
import SettingsPage from "./components/pages/SettingsPage";

const PAGES = {
  overview: OverviewPage,
  conversations: ConversationsPage,
  orders: OrdersPage,
  followups: FollowUpPage,
  settings: SettingsPage,
};

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);

  // While Supabase checks for an existing session — show blank dark screen
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0f0d" }}
      >
        <div style={{ color: "#22c55e", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  // No user logged in — show login screen
  if (!user) {
    return <LoginPage onLogin={signIn} />;
  }

  // User is logged in — show the dashboard
  const PageComponent = PAGES[page] || OverviewPage;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0f0d", color: "#e8f5e2" }}
    >
      <Sidebar
        activePage={page}
        onNavigate={(p) => {
          setPage(p);
          setSidebar(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        onSignOut={signOut}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar page={page} onMenuClick={() => setSidebar(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <PageComponent key={page} />
        </main>
      </div>
    </div>
  );
}
