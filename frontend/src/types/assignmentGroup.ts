// ------------------------------------------------------------
// Assignment Group Types
//
// These types match the data returned by FastAPI.
// ------------------------------------------------------------

export type AssignmentGroup = {
  id: number;
  name: string;
  description: string | null;
  manager_id: number | null;
  active: boolean;
  archived_at: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type AssignmentGroupCreate = {
  name: string;
  description?: string;
  manager_id?: number | null;
  display_order?: number;
};

export type AssignmentGroupUpdate = {
  name?: string;
  description?: string;
  manager_id?: number | null;
  display_order?: number;
  active?: boolean;
};