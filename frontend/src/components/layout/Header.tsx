// ------------------------------------------------------------
// Header Component
//
// Global top bar displayed on every protected page.
//
// The header uses the authenticated user from AuthContext
// instead of hardcoded profile information.
// ------------------------------------------------------------

import {
  Bell,
} from "lucide-react";

import {
  useAuth,
} from "../../context/AuthContext";


// ============================================================
// HEADER
// ============================================================

function Header() {

  // ----------------------------------------------------------
  // Current authenticated user
  // ----------------------------------------------------------

  const {
    user,
  } = useAuth();


  // ----------------------------------------------------------
  // Build initials from the user's real name.
  //
  // Examples:
  //
  // Clement Tetteh
  // -> CT
  //
  // Test Technician
  // -> TT
  //
  // Clement
  // -> C
  // ----------------------------------------------------------

  const initials =
    getInitials(
      user?.name
    );


  return (
    <header className="flex h-[72px] shrink-0 items-center justify-end border-b border-slate-200 bg-white px-6">

      {/* ======================================================
          RIGHT SIDE ACTIONS
      ====================================================== */}

      <div className="flex items-center gap-4">

        {/* ----------------------------------------------------
            NOTIFICATIONS
        ---------------------------------------------------- */}

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >

          <Bell
            size={20}
          />

        </button>


        {/* ----------------------------------------------------
            CURRENT USER AVATAR
        ---------------------------------------------------- */}

        <div
          title={
            user?.name ??
            "User"
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold uppercase text-slate-700"
        >
          {initials}
        </div>

      </div>

    </header>
  );
}


// ============================================================
// GET USER INITIALS
// ============================================================

function getInitials(
  name?: string
) {

  // ----------------------------------------------------------
  // Safe fallback while user information is loading
  // ----------------------------------------------------------

  if (!name) {
    return "?";
  }


  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (
    words.length === 0
  ) {
    return "?";
  }


  // ----------------------------------------------------------
  // One-word name
  //
  // Clement -> C
  // ----------------------------------------------------------

  if (
    words.length === 1
  ) {
    return words[0]
      .charAt(0)
      .toUpperCase();
  }


  // ----------------------------------------------------------
  // Multiple words
  //
  // Test Technician -> TT
  // Clement Tetteh -> CT
  //
  // Use first and last name so middle names do not affect it.
  // ----------------------------------------------------------

  const firstInitial =
    words[0]
      .charAt(0)
      .toUpperCase();


  const lastInitial =
    words[
      words.length - 1
    ]
      .charAt(0)
      .toUpperCase();


  return (
    firstInitial +
    lastInitial
  );
}


export default Header;