// ------------------------------------------------------------
// Protected Route
//
// Prevents unauthenticated users from accessing private pages.
//
// IMPORTANT:
//
// When the browser refreshes, AuthContext needs a moment to:
//
// 1. Read the saved JWT token.
// 2. Call GET /auth/me.
// 3. Restore the logged-in user.
//
// We must wait for that process to finish before deciding
// whether the user should be redirected to /login.
// ------------------------------------------------------------

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute() {

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();


  // ==========================================================
  // AUTHENTICATION RESTORATION
  // ==========================================================
  //
  // Do NOT redirect while AuthContext is checking the saved
  // token.
  //
  // Without this check, refreshing a protected page causes:
  //
  // token exists
  //      ↓
  // user has not loaded yet
  //      ↓
  // isAuthenticated temporarily becomes false
  //      ↓
  // user incorrectly gets redirected to /login
  //
  // Waiting here prevents that race condition.
  // ==========================================================

  if (isLoading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">

        <div className="text-center">

          <div className="text-lg font-semibold text-slate-900">
            IncidentFlow
          </div>

          <div className="mt-2 text-sm text-slate-500">
            Loading...
          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================
  //
  // At this point authentication restoration has finished.
  //
  // If there is still no authenticated user, redirect them
  // to the login page.
  // ==========================================================

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ==========================================================
  // AUTHENTICATED
  // ==========================================================
  //
  // Authentication is ready and the user is valid.
  // Allow React Router to render the protected page.
  // ==========================================================

  return <Outlet />;
}


export default ProtectedRoute;