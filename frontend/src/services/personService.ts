// ------------------------------------------------------------
// Person Service
//
// Handles API requests for people in the organization.
// ------------------------------------------------------------

import axios from "axios";

import api from "./api";

import type { Requester } from "../types/user";


// ------------------------------------------------------------
// Data required when creating a person
// ------------------------------------------------------------
export type PersonCreate = {
  name: string;
  email: string;
  department_id: number | null;
};


// ------------------------------------------------------------
// Create a new employee/contact
// ------------------------------------------------------------
export async function createPerson(
  personData: PersonCreate
): Promise<Requester> {
  try {
    const response = await api.post<Requester>(
      "/people/",
      personData
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 401) {
        throw new Error(
          "SESSION_EXPIRED"
        );
      }

      if (status === 400) {
        throw new Error(
          typeof detail === "string"
            ? detail
            : "Employee could not be added."
        );
      }
    }

    throw new Error(
      "Employee could not be added."
    );
  }
}