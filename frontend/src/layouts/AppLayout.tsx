// ------------------------------------------------------------
// AppLayout
// This layout wraps the logged-in part of the application.
// It gives every protected page the same sidebar and header.
// ------------------------------------------------------------

import { Outlet } from "react-router-dom";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        {/* Left navigation */}
        <Sidebar />

        {/* Main app area */}
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />

          {/* Page content changes here based on the route */}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;