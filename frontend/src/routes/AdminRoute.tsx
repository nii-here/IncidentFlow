// ------------------------------------------------------------
// Admin Route
//
// Protects frontend pages that should only be accessible
// to IncidentFlow IT administrators.
//
// This is frontend route protection only.
//
// Backend admin endpoints must still enforce their own
// permissions.
// ------------------------------------------------------------

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";


// ============================================================
// ADMIN ROUTE
// ============================================================

function AdminRoute() {

  const {
    user,
    isLoading,
  } = useAuth();


  // ----------------------------------------------------------
  // Wait until AuthContext finishes restoring the user.
  //
  // Without this, refreshing an admin page could briefly
  // redirect the user before /auth/me finishes loading.
  // ----------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Loading...
        </p>
      </div>
    );
  }


  // ----------------------------------------------------------
  // Only IT administrators can continue.
  //
  // If an IT staff member manually types:
  //
  // /administration
  //
  // they are redirected back to the dashboard.
  // ----------------------------------------------------------

  if (
    !user ||
    user.role !== "it_admin"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  return <Outlet />;
}


export default AdminRoute;