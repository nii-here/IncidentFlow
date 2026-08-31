// ------------------------------------------------------------
// Organization Settings Types
//
// These types represent organization-wide IncidentFlow
// configuration returned by the backend.
// ------------------------------------------------------------


// ============================================================
// ORGANIZATION SETTINGS
// ============================================================

export type OrganizationSettings = {
  id: number;

  // Controls whether IT technicians can claim eligible
  // unassigned tickets for themselves.
  allow_technician_self_assignment: boolean;

  created_at: string;

  updated_at: string;
};