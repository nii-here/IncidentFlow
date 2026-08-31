// ------------------------------------------------------------
// Requester Type
//
// Represents the lightweight user information needed
// when selecting a requester for a ticket.
// ------------------------------------------------------------

export type Requester = {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
};