// ------------------------------------------------------------
// Header Component
// This is the top bar displayed on every protected page.
//
// It should not repeat the page title.
// The page itself will handle its own title.
// ------------------------------------------------------------

import { Bell } from "lucide-react";

function Header() {
  return (
    <header className="flex h-16 items-center justify-end border-b bg-white px-6">
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notification button */}
        <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <Bell size={20} />
        </button>

        {/* Temporary user avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          CT
        </div>
      </div>
    </header>
  );
}

export default Header;