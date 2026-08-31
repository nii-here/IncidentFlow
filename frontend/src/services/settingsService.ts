// ------------------------------------------------------------
// Settings Service
//
// Handles organization-wide IncidentFlow settings.
// ------------------------------------------------------------

import api from "./api";

import type {
  OrganizationSettings,
} from "../types/settings";


// ============================================================
// GET ORGANIZATION SETTINGS
// ============================================================

export async function getOrganizationSettings():
  Promise<OrganizationSettings> {

  const response =
    await api.get<OrganizationSettings>(
      "/settings/"
    );

  return response.data;
}