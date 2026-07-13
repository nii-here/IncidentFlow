// ------------------------------------------------------------
// AppLayout
// This layout wraps every protected page.
//
// It gives the app:
// • Sidebar
// • Header
// • Main content area
// ------------------------------------------------------------

import { Outlet } from "react-router-dom";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* Left sidebar navigation */}
        <Sidebar />

        {/* Right side of the app */}
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />

          {/* Page content area */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;