# app/schemas/ticket_schema.py

# --------------------------------------------------
# Pydantic
# --------------------------------------------------

from pydantic import BaseModel, Field

# --------------------------------------------------
# Python
# --------------------------------------------------

from datetime import datetime
from typing import Literal

# --------------------------------------------------
# Attachment schemas
#
# Conversation responses can now include the files
# attached to each conversation entry.
# --------------------------------------------------

from app.schemas.ticket_attachment_schema import (
    TicketAttachmentResponse,
)


# ==================================================
# TICKET CREATION
# ==================================================

# --------------------------------------------------
# Schema used when creating a ticket
# --------------------------------------------------

class TicketCreate(BaseModel):

    # Ticket title
    title: str

    # Ticket issue description
    description: str

    # Ticket priority
    #
    # low    = not urgent
    # medium = normal priority
    # high   = urgent issue
    priority: Literal[
        "low",
        "medium",
        "high",
    ]

    # Person who needs support.
    #
    # A technician can create a ticket on behalf of
    # another employee by selecting their Person ID.
    requester_id: int | None = None

    # Category selected for the ticket
    category_id: int | None = None

    # Assignment group responsible for the ticket
    assignment_group_id: int | None = None


# ==================================================
# TICKET RESPONSE HELPERS
# ==================================================

# --------------------------------------------------
# Lightweight requester information
# --------------------------------------------------

class TicketRequesterResponse(BaseModel):

    id: int
    name: str
    email: str
    department_id: int | None

    class Config:
        from_attributes = True


# --------------------------------------------------
# Small named reference
#
# Used for related records such as:
# - category
# - department
# - assignment group
# --------------------------------------------------

class TicketNamedReferenceResponse(BaseModel):

    id: int
    name: str

    class Config:
        from_attributes = True


# --------------------------------------------------
# Technician information
# --------------------------------------------------

class TicketTechnicianResponse(BaseModel):

    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


# ==================================================
# TICKET RESPONSES
# ==================================================

# --------------------------------------------------
# Schema used when returning basic ticket data
# --------------------------------------------------

class TicketResponse(BaseModel):

    # Ticket ID
    id: int

    # Ticket title
    title: str

    # Ticket description
    description: str

    # Ticket priority
    priority: str

    # Ticket status
    status: str

    # Person who needs support
    requester_id: int | None

    # Category assigned to the ticket
    category_id: int | None

    # Assignment group responsible for the ticket
    assignment_group_id: int | None

    # User account that created the ticket
    created_by: int

    # IT user assigned to the ticket
    assigned_to: int | None

    # Basic information about the assigned technician.
    #
    # This lets ticket lists display a person's name instead
    # of exposing the internal database user ID.
    technician: TicketTechnicianResponse | None = None

    # Department associated with the ticket
    department_id: int | None

    # Ticket creation timestamp
    created_at: datetime

    # Ticket last updated timestamp
    updated_at: datetime

    # SLA deadline
    sla_due_at: datetime | None

    # When the SLA clock stopped
    sla_completed_at: datetime | None

    # When the SLA was first breached
    sla_breached_at: datetime | None

    class Config:
        from_attributes = True


# --------------------------------------------------
# Detailed ticket response
# --------------------------------------------------

class TicketDetailResponse(TicketResponse):

    # Person who needs support
    requester: TicketRequesterResponse

    # Related ticket information
    category: TicketNamedReferenceResponse | None
    assignment_group: TicketNamedReferenceResponse | None
    department: TicketNamedReferenceResponse | None


# ==================================================
# TICKET UPDATES
# ==================================================

# --------------------------------------------------
# Update ticket status
# --------------------------------------------------

class TicketStatusUpdate(BaseModel):

    status: Literal[
        "open",
        "in_progress",
        "resolved",
        "closed",
    ]


# --------------------------------------------------
# Assign or unassign technician
# --------------------------------------------------

class TicketAssignUpdate(BaseModel):

    assigned_to: int | None = None


# --------------------------------------------------
# Change assignment group
#
# None moves the ticket back to Unassigned.
# --------------------------------------------------

class TicketAssignmentGroupUpdate(BaseModel):

    assignment_group_id: int | None = None


# --------------------------------------------------
# Update ticket priority
# --------------------------------------------------

class TicketPriorityUpdate(BaseModel):

    priority: Literal[
        "low",
        "medium",
        "high",
    ]


# ==================================================
# TICKET CONVERSATION
# ==================================================

# --------------------------------------------------
# Create a conversation entry
#
# This schema is still useful for normal JSON-based
# conversation requests.
#
# Our new conversation + attachment endpoint will use
# multipart/form-data because files cannot be sent
# inside a normal JSON request.
#
# The frontend is allowed to choose:
# - comment
# - visibility
#
# The frontend is NOT allowed to choose:
# - user_id
# - person_id
# - source
#
# The backend determines those values so a client
# cannot pretend to be another author or pretend that
# a portal message came from email.
# --------------------------------------------------

