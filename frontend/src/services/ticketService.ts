// ------------------------------------------------------------
// Ticket Service
//
// Holds ticket-related API calls.
//
// Components and pages should use this file instead of
// calling Axios directly.
// ------------------------------------------------------------

import api from "./api";

import type {
  Ticket,
  TicketCreate,
  TicketComment,
  TicketAttachment,
  TicketHistory,
} from "../types/ticket";


// ============================================================
// TICKET RETRIEVAL
// ============================================================

export async function getTickets(
  view: string = "all"
): Promise<Ticket[]> {

  const response = await api.get<Ticket[]>(
    "/tickets/",
    {
      params: {
        view,
      },
    }
  );

  return response.data;
}


// ------------------------------------------------------------
// Get one ticket
// ------------------------------------------------------------

export async function getTicket(
  ticketId: number
): Promise<Ticket> {

  const response =
    await api.get<Ticket>(
      `/tickets/${ticketId}`
    );

  return response.data;
}


// ============================================================
// TICKET CREATION
// ============================================================

export async function createTicket(
  values: TicketCreate
): Promise<Ticket> {

  const response =
    await api.post<Ticket>(
      "/tickets/",
      values
    );

  return response.data;
}


// ============================================================
// TICKET ASSIGNMENT
// ============================================================

export async function updateTicketAssignmentGroup(
  ticketId: number,
  assignmentGroupId: number | null
): Promise<Ticket> {

  const response =
    await api.patch<Ticket>(
      `/tickets/${ticketId}/assignment-group`,
      {
        assignment_group_id:
          assignmentGroupId,
      }
    );

  return response.data;
}


// ------------------------------------------------------------
// Assign / unassign technician
// ------------------------------------------------------------

export async function updateTicketTechnician(
  ticketId: number,
  technicianId: number | null
): Promise<Ticket> {

  const response =
    await api.patch<Ticket>(
      `/tickets/${ticketId}/assign`,
      {
        assigned_to:
          technicianId,
      }
    );

  return response.data;
}

// ------------------------------------------------------------
// Claim ticket
//
// Allows an eligible IT technician to assign an
// unassigned group ticket to themselves.
//
// The backend remains responsible for checking:
//
// - organization self-assignment policy
// - technician role
// - assignment group membership
// - current ticket assignment
// - archived state
// ------------------------------------------------------------

export async function claimTicket(
  ticketId: number
): Promise<Ticket> {

  const response =
    await api.patch<Ticket>(
      `/tickets/${ticketId}/claim`
    );

  return response.data;
}

// ============================================================
// TICKET PRIORITY
// ============================================================

export async function updateTicketPriority(
  ticketId: number,
  priority:
    | "low"
    | "medium"
    | "high"
): Promise<Ticket> {

  const response =
    await api.patch<Ticket>(
      `/tickets/${ticketId}/priority`,
      {
        priority,
      }
    );

  return response.data;
}


// ============================================================
// TICKET STATUS
// ============================================================

export async function updateTicketStatus(
  ticketId: number,
  status:
    | "open"
    | "in_progress"
    | "resolved"
    | "closed"
): Promise<Ticket> {

  const response =
    await api.patch<Ticket>(
      `/tickets/${ticketId}/status`,
      {
        status,
      }
    );

  return response.data;
}


// ============================================================
// TICKET CONVERSATION
// ============================================================

export async function getTicketComments(
  ticketId: number
): Promise<TicketComment[]> {

  const response =
    await api.get<TicketComment[]>(
      `/tickets/${ticketId}/comments`
    );

  return response.data;
}


// ------------------------------------------------------------
// Add conversation entry
//
// No files:
// → JSON comments endpoint
//
// Files:
// → multipart conversation endpoint
// ------------------------------------------------------------

export async function addTicketComment(
  ticketId: number,
  comment: string,
  visibility:
    | "internal"
    | "public",
  files: File[] = []
): Promise<TicketComment> {

  // ----------------------------------------------------------
  // No attachments
  // ----------------------------------------------------------

  if (files.length === 0) {

    const response =
      await api.post<TicketComment>(
        `/tickets/${ticketId}/comments`,
        {
          comment,
          visibility,
        }
      );

    return response.data;
  }


  // ----------------------------------------------------------
  // Multipart request
  // ----------------------------------------------------------

  const formData =
    new FormData();

  formData.append(
    "comment",
    comment
  );

  formData.append(
    "visibility",
    visibility
  );


  // ----------------------------------------------------------
  // Every attachment uses the same field:
  //
  // files
  // ----------------------------------------------------------

  for (const file of files) {
    formData.append(
      "files",
      file
    );
  }


  const response =
    await api.post<TicketComment>(
      `/tickets/${ticketId}/conversation`,
      formData
    );

  return response.data;
}


// ============================================================
// TICKET ATTACHMENTS
// ============================================================

// ------------------------------------------------------------
// Get every attachment available for the ticket
// ------------------------------------------------------------

export async function getTicketAttachments(
  ticketId: number
): Promise<TicketAttachment[]> {

  const response =
    await api.get<TicketAttachment[]>(
      `/ticket-attachments/tickets/${ticketId}`
    );

  return response.data;
}


// ------------------------------------------------------------
// Get attachment data for preview
//
// IMPORTANT:
//
// We return the Blob instead of opening a new browser tab.
//
// AttachmentPreviewModal decides how the Blob should be
// displayed.
//
// Authorization still goes through our Axios API instance.
// ------------------------------------------------------------

export async function previewTicketAttachment(
  attachmentId: number
): Promise<Blob> {

  const response =
    await api.get<Blob>(
      `/ticket-attachments/${attachmentId}/download`,
      {
        responseType: "blob",
      }
    );

  return response.data;
}


// ------------------------------------------------------------
// Download attachment
// ------------------------------------------------------------

export async function downloadTicketAttachment(
  attachmentId: number,
  filename: string
): Promise<void> {

  const response =
    await api.get<Blob>(
      `/ticket-attachments/${attachmentId}/download`,
      {
        responseType: "blob",
      }
    );


  const blobUrl =
    URL.createObjectURL(
      response.data
    );


  const link =
    document.createElement(
      "a"
    );

  link.href =
    blobUrl;

  link.download =
    filename;


  document.body.appendChild(
    link
  );

  link.click();

  link.remove();


  URL.revokeObjectURL(
    blobUrl
  );
}

// ============================================================
// TICKET HISTORY
// ============================================================

// ------------------------------------------------------------
// Get the audit/activity history for one ticket
// ------------------------------------------------------------

export async function getTicketHistory(
  ticketId: number
): Promise<TicketHistory[]> {

  const response =
    await api.get<TicketHistory[]>(
      `/tickets/${ticketId}/history`
    );

  return response.data;
}