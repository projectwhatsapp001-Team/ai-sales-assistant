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
import AnalyticsPage from "./components/pages/AnalyticsPage";

const PAGES = {
  overview: OverviewPage,
  conversations: ConversationsPage,
  orders: OrdersPage,
  followups: FollowUpPage,
  settings: SettingsPage,
  analytics: AnalyticsPage,
};

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070a" }}>
        <div style={{ color: "#6366f1", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={signIn} />;
  }

  const PageComponent = PAGES[page] || OverviewPage;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#07070a", color: "#f8fafc" }}>
      <Sidebar
        activePage={page}
        onNavigate={(p) => { setPage(p); setSidebar(false); }}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        onSignOut={signOut}
      />
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#07070a" }}>
        <TopBar page={page} onMenuClick={() => setSidebar(true)} />
        <main className="flex-1 overflow-hidden p-6" style={{ background: "#07070a" }}>
          <PageComponent key={page} />
        </main>
      </div>
    </div>
  );
}