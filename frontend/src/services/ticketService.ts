// ------------------------------------------------------------
// Ticket Service
// This file holds ticket-related API calls.
// ------------------------------------------------------------

import api from "./api";

import type { Ticket } from "../types/ticket";

// Gets all tickets from the FastAPI backend
export async function getTickets(): Promise<Ticket[]> {
  const response = await api.get<Ticket[]>("/tickets/");

  return response.data;
}