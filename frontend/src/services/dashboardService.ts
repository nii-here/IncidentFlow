// ------------------------------------------------------------
// Dashboard Service
// This file holds dashboard-related API calls.
// Pages should call this file instead of calling Axios directly.
// ------------------------------------------------------------

import api from "./api";
import type { TicketMetrics } from "../types/dashboard";

// Get ticket summary metrics from the backend
export async function getTicketMetrics(): Promise<TicketMetrics> {
  const response = await api.get<TicketMetrics>("/tickets/metrics/summary");

  return response.data;
}