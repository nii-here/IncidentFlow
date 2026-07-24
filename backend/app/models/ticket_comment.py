# app/models/ticket_comment.py

# SQLAlchemy column and data type imports
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    func,
)

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Ticket comment database table
#
# Stores notes and comments added to support tickets.
# --------------------------------------------------
class TicketComment(Base):

    # SQL table name
    __tablename__ = "ticket_comments"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    # Comment ID
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------
    # Relationships
    # --------------------------------------------------

    # Ticket this comment belongs to
    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id"),
        nullable=False,
        index=True,
    )

    # User who wrote the comment
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # --------------------------------------------------
    # Comment content
    # --------------------------------------------------

    # Comment or note text
    comment = Column(
        Text,
        nullable=False,
    )

    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    # Date and time the comment was created
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )