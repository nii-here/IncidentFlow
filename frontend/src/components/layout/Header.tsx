// ------------------------------------------------------------
// Header Component
// This is the top bar for logged-in pages.
// Later it will show notifications, search, and user profile.
// ------------------------------------------------------------

import { Bell } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Page title area */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Dashboard
        </h2>
        <p className="text-sm text-slate-500">
          Monitor tickets, SLA deadlines, and support activity.
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notification button */}
        <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <Bell size={20} />
        </button>

        {/* User avatar */}
        <Avatar>
          <AvatarFallback>CT</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export default Header;