// ------------------------------------------------------------
// AppLayout
//
// Wraps every protected IncidentFlow page.
//
// Provides:
// - global sidebar
// - global header
// - page content
//
// Sidebar collapse state lives here so it works across
// every page in the application.
// ------------------------------------------------------------

import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";


// ------------------------------------------------------------
// Local storage key
//
// This remembers the user's sidebar preference even
// after changing pages or refreshing the browser.
// ------------------------------------------------------------

const SIDEBAR_STORAGE_KEY =
  "incidentflow-sidebar-collapsed";


function AppLayout() {

  // ----------------------------------------------------------
  // Sidebar state
  //
  // Read the saved value the first time AppLayout loads.
  // ----------------------------------------------------------

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState<boolean>(() => {
    const savedValue =
      localStorage.getItem(
        SIDEBAR_STORAGE_KEY
      );

    return savedValue === "true";
  });


  // ----------------------------------------------------------
  // Toggle sidebar
  // ----------------------------------------------------------

  function handleToggleSidebar() {
    setSidebarCollapsed(
      (currentValue) => {
        const newValue =
          !currentValue;

        localStorage.setItem(
          SIDEBAR_STORAGE_KEY,
          String(newValue)
        );

        return newValue;
      }
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">

      <div className="flex min-h-screen">

        {/* ====================================================
            LEFT SIDEBAR
        ==================================================== */}

        <Sidebar
          collapsed={
            sidebarCollapsed
          }
          onToggle={
            handleToggleSidebar
          }
        />


        {/* ====================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="flex min-w-0 flex-1 flex-col">

          <Header />


          {/* --------------------------------------------------
              Page content
              
              min-w-0 is important because it allows the
              content area to properly expand and shrink when
              the sidebar changes width.
              
              max-w-[1600px] gives IncidentFlow more usable
              horizontal space on large screens.
          -------------------------------------------------- */}

          <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-8 lg:px-8">
            <Outlet />
          </main>

        </div>

      </div>

    </div>
  );
}

export default AppLayout;