// ------------------------------------------------------------
// App Routes
//
// Defines public and protected frontend pages.
//
// Route protection:
//
// ProtectedRoute
// - requires authentication
//
// AdminRoute
// - requires role = it_admin
// ------------------------------------------------------------

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";

import AdministrationPage from "./pages/AdministrationPage";
import CategoriesPage from "./pages/CategoriesPage";
import AssignmentGroupsPage from "./pages/AssignmentGroupsPage";

import AppLayout from "./layouts/AppLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />


        {/* ==================================================
            AUTHENTICATED ROUTES
        ==================================================
            
            Everything inside ProtectedRoute requires
            a valid logged-in user.
        ================================================== */}

        <Route
          element={<ProtectedRoute />}
        >

          <Route
            path="/"
            element={<AppLayout />}
          >

            {/* ==============================================
                DASHBOARD
            ============================================== */}

            <Route
              index
              element={
                <DashboardPage />
              }
            />


            {/* ==============================================
                TICKETS
            ============================================== */}

            <Route
              path="tickets"
              element={
                <TicketsPage />
              }
            />


            <Route
              path="tickets/:ticketId"
              element={
                <TicketDetailPage />
              }
            />


            {/* ==============================================
                ADMINISTRATION
            ==============================================
                
                These pages require:
                
                1. authenticated user
                2. role = it_admin
                
                Hiding Administration in the sidebar is not
                enough. AdminRoute also protects the actual
                URLs.
            ============================================== */}

            <Route
              element={<AdminRoute />}
            >

              <Route
                path="administration"
                element={
                  <AdministrationPage />
                }
              />


              <Route
                path="administration/categories"
                element={
                  <CategoriesPage />
                }
              />


              <Route
                path="administration/assignment-groups"
                element={
                  <AssignmentGroupsPage />
                }
              />

            </Route>

          </Route>

        </Route>

      </Routes>

    </BrowserRouter>
  );
}


export default App;