// ----------------------------------------------------------------
// Login Page
// This page lets users log in with email and password.
// It sends the login request to the FastAPI backend.
// ----------------------------------------------------------------

import { useAuth } from "../context/AuthContext";
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function LoginPage() {
  // Gives us access to the global login function
  const { login } = useAuth();

  // Stores what the user types into the email box
  const [email, setEmail] = useState("");

  // Stores what the user types into the password box
  const [password, setPassword] = useState("");

  // Stores error messages if login fails
  const [error, setError] = useState("");

  // Lets us move the user to another page after login
  const navigate = useNavigate();

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    try {
      // FastAPI OAuth2 login expects form data, not JSON
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      console.log("LOGIN RESPONSE:", response.data);
      // Save JWT token in browser storage
      login(response.data.access_token);

      // Send user to dashboard
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900">IncidentFlow</h1>

        <p className="mt-2 text-slate-500">
          Sign in to manage IT support tickets.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="clement@test.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password123"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;