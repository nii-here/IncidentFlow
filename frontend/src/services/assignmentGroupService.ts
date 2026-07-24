// --------------------------------------------------
// Assignment Group Service
//
// Handles all API requests for Assignment Groups.
// --------------------------------------------------

import api from "./api";

import type {
    AssignmentGroup,
    AssignmentGroupCreate,
    AssignmentGroupUpdate,
} from "../types/assignmentGroup";

// ---------------------------------------------------
// Get active assignment groups
// ---------------------------------------------------
export async function getAssignmentGroups() {
    const response = await api.get<AssignmentGroup[]>(
        "/assignment-groups/"
    );

    return response.data;
}

// --------------------------------------------------
// Get archived assignment groups
// --------------------------------------------------
export async function getArchivedAssignmentGroups() {
    const response = await api.get<AssignmentGroup[]>(
        "/assignment-groups/archived"
    );

    return response.data;
}

// ---------------------------------------------------
// Create assignment group
// ---------------------------------------------------
export async function createAssignmentGroup(
    data: AssignmentGroupCreate
) {
    const response = await api.post<AssignmentGroup>(
        "/assignment-groups",
        data
    );

    return response.data;
}

// ---------------------------------------------------
// Update assignment group
// ---------------------------------------------------
export async function updateAssignmentGroup(
    id: number,
    data: AssignmentGroupUpdate
) {
    const response = await api.put<AssignmentGroup>(
        `/assignment-groups/${id}`,
        data
    );

    return response.data;
}

// ----------------------------------------------------
// Activate or Deactivate assignment group
// ----------------------------------------------------
export async function updateAssignmentGroupStatus(
    id: number,
    active: boolean
) {
    const response = await api.patch<AssignmentGroup>(
        `/assignment-groups/${id}/status`,
        null,
        {
            params: { active },
        }
    );

    return response.data;
}

// ----------------------------------------------------
// Archive assignment group
// ----------------------------------------------------
export async function archiveAssignmentGroup(
    id: number
) {
    const response = await api.patch<AssignmentGroup>(
        `/assignment-groups/${id}/archive`
    );

    return response.data;
}

// -----------------------------------------------------
// Restore assignment group
// -----------------------------------------------------
export async function restoreAssignmentGroup(
    id: number
) {
    const response = await api.patch<AssignmentGroup>(
        `/assignment-groups/${id}/restore`
    );

    return response.data;
}