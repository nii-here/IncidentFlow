// ------------------------------------------------------------
// Ticket Types
//
// These types match ticket data returned by FastAPI.
// ------------------------------------------------------------


// ============================================================
// REQUESTER
// ============================================================

export type TicketRequester = {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
};


// ============================================================
// SMALL RELATED RECORDS
// ============================================================

export type TicketNamedReference = {
  id: number;
  name: string;
};


export type TicketTechnician = {
  id: number;
  name: string;
  email: string;
};


// ============================================================
// TICKET
// ============================================================

export type Ticket = {
  id: number;

  title: string;
  description: string;

  priority: string;
  status: string;

  // Person who actually needs support
  requester_id: number | null;

  // Full requester information
  requester?: TicketRequester | null;

  category_id: number | null;

  assignment_group_id: number | null;

  // IncidentFlow user who created the ticket
  created_by: number;

  // IT technician assigned to the ticket
  assigned_to: number | null;

  department_id: number | null;

  created_at: string;
  updated_at: string;

  sla_due_at: string | null;

  // When the SLA clock stopped
  sla_completed_at: string | null;

  // When the SLA was breached
  sla_breached_at: string | null;

  // Detailed related information
  category?: TicketNamedReference | null;

  assignment_group?: TicketNamedReference | null;

  department?: TicketNamedReference | null;

  technician?: TicketTechnician | null;
};


// ============================================================
// CREATE TICKET
// ============================================================

export type TicketCreate = {
  title: string;

  description: string;

  priority:
    | "low"
    | "medium"
    | "high";

  requester_id: number | null;

  category_id: number | null;

  assignment_group_id: number | null;
};


// ============================================================
// ATTACHMENTS
// ============================================================

// ------------------------------------------------------------
// Attachment uploader
// ------------------------------------------------------------

export type TicketAttachmentUploader = {
  id: number | null;

  name: string;

  type:
    | "user"
    | "person"
    | "system";
};


// ------------------------------------------------------------
// Attachment returned by FastAPI
//
// Notice that the backend does NOT expose:
// - storage_key
// - stored_filename
// - physical path
// ------------------------------------------------------------

export type TicketAttachment = {
  id: number;

  ticket_id: number;

  // Null when attached directly to the ticket.
  //
  // A number means the file belongs to a
  // conversation entry.
  comment_id: number | null;

  original_filename: string;

  content_type: string;

  // Bytes
  file_size: number;

  uploader: TicketAttachmentUploader;

  created_at: string;
};


// ============================================================
// TICKET CONVERSATION
// ============================================================

// ------------------------------------------------------------
// Conversation author
// ------------------------------------------------------------

export type TicketCommentAuthor = {
  id: number | null;

  name: string;

  type:
    | "user"
    | "person"
    | "system";
};


// ------------------------------------------------------------
// One message in the ticket conversation
//
// Messages may come from:
// - an IncidentFlow user
// - a requester/person
// - email later
// - the system later
//
// Each message can also contain attachments.
// ------------------------------------------------------------

export type TicketComment = {
  id: number;

  ticket_id: number;

  // IncidentFlow user author
  user_id: number | null;

  // Requester/person author
  person_id: number | null;

  comment: string;

  visibility:
    | "internal"
    | "public";

  source:
    | "portal"
    | "email"
    | "system";

  // Real author information returned by backend
  author: TicketCommentAuthor;

  // Files attached to this conversation entry
  attachments: TicketAttachment[];

  created_at: string;
};


// ------------------------------------------------------------
// Data used when creating a conversation entry
//
// File objects are browser-side objects, so they are
// not returned by the backend.
// ------------------------------------------------------------

export type TicketCommentCreate = {
  comment: string;

  visibility:
    | "internal"
    | "public";

  files?: File[];
};

// ============================================================
// TICKET HISTORY
// ============================================================

// ------------------------------------------------------------
// User who performed a ticket activity
// ------------------------------------------------------------

export type TicketHistoryActor = {
  id: number;
  name: string;
};


// ------------------------------------------------------------
// One ticket audit/activity event
// ------------------------------------------------------------

export type TicketHistory = {
  id: number;

  ticket_id: number;

  changed_by: number;

  actor: TicketHistoryActor;

  action: string;

  // Raw audit values
  old_value: string | null;
  new_value: string | null;

  // Human-readable values returned by FastAPI
  old_display_value: string | null;
  new_display_value: string | null;

  created_at: string;
};