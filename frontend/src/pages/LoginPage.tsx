// ----------------------------------------------------------------
// Login Page
//
// Allows users to sign in to IncidentFlow.
//
// Login flow:
//
// 1. Send email/password to FastAPI.
// 2. Receive JWT access token.
// 3. AuthContext saves the token.
// 4. AuthContext loads GET /auth/me.
// 5. Only after the current user is loaded do we navigate
//    into the protected application.
// ----------------------------------------------------------------

import {
  useState,
  type SubmitEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import api from "../services/api";


// ============================================================
// LOGIN PAGE
// ============================================================

function LoginPage() {

  // ----------------------------------------------------------
  // Global authentication
  // ----------------------------------------------------------

  const {
    login,
  } = useAuth();


  // ----------------------------------------------------------
  // Form values
  // ----------------------------------------------------------

  const [
    email,
    setEmail,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  // ----------------------------------------------------------
  // Error message
  // ----------------------------------------------------------

  const [
    error,
    setError,
  ] = useState("");


  // ----------------------------------------------------------
  // Prevent multiple login requests while signing in
  // ----------------------------------------------------------

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------

  const navigate =
    useNavigate();


  // ==========================================================
  // LOGIN
  // ==========================================================

  async function handleLogin(
    event: SubmitEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    if (isSubmitting) {
      return;
    }


    setError("");

    setIsSubmitting(true);


    try {

      // ------------------------------------------------------
      // FastAPI OAuth2PasswordRequestForm expects form data.
      //
      // The backend calls the field "username", but
      // IncidentFlow treats it as the user's email.
      // ------------------------------------------------------

      const formData =
        new URLSearchParams();


      formData.append(
        "username",
        email
      );


      formData.append(
        "password",
        password
      );


      // ------------------------------------------------------
      // Authenticate with backend
      // ------------------------------------------------------

      const response =
        await api.post(
          "/auth/login",
          formData,
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );


      // ------------------------------------------------------
      // IMPORTANT:
      //
      // Wait for AuthContext to:
      //
      // - save the token
      // - call /auth/me
      // - load the real user
      //
      // before navigating.
      //
      // Without await, the app can navigate while user is
      // still null, which caused the login-twice behavior.
      // ------------------------------------------------------

      await login(
        response.data.access_token
      );


      // ------------------------------------------------------
      // Authentication is now fully ready
      // ------------------------------------------------------

      navigate(
        "/",
        {
          replace: true,
        }
      );

    } catch (loginError) {

      console.error(
        "Login failed.",
        loginError
      );


      setError(
        "Invalid email or password"
      );

    } finally {

      setIsSubmitting(false);
    }
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-slate-900">
          IncidentFlow
        </h1>


        <p className="mt-2 text-slate-500">
          Sign in to manage IT support tickets.
        </p>


        <form
          onSubmit={
            handleLogin
          }
          className="mt-6 space-y-4"
        >

          {/* ------------------------------------------------
              EMAIL
          ------------------------------------------------ */}

          <div>

            <label className="text-sm font-medium text-slate-700">
              Email
            </label>


            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

          </div>


          {/* ------------------------------------------------
              PASSWORD
          ------------------------------------------------ */}

          <div>

            <label className="text-sm font-medium text-slate-700">
              Password
            </label>


            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

          </div>


          {/* ------------------------------------------------
              ERROR
          ------------------------------------------------ */}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}


          {/* ------------------------------------------------
              SUBMIT
          ------------------------------------------------ */}

          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {isSubmitting
              ? "Signing in..."
              : "Sign In"}

          </button>

        </form>

      </div>

    </div>
  );
}


export default LoginPage;