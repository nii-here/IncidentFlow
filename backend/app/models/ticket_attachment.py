# app/models/ticket_attachment.py

# --------------------------------------------------
# SQLAlchemy imports
# --------------------------------------------------

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    BigInteger,
    CheckConstraint,
    func,
)

# --------------------------------------------------
# Database
# --------------------------------------------------

from app.database.db import Base


# --------------------------------------------------
# Ticket Attachment
#
# Stores metadata about files attached to tickets
# or conversation entries.
#
# IMPORTANT:
# The actual file contents are NOT stored in this
# table. The database only stores metadata and the
# private storage location/key.
# --------------------------------------------------

class TicketAttachment(Base):

    __tablename__ = "ticket_attachments"


    # --------------------------------------------------
    # Database validation
    # --------------------------------------------------

    __table_args__ = (
        CheckConstraint(
            "file_size >= 0",
            name="ck_ticket_attachments_file_size",
        ),
        CheckConstraint(
            "NOT (uploaded_by IS NOT NULL AND person_id IS NOT NULL)",
            name="ck_ticket_attachments_single_uploader",
        ),
    )


    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    # --------------------------------------------------
    # Ticket relationship
    # --------------------------------------------------

    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id"),
        nullable=False,
        index=True,
    )


    # --------------------------------------------------
    # Optional conversation relationship
    #
    # If the file was uploaded with a comment/reply,
    # this points to that conversation entry.
    #
    # Null means the file belongs directly to the ticket.
    # --------------------------------------------------

    comment_id = Column(
        Integer,
        ForeignKey("ticket_comments.id"),
        nullable=True,
        index=True,
    )


    # --------------------------------------------------
    # Uploader
    #
    # uploaded_by:
    # IncidentFlow account such as IT staff/admin.
    #
    # person_id:
    # Future requester/contact uploads.
    # --------------------------------------------------

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    person_id = Column(
        Integer,
        ForeignKey("people.id"),
        nullable=True,
        index=True,
    )


    # --------------------------------------------------
    # Original file information
    # --------------------------------------------------

    original_filename = Column(
        String,
        nullable=False,
    )

    # Internal generated filename.
    #
    # We do not trust the user's original filename
    # as the physical storage filename.
    stored_filename = Column(
        String,
        nullable=False,
        unique=True,
    )

    # Examples:
    # image/png
    # application/pdf
    # text/plain
    content_type = Column(
        String,
        nullable=False,
    )

    # File size in bytes
    file_size = Column(
        BigInteger,
        nullable=False,
    )


    # --------------------------------------------------
    # Private storage key
    #
    # Example:
    #
    # tickets/3/attachments/uuid-file.png
    #
    # This is NOT a public URL.
    # --------------------------------------------------

    storage_key = Column(
        String,
        nullable=False,
        unique=True,
    )


    # --------------------------------------------------
    # Audit timestamp
    # --------------------------------------------------

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )