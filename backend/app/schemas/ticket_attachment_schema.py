# app/schemas/ticket_attachment_schema.py

# --------------------------------------------------
# Pydantic
# --------------------------------------------------

from pydantic import BaseModel

# --------------------------------------------------
# Python
# --------------------------------------------------

from datetime import datetime


# ==================================================
# ATTACHMENT AUTHOR
# ==================================================

# --------------------------------------------------
# Small uploader object
#
# This lets the frontend display:
#
# Uploaded by Clement
#
# instead of:
#
# Uploaded by User #1
# --------------------------------------------------

class TicketAttachmentUploaderResponse(BaseModel):

    # User/person ID.
    #
    # Null can be used later for system-generated files.
    id: int | None

    # Display name
    name: str

    # Where the uploader came from.
    #
    # user   = IncidentFlow account
    # person = requester/contact
    # system = system-generated
    type: str


# ==================================================
# ATTACHMENT RESPONSE
# ==================================================

# --------------------------------------------------
# Metadata returned to the frontend
#
# IMPORTANT:
#
# We intentionally do NOT return:
#
# - stored_filename
# - storage_key
# - physical server path
#
# Those are internal storage details and should not
# be exposed to the browser.
# --------------------------------------------------

class TicketAttachmentResponse(BaseModel):

    # Attachment ID
    id: int

    # Ticket this attachment belongs to
    ticket_id: int

    # Conversation entry this file belongs to.
    #
    # Null means the file is attached directly
    # to the ticket.
    comment_id: int | None

    # Original filename shown to the user.
    #
    # Example:
    # laptop-error.png
    original_filename: str

    # MIME/content type
    content_type: str

    # Size in bytes
    file_size: int

    # Person/account that uploaded the file
    uploader: TicketAttachmentUploaderResponse

    # Upload timestamp
    created_at: datetime


# ==================================================
# ATTACHMENT LIST ITEM
# ==================================================

# --------------------------------------------------
# For now the full response is small enough that
# listing attachments can use the same structure.
#
# This alias gives us flexibility later if the
# detailed response grows.
# --------------------------------------------------

TicketAttachmentListResponse = TicketAttachmentResponse