// ------------------------------------------------------------
// Sidebar Component
//
// Main navigation for IncidentFlow.
//
// Supports:
// - expanded mode
// - collapsed mode
// - active page highlighting
// - tooltips while collapsed
// - global collapse / expand button
// - role-based navigation visibility
// ------------------------------------------------------------

import {
  BookOpen,
  Building2,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import Logo from "./Logo";

import {
  useAuth,
} from "../../context/AuthContext";


// ------------------------------------------------------------
// Sidebar props
// ------------------------------------------------------------

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};


// ------------------------------------------------------------
// Navigation item type
//
// allowedRoles is optional.
//
// If it is not provided, the navigation item is visible
// to every authenticated user.
//
// If it is provided, the logged-in user's role must be
// included in the list.
// ------------------------------------------------------------

type NavigationItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  allowedRoles?: string[];
};


// ------------------------------------------------------------
// Navigation
// ------------------------------------------------------------

const navItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },

  {
    label: "Tickets",
    path: "/tickets",
    icon: Ticket,
  },

  {
    label: "Assets",
    path: "/assets",
    icon: Package,
  },

  {
    label: "Organization",
    path: "/organization",
    icon: Building2,
  },

  {
    label: "Users",
    path: "/users",
    icon: Users,
  },

  {
    label: "Reports",
    path: "/reports",
    icon: ChartColumn,
  },

  {
    label: "Knowledge Base",
    path: "/knowledge",
    icon: BookOpen,
  },

  // ----------------------------------------------------------
  // Administration
  //
  // Only IT administrators should see this navigation item.
  //
  // This is only a frontend visibility rule.
  // Backend permissions must still protect administrator
  // endpoints.
  // ----------------------------------------------------------

  {
    label: "Administration",
    path: "/administration",
    icon: ShieldCheck,
    allowedRoles: [
      "it_admin",
    ],
  },

  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];


// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {

  // ----------------------------------------------------------
  // Current authenticated user
  //
  // AuthContext loads this information from GET /auth/me.
  // ----------------------------------------------------------

  const {
    user,
  } = useAuth();


  // ----------------------------------------------------------
  // Filter navigation based on the logged-in user's role.
  //
  // Normal items do not have allowedRoles, so they remain
  // visible.
  //
  // Restricted items are only shown when the user's role is
  // explicitly allowed.
  // ----------------------------------------------------------

  const visibleNavItems =
    navItems.filter(
      (item) => {

        // ----------------------------------------------------
        // No role restriction
        // ----------------------------------------------------

        if (!item.allowedRoles) {
          return true;
        }


        // ----------------------------------------------------
        // A restricted item should never appear until we know
        // who the authenticated user is.
        // ----------------------------------------------------

        if (!user) {
          return false;
        }


        // ----------------------------------------------------
        // Check whether the current role is allowed
        // ----------------------------------------------------

        return item.allowedRoles.includes(
          user.role
        );
      }
    );


  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed
          ? "w-20"
          : "w-64"
      }`}
    >

      {/* ======================================================
          LOGO
      ====================================================== */}

      <div
        className={`border-b border-slate-100 py-5 ${
          collapsed
            ? "px-3"
            : "px-5"
        }`}
      >
        <Logo
          collapsed={collapsed}
        />
      </div>


      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav
        className={`flex-1 space-y-2 overflow-y-auto py-5 ${
          collapsed
            ? "px-3"
            : "px-4"
        }`}
      >

        {visibleNavItems.map(
          (item) => {

            const Icon =
              item.icon;


            return (
              <NavLink
                key={item.path}
                to={item.path}

                // Dashboard should only be active on "/".
                // Other links can remain active on child
                // routes.
                end={
                  item.path === "/"
                }

                title={
                  collapsed
                    ? item.label
                    : undefined
                }

                className={({
                  isActive,
                }) =>
                  `group flex items-center rounded-xl text-sm font-medium transition ${
                    collapsed
                      ? "justify-center px-3 py-3"
                      : "gap-3 px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >

                <Icon
                  size={19}
                  className="shrink-0"
                />


                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

              </NavLink>
            );
          }
        )}

      </nav>


      {/* ======================================================
          COLLAPSE BUTTON
      ====================================================== */}

      <div
        className={`border-t border-slate-200 py-4 ${
          collapsed
            ? "px-3"
            : "px-4"
        }`}
      >

        <button
          type="button"
          onClick={onToggle}

          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }

          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }

          className={`flex w-full items-center rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 ${
            collapsed
              ? "justify-center px-2"
              : "justify-between px-3"
          }`}
        >

          {!collapsed && (
            <span>
              Collapse Sidebar
            </span>
          )}


          {collapsed ? (
            <ChevronRight
              size={18}
            />
          ) : (
            <ChevronLeft
              size={18}
            />
          )}

        </button>

      </div>

    </aside>
  );
}


export default Sidebar;