class TicketCommentCreate(BaseModel):

    # Conversation text.
    #
    # Prevent blank messages and extremely large
    # accidental submissions.
    comment: str = Field(
        min_length=1,
        max_length=10000,
    )

    # --------------------------------------------------
    # Visibility
    #
    # internal:
    # Only IT staff/admins should see this message.
    #
    # public:
    # Can be shown to the requester.
    #
    # Internal is the safer default.
    # --------------------------------------------------

    visibility: Literal[
        "internal",
        "public",
    ] = "internal"


# --------------------------------------------------
# Conversation author information
#
# Lets the frontend display a real name instead of:
#
# IT User #1
# Requester #2
#
# type tells the frontend where the author came from:
#
# user   = IncidentFlow account
# person = requester/contact
# system = IncidentFlow-generated message
# --------------------------------------------------

class TicketCommentAuthorResponse(BaseModel):

    # User/person ID.
    #
    # System messages may not have an ID.
    id: int | None

    # Name displayed in the conversation timeline.
    name: str

    # Author type
    type: Literal[
        "user",
        "person",
        "system",
    ]


# --------------------------------------------------
# Return a conversation entry
#
# A conversation entry can now include its
# attachments directly.
#
# This means the frontend does not have to:
#
# 1. load comments
# 2. load every attachment separately
# 3. manually figure out which files belong to which
#    comment
#
# Instead, the backend can return one complete
# conversation object.
# --------------------------------------------------

class TicketCommentResponse(BaseModel):

    # Comment ID
    id: int

    # Ticket this conversation entry belongs to
    ticket_id: int

    # --------------------------------------------------
    # IncidentFlow user author
    #
    # Null when written by a requester/person or
    # generated by the system.
    # --------------------------------------------------

    user_id: int | None

    # --------------------------------------------------
    # Requester/person author
    #
    # Null when written by an IncidentFlow user.
    # --------------------------------------------------

    person_id: int | None

    # Message content
    comment: str

    # --------------------------------------------------
    # Visibility
    #
    # internal = IT-only
    # public   = requester-visible
    # --------------------------------------------------

    visibility: Literal[
        "internal",
        "public",
    ]

    # --------------------------------------------------
    # Source
    #
    # portal = IncidentFlow web app
    # email  = email integration
    # system = generated automatically
    # --------------------------------------------------

    source: Literal[
        "portal",
        "email",
        "system",
    ]

    # --------------------------------------------------
    # Display information for the author
    #
    # Example:
    #
    # {
    #     "id": 1,
    #     "name": "Clement",
    #     "type": "user"
    # }
    #
    # This keeps frontend display logic simple.
    # --------------------------------------------------

    author: TicketCommentAuthorResponse

    # --------------------------------------------------
    # Attachments belonging to this conversation entry
    #
    # We reuse TicketAttachmentResponse instead of
    # creating another attachment format.
    #
    # default_factory=list gives every response its
    # own empty list when there are no attachments.
    #
    # This is better than using:
    #
    # attachments = []
    #
    # because mutable default objects should not be
    # shared between model instances.
    # --------------------------------------------------

    attachments: list[
        TicketAttachmentResponse
    ] = Field(
        default_factory=list
    )

    # Creation timestamp
    created_at: datetime

    class Config:
        from_attributes = True


# ==================================================
# TICKET HISTORY
# ==================================================

# --------------------------------------------------
# Person who performed a ticket history action
#
# We return the real user's name so the frontend
# does not have to display something like:
#
# User #1
# --------------------------------------------------

class TicketHistoryActorResponse(BaseModel):

    # IncidentFlow user ID
    id: int

    # Display name
    name: str

    class Config:
        from_attributes = True


# --------------------------------------------------
# Schema used when returning ticket history records
#
# We intentionally keep BOTH:
#
# - old_value / new_value
# - old_display_value / new_display_value
#
# The raw values are useful for auditing.
#
# The display values are useful for humans.
#
# Example:
#
# old_value = "2"
# old_display_value = "Desktop Support"
# --------------------------------------------------

class TicketHistoryResponse(BaseModel):

    # History record ID
    id: int

    # Ticket this event belongs to
    ticket_id: int

    # User ID that performed the action
    changed_by: int

    # Full actor information
    actor: TicketHistoryActorResponse

    # --------------------------------------------------
    # Action type
    #
    # Examples:
    #
    # status_changed
    # priority_changed
    # assigned
    # assignment_group_changed
    # archived
    # comment_added
    # attachment_added
    # --------------------------------------------------

    action: str

    # Raw database values
    old_value: str | None
    new_value: str | None

    # Human-readable versions
    old_display_value: str | None
    new_display_value: str | None

    # When the event happened
    created_at: datetime

    class Config:
        from_attributes = True