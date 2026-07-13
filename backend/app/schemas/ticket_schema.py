# app/schemas/ticket_schema.py

# Pydantic BaseModel import
from pydantic import BaseModel
from datetime import datetime

# Used to restrict status values to specific allowed options
from typing import Literal

# --------------------------------------------------
# Schema used when creating a ticket
# --------------------------------------------------
class TicketCreate(BaseModel):

    # Ticket title
    title: str

    # Ticket issue description
    description: str

    # Ticket priority must be one of these values:
    # Example:
    # low = not urgent, medium = normal priority, high = urgent issue
    priority: Literal["low", "medium", "high"]

    # Ticket category
    category: str | None = None

    # Assignment group responsible for this ticket
    assignment_group: str | None = None


# --------------------------------------------------
# Schema used when returning ticket data
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

    # User ID that created the ticket
    created_by: int

    # User ID of assigned IT staff/admin
    assigned_to: int | None

    # Department this ticket belongs to
    department_id: int | None

    # Ticket creation timestamp
    created_at: datetime

    # SLA deadline for resolving the ticket
    sla_due_at: datetime | None

    # Ticket category
    category: str | None 

    # Assignment group responsible for this ticket
    assignment_group: str | None


    # --------------------------------------------------
    # Allows compatibility with SQLAlchemy models
    # --------------------------------------------------
    class Config:
        from_attributes = True

# --------------------------------------------------
# Schema used for updating ticket status
# Only these exact values are allowed
# --------------------------------------------------
class TicketStatusUpdate(BaseModel):

    # Ticket status must be one of these values:
    # open = newly submitted
    # in_progress = IT is working on it
    # resolved = issue fixed
    # closed = completed/finalized
    status: Literal["open", "in_progress", "resolved", "closed"]

# --------------------------------------------------
# Schema used for assigning a ticket to an IT user
# --------------------------------------------------
class TicketAssignUpdate(BaseModel):

    # User ID of the IT staff/admin assigned to the ticket
    assigned_to: int

# --------------------------------------------------
# Schema used when adding a comment to a ticket
# --------------------------------------------------
class TicketCommentCreate(BaseModel):

    # Comment text/note
    comment: str

# --------------------------------------------------
# Schema used when returning ticket comments
# --------------------------------------------------
class TicketCommentResponse(BaseModel):

    # Comment ID
    id: int

    # Ticket ID this comment belongs to
    ticket_id: int

    # User ID who wrote the comment
    user_id: int

    # Comment text
    comment: str

    # Comment creation timestamp
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------
# Schema used when returning ticket history records
# ---------------------------------------------------
class TicketHistoryResponse(BaseModel):
    # History record ID
    id: int

    # Ticket ID this history belongs to
    ticket_id: int 

    # User ID who made the change 
    changed_by: int 

    # Action that happened 
    # Example: status_changed, assigned, archived, comment_added
    action: str

    # Value before the change 
    old_value: str | None

    # Value after the change
    new_value: str | None

    # When the history record was created
    created_at: datetime

    class Config:
        from_attributes = True