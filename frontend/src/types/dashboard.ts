// ------------------------------------------------------------
// Dashboard Types
// These describe the shape of dashboard metric data
// returned from the FastAPI backend.
// ------------------------------------------------------------

export type TicketMetrics = {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  archived_tickets: number;
  high_priority_tickets: number;
  medium_priority_tickets: number;
  low_priority_tickets: number;
  overdue_tickets: number;
};