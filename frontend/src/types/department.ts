// ------------------------------------------------------------
// Department Type
//
// Represents company departments returned by IncidentFlow.
// ------------------------------------------------------------

export type Department = {
  id: number;
  name: string;

  active: boolean;
  archived_at: string | null;

  created_at: string;
  updated_at: string;
};