# app/models/ticket_history.py

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
# Ticket history database table
#
# Stores an audit trail of important actions performed
# on support tickets.
# --------------------------------------------------
class TicketHistory(Base):

    # SQL table name
    __tablename__ = "ticket_history"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    # History record ID
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------
    # Relationships
    # --------------------------------------------------

    # Ticket this history event belongs to
    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id"),
        nullable=False,
        index=True,
    )

    # User who performed the action
    changed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # --------------------------------------------------
    # Audit event details
    # --------------------------------------------------

    # Type of action performed
    #
    # Examples:
    # status_changed
    # assigned
    # archived
    # comment_added
    action = Column(
        String,
        nullable=False,
        index=True,
    )

    # Value before the change
    old_value = Column(
        Text,
        nullable=True,
    )

    # Value after the change
    new_value = Column(
        Text,
        nullable=True,
    )

    # --------------------------------------------------
    # Audit timestamp
    # --------------------------------------------------

    # Date and time the history event occurred
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )