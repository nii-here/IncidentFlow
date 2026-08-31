# app/routes/ticket_attachments.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from fastapi.responses import FileResponse

# --------------------------------------------------
# SQLAlchemy
# --------------------------------------------------

from sqlalchemy.orm import Session

# --------------------------------------------------
# Database
# --------------------------------------------------

from app.database.db import get_db

# --------------------------------------------------
# Models
# --------------------------------------------------

from app.models.ticket import Ticket
from app.models.ticket_attachment import TicketAttachment
from app.models.ticket_comment import TicketComment
from app.models.user import User
from app.models.person import Person
from app.models.ticket_history import TicketHistory

# --------------------------------------------------
# Schemas
# --------------------------------------------------

from app.schemas.ticket_attachment_schema import (
    TicketAttachmentResponse,
)

# --------------------------------------------------
# Authentication
# --------------------------------------------------

from app.security.jwt import get_current_user

# --------------------------------------------------
# Access control
# --------------------------------------------------

from app.services.ticket_access_service import (
    require_ticket_access,
)

# --------------------------------------------------
# Storage service
# --------------------------------------------------

from app.services.attachment_service import (
    delete_attachment_file,
    generate_storage_names,
    get_attachment_path,
    read_and_validate_upload,
    save_attachment_file,
)


# --------------------------------------------------
# Router
# --------------------------------------------------

router = APIRouter(
    prefix="/ticket-attachments",
    tags=["Ticket Attachments"],
)


# ==================================================
# HELPER FUNCTIONS
# ==================================================

# --------------------------------------------------
# Find ticket or return 404
# --------------------------------------------------

def get_ticket_or_404(
    db: Session,
    ticket_id: int,
) -> Ticket:

    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return ticket


# --------------------------------------------------
# Build uploader response
#
# Converts IDs into real display names.
# --------------------------------------------------

def build_uploader_response(
    db: Session,
    attachment: TicketAttachment,
) -> dict:

    # ----------------------------------------------
    # Uploaded by IncidentFlow user
    # ----------------------------------------------

    if attachment.uploaded_by is not None:
        user = (
            db.query(User)
            .filter(
                User.id == attachment.uploaded_by
            )
            .first()
        )

        return {
            "id": (
                user.id
                if user
                else attachment.uploaded_by
            ),
            "name": (
                user.name
                if user
                else "Unknown User"
            ),
            "type": "user",
        }

    # ----------------------------------------------
    # Uploaded by requester/person
    # ----------------------------------------------

    if attachment.person_id is not None:
        person = (
            db.query(Person)
            .filter(
                Person.id == attachment.person_id
            )
            .first()
        )

        return {
            "id": (
                person.id
                if person
                else attachment.person_id
            ),
            "name": (
                person.name
                if person
                else "Unknown Requester"
            ),
            "type": "person",
        }

    # ----------------------------------------------
    # System generated
    # ----------------------------------------------

    return {
        "id": None,
        "name": "IncidentFlow",
        "type": "system",
    }


# --------------------------------------------------
# Check whether the current user can access
# a specific attachment.
#
# IT staff/admins can access all ticket attachments.
#
# Requesters can access:
# - attachments directly on the ticket
# - attachments on PUBLIC comments
#
# Requesters cannot access attachments that belong
# to INTERNAL IT notes.
# --------------------------------------------------

def require_attachment_access(
    db: Session,
    current_user: User,
    attachment: TicketAttachment,
) -> None:

    # IT users can access all attachments.
    if current_user.role in [
        "it_staff",
        "it_admin",
    ]:
        return

    # Ticket-level attachments are allowed once the
    # user already passed the ticket-access check.
    if attachment.comment_id is None:
        return

    # Find the parent conversation entry.
    comment = (
        db.query(TicketComment)
        .filter(
            TicketComment.id == attachment.comment_id
        )
        .first()
    )

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Conversation entry not found",
        )

    # Internal-note attachments must never be exposed
    # to requester accounts.
    if comment.visibility == "internal":
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to access this attachment"
            ),
        )


# --------------------------------------------------
# Build safe attachment response
#
# Does NOT expose:
# - storage_key
# - stored_filename
# - server path
# --------------------------------------------------

def build_attachment_response(
    db: Session,
    attachment: TicketAttachment,
) -> dict:

    return {
        "id": attachment.id,
        "ticket_id": attachment.ticket_id,
        "comment_id": attachment.comment_id,
        "original_filename": (
            attachment.original_filename
        ),
        "content_type": attachment.content_type,
        "file_size": attachment.file_size,
        "uploader": build_uploader_response(
            db=db,
            attachment=attachment,
        ),
        "created_at": attachment.created_at,
    }


# ==================================================
# UPLOAD ATTACHMENT
# ==================================================

# --------------------------------------------------
# Upload file to ticket
#
# Optional comment_id allows the file to be attached
# to a specific conversation entry.
#
# POST /ticket-attachments/tickets/{ticket_id}
# --------------------------------------------------

@router.post(
    "/tickets/{ticket_id}",
    response_model=TicketAttachmentResponse,
    status_code=201,
)
async def upload_ticket_attachment(
    ticket_id: int,
    comment_id: int | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------
    # Find ticket
    # --------------------------------------------------

    ticket = get_ticket_or_404(
        db=db,
        ticket_id=ticket_id,
    )

    # --------------------------------------------------
    # Security check
    # --------------------------------------------------

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    # --------------------------------------------------
    # Archived tickets are read-only
    # --------------------------------------------------

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot be modified"
            ),
        )

    # --------------------------------------------------
    # Validate optional comment relationship
    #
    # Prevent attaching a file to a comment belonging
    # to another ticket.
    # --------------------------------------------------

    if comment_id is not None:
        comment = (
            db.query(TicketComment)
            .filter(
                TicketComment.id == comment_id,
                TicketComment.ticket_id == ticket.id,
            )
            .first()
        )

        if not comment:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Conversation entry not found "
                    "for this ticket"
                ),
            )

        # Requesters must not attach files to an
        # internal IT-only note.
        if (
            current_user.role not in [
                "it_staff",
                "it_admin",
            ]
            and comment.visibility == "internal"
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have permission "
                    "to attach files to this note"
                ),
            )

    # --------------------------------------------------
    # Validate and read upload
    # --------------------------------------------------

    (
        file_data,
        original_filename,
        content_type,
    ) = await read_and_validate_upload(
        file
    )

    file_size = len(file_data)

    # --------------------------------------------------
    # Generate internal storage names
    # --------------------------------------------------

    (
        stored_filename,
        storage_key,
    ) = generate_storage_names(
        ticket_id=ticket.id,
        original_filename=original_filename,
    )

    # --------------------------------------------------
    # Save physical file first
    # --------------------------------------------------

    save_attachment_file(
        file_data=file_data,
        storage_key=storage_key,
    )

    # --------------------------------------------------
    # Determine uploader
    #
    # Authenticated IncidentFlow accounts are stored
    # using uploaded_by.
    #
    # Future requester/email uploads can use person_id.
    # --------------------------------------------------

    attachment = TicketAttachment(
        ticket_id=ticket.id,
        comment_id=comment_id,
        uploaded_by=current_user.id,
        person_id=None,
        original_filename=original_filename,
        stored_filename=stored_filename,
        content_type=content_type,
        file_size=file_size,
        storage_key=storage_key,
    )

    # --------------------------------------------------
    # Save metadata
    #
    # If the database save fails, remove the physical
    # file so storage and PostgreSQL do not become
    # inconsistent.
    # --------------------------------------------------

    try:
        db.add(attachment)

        db.flush()

        # --------------------------------------------------
        # History record
        #
        # Store attachment ID instead of filename/path.
        # --------------------------------------------------

        history = TicketHistory(
            ticket_id=ticket.id,
            changed_by=current_user.id,
            action="attachment_added",
            old_value=None,
            new_value=str(attachment.id),
        )

        db.add(history)

        db.commit()

        db.refresh(attachment)

    except Exception:
        db.rollback()

        delete_attachment_file(
            storage_key=storage_key,
        )

        raise

    return build_attachment_response(
        db=db,
        attachment=attachment,
    )


# ==================================================
# LIST TICKET ATTACHMENTS
# ==================================================

# --------------------------------------------------
# Get all attachments for one ticket
#
# IT users receive all ticket attachments.
#
# Requesters do NOT receive files attached to
# internal IT-only conversation entries.
#
# GET /ticket-attachments/tickets/{ticket_id}
# --------------------------------------------------

@router.get(
    "/tickets/{ticket_id}",
    response_model=list[TicketAttachmentResponse],
)
def get_ticket_attachments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------
    # Find ticket
    # --------------------------------------------------

    ticket = get_ticket_or_404(
        db=db,
        ticket_id=ticket_id,
    )

    # --------------------------------------------------
    # Security check
    # --------------------------------------------------

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    # --------------------------------------------------
    # Load attachments
    # --------------------------------------------------

    attachments = (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.ticket_id
            == ticket.id
        )
        .order_by(
            TicketAttachment.created_at.asc(),
            TicketAttachment.id.asc(),
        )
        .all()
    )

    # --------------------------------------------------
    # Apply attachment visibility rules
    # --------------------------------------------------

    visible_attachments = []

    for attachment in attachments:
        try:
            require_attachment_access(
                db=db,
                current_user=current_user,
                attachment=attachment,
            )

            visible_attachments.append(
                build_attachment_response(
                    db=db,
                    attachment=attachment,
                )
            )

        except HTTPException as error:

            # Internal-note attachments should simply
            # disappear from requester attachment lists.
            if error.status_code == 403:
                continue

            raise

    return visible_attachments


# ==================================================
# DOWNLOAD ATTACHMENT
# ==================================================

# --------------------------------------------------
# Download attachment
#
# The backend checks:
# 1. ticket access
# 2. attachment visibility
#
# GET /ticket-attachments/{attachment_id}/download
# --------------------------------------------------

@router.get(
    "/{attachment_id}/download",
)
def download_ticket_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------
    # Find attachment
    # --------------------------------------------------

    attachment = (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.id
            == attachment_id
        )
        .first()
    )

    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found",
        )

    # --------------------------------------------------
    # Find parent ticket
    # --------------------------------------------------

    ticket = get_ticket_or_404(
        db=db,
        ticket_id=attachment.ticket_id,
    )

    # --------------------------------------------------
    # Ticket security check
    # --------------------------------------------------

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    # --------------------------------------------------
    # Attachment visibility check
    #
    # This prevents requesters from downloading a file
    # connected to an internal IT note even if they
    # somehow know the attachment ID.
    # --------------------------------------------------

    require_attachment_access(
        db=db,
        current_user=current_user,
        attachment=attachment,
    )

    # --------------------------------------------------
    # Find private physical file
    # --------------------------------------------------

    file_path = get_attachment_path(
        storage_key=attachment.storage_key,
    )

    # --------------------------------------------------
    # Return attachment
    #
    # Original filename is used only for the browser's
    # download name, not the physical storage path.
    # --------------------------------------------------

    return FileResponse(
        path=file_path,
        media_type=attachment.content_type,
        filename=attachment.original_filename,
    )