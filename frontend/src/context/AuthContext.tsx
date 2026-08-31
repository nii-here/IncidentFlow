// ------------------------------------------------------------
// Auth Context
//
// Stores authentication information for IncidentFlow.
//
// The context keeps track of:
//
// - JWT access token
// - currently logged-in user
// - authentication state
// - initial authentication loading state
// - login
// - logout
//
// When the browser refreshes, the saved token is checked
// against GET /auth/me so the frontend can restore the
// current user's information and role.
// ------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthUser,
} from "../types/auth";

import {
  getCurrentUser,
} from "../services/userService";


// ============================================================
// AUTH CONTEXT TYPE
// ============================================================

type AuthContextType = {
  token: string | null;

  user: AuthUser | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  login: (
    token: string
  ) => Promise<void>;

  logout: () => void;
};


// ============================================================
// AUTH CONTEXT
// ============================================================

const AuthContext =
  createContext<AuthContextType | null>(
    null
  );


// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  // ----------------------------------------------------------
  // Token
  //
  // Read the saved token once when the app starts.
  // ----------------------------------------------------------

  const [
    token,
    setToken,
  ] = useState<string | null>(() => {
    return localStorage.getItem(
      "token"
    );
  });


  // ----------------------------------------------------------
  // Current logged-in user
  // ----------------------------------------------------------

  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    null
  );


  // ----------------------------------------------------------
  // Initial authentication loading state
  //
  // This prevents the app from briefly treating the user
  // as logged out while /auth/me is still loading.
  // ----------------------------------------------------------

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  // ==========================================================
  // RESTORE CURRENT USER
  // ==========================================================
  //
  // When IncidentFlow starts:
  //
  // 1. Check whether a token exists.
  // 2. If no token exists, authentication is finished.
  // 3. If a token exists, call /auth/me.
  // 4. If /auth/me succeeds, restore the user.
  // 5. If it fails, remove the invalid/expired token.
  // ==========================================================

  useEffect(() => {

    async function restoreUser() {

      // ------------------------------------------------------
      // No saved token
      // ------------------------------------------------------

      if (!token) {
        setUser(null);
        setIsLoading(false);

        return;
      }


      try {

        // ----------------------------------------------------
        // Ask the backend who owns this token
        // ----------------------------------------------------

        const currentUser =
          await getCurrentUser();

        setUser(
          currentUser
        );

      } catch (error) {

        console.error(
          "Failed to restore authenticated user.",
          error
        );


        // ----------------------------------------------------
        // Token may be expired, invalid, or belong to an
        // account that can no longer access IncidentFlow.
        //
        // Remove it so the application returns to a clean
        // logged-out state.
        // ----------------------------------------------------

        localStorage.removeItem(
          "token"
        );

        setToken(null);

        setUser(null);

      } finally {

        setIsLoading(false);
      }
    }


    restoreUser();

  }, [token]);


  // ==========================================================
  // LOGIN
  // ==========================================================
  //
  // LoginPage receives an access token from /auth/login.
  //
  // We save the token first because the Axios interceptor
  // reads it from localStorage when /auth/me is called.
  // ==========================================================

  async function login(
    newToken: string
  ) {

    setIsLoading(true);


    // --------------------------------------------------------
    // Save token
    // --------------------------------------------------------

    localStorage.setItem(
      "token",
      newToken
    );

    setToken(
      newToken
    );


    try {

      // ------------------------------------------------------
      // Immediately load the logged-in user's profile
      // ------------------------------------------------------

      const currentUser =
        await getCurrentUser();

      setUser(
        currentUser
      );

    } catch (error) {

      console.error(
        "Failed to load user after login.",
        error
      );


      // ------------------------------------------------------
      // If we received a token but cannot validate it,
      // clean everything up instead of leaving the app in a
      // partially authenticated state.
      // ------------------------------------------------------

      localStorage.removeItem(
        "token"
      );

      setToken(null);

      setUser(null);

      throw error;

    } finally {

      setIsLoading(false);
    }
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {

    localStorage.removeItem(
      "token"
    );

    setToken(null);

    setUser(null);
  }


  // ==========================================================
  // AUTHENTICATED STATE
  // ==========================================================
  //
  // A token by itself is not enough.
  //
  // IncidentFlow considers the frontend authenticated after
  // we also successfully loaded the user from /auth/me.
  // ==========================================================

  const isAuthenticated =
    Boolean(
      token &&
      user
    );


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// ============================================================
// AUTH HOOK
// ============================================================

export function useAuth() {

  const context =
    useContext(AuthContext);


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }


  return context;
}