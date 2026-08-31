# app/models/ticket.py

# SQLAlchemy column and data type imports
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Ticket database table
#
# Represents an IT support request submitted by an
# IncidentFlow user.
# --------------------------------------------------
class Ticket(Base):

    # SQL table name
    __tablename__ = "tickets"

    # --------------------------------------------------
    # Identity and issue details
    # --------------------------------------------------

    # Ticket ID
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Short summary of the issue
    title = Column(
        String,
        nullable=False,
    )

    # Detailed explanation of the issue
    description = Column(
        Text,
        nullable=False,
    )

    # --------------------------------------------------
    # Classification
    # --------------------------------------------------

    # Ticket priority
    #
    # Supported values for version one:
    # low, medium, high
    priority = Column(
        String,
        nullable=False,
        default="medium",
        server_default="medium",
        index=True,
    )

    # Category used to classify the ticket
    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True,
        index=True,
    )

    # Team responsible for handling the ticket
    assignment_group_id = Column(
        Integer,
        ForeignKey("assignment_groups.id"),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------
    # Workflow status
    # --------------------------------------------------

    # Current ticket status
    #
    # Supported values for version one:
    # open, in_progress, resolved, closed, archived
    status = Column(
        String,
        nullable=False,
        default="open",
        server_default="open",
        index=True,
    )

    # --------------------------------------------------
    # Ownership and assignment
    # --------------------------------------------------

    # User who needs support
    #
    # This may be different from the person who created
    # the ticket. For example, an IT technician may create
    # a ticket on behalf of another employee.
    requester_id = Column(
        Integer,
        ForeignKey("people.id"),
        nullable=False,
        index=True,
    )

    # User who originally submitted the ticket
    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # IT staff member currently assigned to the ticket
    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # Department associated with the ticket
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------
    # SLA tracking
    # --------------------------------------------------

    # Deadline by which the ticket should be resolved
    sla_due_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    
    sla_completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    sla_breached_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    # Date and time the ticket was created
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Date and time the ticket was last modified
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )