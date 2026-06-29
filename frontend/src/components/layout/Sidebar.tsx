// ------------------------------------------------------------
// Sidebar Component
// This is the left navigation menu for the app.
// It helps users move between Dashboard, Tickets, Users, etc.
// ------------------------------------------------------------

import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  Settings,
} from "lucide-react";

import { Link } from "react-router-dom";
import Logo from "./Logo";

// Navigation items shown in the sidebar
const navItems = [
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
    label: "Departments",
    path: "/departments",
    icon: Building2,
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r bg-white px-5 py-6 lg:block">
      {/* App logo */}
      <Logo />

      {/* Navigation menu */}
      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;