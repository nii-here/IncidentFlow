// ------------------------------------------------------------
// Category Types
// These match the category data returned by FastAPI.
// ------------------------------------------------------------

export type Category = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CategoryCreate = {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
};