// ------------------------------------------------------------
// Department Service
//
// Handles frontend API requests related to departments.
// ------------------------------------------------------------

import api from "./api";

import type { Department } from "../types/department";


// ------------------------------------------------------------
// Get active/non-archived departments
// ------------------------------------------------------------
export async function getDepartments(): Promise<Department[]> {
  const response = await api.get<Department[]>(
    "/departments/"
  );

  return response.data;
}