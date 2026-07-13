// ------------------------------------------------------------
// Ticket Types
// These types match the ticket data returned by FastAPI.
// ------------------------------------------------------------

export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_by: number;
  assigned_to: number | null;
  department_id: number | null;
  created_at: string;
  sla_due_at: string | null;
};