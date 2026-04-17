import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
//import OverviewPage from "./pages/OverviewPage";
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
  settings: SettingsPage, // ADD THIS LINE
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);

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
