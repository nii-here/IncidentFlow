// ------------------------------------------------------------
// User Service
//
// Handles user-related API requests used throughout
// IncidentFlow.
// ------------------------------------------------------------

import api from "./api";

import type { Requester } from "../types/user";
import type { AuthUser } from "../types/auth";


// ------------------------------------------------------------
// Get the currently logged-in user
//
// The backend reads the bearer token and returns the
// user that owns that token.
//
// This gives the frontend reliable information such as:
//
// - user ID
// - name
// - email
// - role
// - department
// ------------------------------------------------------------

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthUser>(
    "/auth/me"
  );

  return response.data;
}


// ------------------------------------------------------------
// Get available ticket requesters
//
// Requesters are people who need support.
// ------------------------------------------------------------

export async function getRequesters(): Promise<Requester[]> {
  const response = await api.get<Requester[]>(
    "/people/requesters"
  );

  return response.data;
}


// ------------------------------------------------------------
// Get available ticket technicians
//
// Only active IT staff and IT admins are returned
// by the backend.
// ------------------------------------------------------------

export async function getTechnicians(): Promise<Requester[]> {
  const response = await api.get<Requester[]>(
    "/users/technicians"
  );

  return response.data;
}