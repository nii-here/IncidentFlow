# app/routes/tickets.py

# FastAPI tools
from fastapi import APIRouter, Depends, HTTPException

# Import datetime
from datetime import datetime, timedelta

# SQLAlchemy database session type
from sqlalchemy.orm import Session
from sqlalchemy import case 

# Database dependency
from app.database.db import get_db

# Ticket model and schemas
from app.models.ticket import Ticket
from app.models.ticket_history import TicketHistory
from app.schemas.ticket_schema import (
    TicketCreate, 
    TicketResponse,
    TicketStatusUpdate,
    TicketAssignUpdate,
    TicketCommentCreate,
    TicketCommentResponse,
    TicketHistoryResponse
)

# Current logged-in user helper
from app.routes.auth import get_current_user, require_it_staff_or_admin, require_it_admin

# User model
from app.models.user import User

# Ticket comment model
from app.models.ticket_comment import TicketComment


# --------------------------------------------------
# Create router for ticket routes
# All routes here will belong to tickets
# --------------------------------------------------
router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# --------------------------------------------------
# Create a new support ticket
# Only logged-in users can create tickets
# POST /tickets
# --------------------------------------------------
@router.post("/", response_model=TicketResponse)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------
    # SLA deadline calculation based on priority
    # --------------------------------------------------
    sla_due_at = None

    if ticket_data.priority == "high":
        sla_due_at = datetime.utcnow() + timedelta(hours=4)

    elif ticket_data.priority == "medium":
        sla_due_at = datetime.utcnow() + timedelta(hours=24)

    elif ticket_data.priority == "low":
        sla_due_at = datetime.utcnow() + timedelta(hours=72)


    # Create ticket object from request data
    new_ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        priority=ticket_data.priority,
        category=ticket_data.category,
        assignment_group=ticket_data.assignment_group,
        created_by=current_user.id,
        department_id=current_user.department_id,
        sla_due_at=sla_due_at
    )

    # Save ticket to database
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket

# --------------------------------------------------
# Get tickets created by the current logged-in user
# GET /tickets/my
# --------------------------------------------------
@router.get("/my", response_model=list[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find tickets where created_by matches the logged-in user ID
    tickets = db.query(Ticket).filter(
        Ticket.created_by == current_user.id
    ).all()

    return tickets

# --------------------------------------------------
# Get all tickets
# Only IT staff and IT admins can access this
# GET /tickets/
# --------------------------------------------------
@router.get("/", response_model=list[TicketResponse])
def get_all_tickets(
    department_id: int | None = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_staff_or_admin)
):

    # Return every ticket in the system
    query = db.query(Ticket)

    # Filter by department if provided
    if department_id is not None:
        query = query.filter(
            Ticket.department_id == department_id
        )

    # --------------------------------------------------
    # Sorting
    # --------------------------------------------------
    allowed_sort_fields = [
        "created_at",
        "priority",
        "status"
    ]

    # Prevent invalid sort fields
    if sort_by not in allowed_sort_fields:
        raise HTTPException(
            status_code=400,
            detail="Invalid sort field"
        )

    # --------------------------------------------------
    # Apply sorting
    # --------------------------------------------------

    if sort_by == "priority":

        # Custom priority ranking:
        # high = 1, medium = 2, low = 3
        priority_order = case(
            (Ticket.priority == "high", 1),
            (Ticket.priority == "medium", 2),
            (Ticket.priority == "low", 3),
            else_=4
        )

        if sort_order == "desc":
            query = query.order_by(priority_order.desc())
        else:
            query = query.order_by(priority_order.asc())

    else:
        sort_column = getattr(Ticket, sort_by)

        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    # --------------------------------------------------
    # Pagination
    # --------------------------------------------------
    offset = (page - 1) * page_size

    tickets = query.offset(offset).limit(page_size).all()

    return tickets

# --------------------------------------------------
# Update ticket status
# Only IT staff and IT admins can update tickets
# PATCH /tickets/{ticket_id}/status
# --------------------------------------------------
@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_update: TicketStatusUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_staff_or_admin)
):

    # Find ticket by ID
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # Return error if ticket does not exist
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Prevent changes to archived tickets
    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail="Archived tickets cannot be modified"
        )

    # Save old status before updating
    old_status = ticket.status

    # Update ticket status
    ticket.status = status_update.status

    # Create ticket history record
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=_current_user.id,
        action="status_changed",
        old_value=old_status,
        new_value=status_update.status
    )

    # Save history record
    db.add(history)

    # Save changes
    db.commit()
    db.refresh(ticket)

    return ticket

# --------------------------------------------------
# Assign ticket to an IT staff/admin user
# Only IT staff and IT admins can assign tickets
# PATCH /tickets/{ticket_id}/assign
# --------------------------------------------------
@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    assign_data: TicketAssignUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_staff_or_admin)
):

    # Find ticket by ID
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # Return error if ticket does not exist
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Prevent changes to archived tickets
    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail="Archived tickets cannot be modified"
        )

    # Find the user being assigned
    assigned_user = db.query(User).filter(User.id == assign_data.assigned_to).first()

    # Return error if assigned user does not exist
    if not assigned_user:
        raise HTTPException(
            status_code=404,
            detail="Assigned user not found"
        )

    # Only IT staff or IT admins should be assigned tickets
    if assigned_user.role not in ["it_staff", "it_admin"]:
        raise HTTPException(
            status_code=400,
            detail="Tickets can only be assigned to IT staff or IT admins"
        )

    # Save old assignee before updating
    old_assigned_to = ticket.assigned_to

    # Assign ticket to the IT user
    ticket.assigned_to = assigned_user.id

    # Create ticket history record 
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=_current_user.id,
        action="assigned",
        old_value=str(old_assigned_to),
        new_value=str(assigned_user.id)
    )

    # Save history record
    db.add(history)

    # Save changes
    db.commit()
    db.refresh(ticket)

    return ticket

# --------------------------------------------------
# Add comment to a ticket
# Logged-in users can add comments
# POST /tickets/{ticket_id}/comments
# --------------------------------------------------
@router.post("/{ticket_id}/comments")
def add_ticket_comment(
    ticket_id: int,
    comment_data: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find ticket by ID
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # Return error if ticket does not exist
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Prevent changes to archived tickets
    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail="Archived tickets cannot be modified"
        )

    # --------------------------------------------------
    # Security check
    # Employees can only comment on their own tickets
    # IT staff/admins can comment on any ticket
    # --------------------------------------------------
    if (
        current_user.role not in ["it_staff", "it_admin"]
        and ticket.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to comment on this ticket"
        )

    # Create new comment
    new_comment = TicketComment(
        ticket_id=ticket.id,
        user_id=current_user.id,
        comment=comment_data.comment
    )

    # Save comment to database
    db.add(new_comment)

    # Create ticket history record for the comment
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="comment_added",
        old_value=None,
        new_value=comment_data.comment
    )

    # Save history record
    db.add(history)
    db.commit()
    db.refresh(new_comment)

    return {
        "message": "Comment added successfully"
    }

# --------------------------------------------------
# Get ticket dashboard summary metrics
# Only IT staff and IT admins can view metrics
# GET /tickets/metrics/summary
# --------------------------------------------------
@router.get("/metrics/summary")
def get_ticket_metrics(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_staff_or_admin)
):

    # Count all tickets
    total_tickets = db.query(Ticket).count()

    # Count tickets by status
    open_tickets = db.query(Ticket).filter(Ticket.status == "open").count()
    in_progress_tickets = db.query(Ticket).filter(Ticket.status == "in_progress").count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status == "resolved").count()
    closed_tickets = db.query(Ticket).filter(Ticket.status == "closed").count()
    archived_tickets = db.query(Ticket).filter(Ticket.status == "archived").count()

    # Count tickets by priority
    high_priority_tickets = db.query(Ticket).filter(Ticket.priority == "high").count()
    medium_priority_tickets = db.query(Ticket).filter(Ticket.priority == "medium").count()
    low_priority_tickets = db.query(Ticket).filter(Ticket.priority == "low").count()

    # Count overdue SLA tickets
    overdue_tickets = db.query(Ticket).filter(
        Ticket.sla_due_at < datetime.utcnow(),
        Ticket.status.notin_(["resolved", "closed", "archived"])
    ).count()

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress_tickets": in_progress_tickets,
        "resolved_tickets": resolved_tickets,
        "closed_tickets": closed_tickets,
        "archived_tickets": archived_tickets,
        "high_priority_tickets": high_priority_tickets,
        "medium_priority_tickets": medium_priority_tickets,
        "low_priority_tickets": low_priority_tickets,
        "overdue_tickets": overdue_tickets
    }

# --------------------------------------------------
# Get comments for a ticket
# Logged-in users can view ticket comments
# GET /tickets/{ticket_id}/comments
# --------------------------------------------------
@router.get("/{ticket_id}/comments", response_model=list[TicketCommentResponse])
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find ticket by ID
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # Return error if ticket does not exist
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # --------------------------------------------------
    # Security check
    # Employees can only view their own ticket comments
    # IT staff/admins can view all comments
    # --------------------------------------------------
    if (
        current_user.role not in ["it_staff", "it_admin"]
        and ticket.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view these comments"
        )

    # Return all comments for this ticket
    comments = db.query(TicketComment).filter(
        TicketComment.ticket_id == ticket.id
    ).all()

    return comments

# --------------------------------------------------
# Archive a ticket
# Only IT admins can archive tickets
# PATCH /tickets/{ticket_id}/archive
# --------------------------------------------------
@router.patch("/{ticket_id}/archive", response_model=TicketResponse)
def archive_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin)
):

    # Find ticket by ID
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # Return error if ticket does not exist
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Save old status before archiving
    old_status = ticket.status

    # Archive ticket instead of deleting it
    ticket.status = "archived"

    # Create ticket history record for archive action 
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=_current_user.id,
        action="archived",
        old_value=old_status,
        new_value="archived"
    )

    # Save history record
    db.add(history)

    # Save changes
    db.commit()
    db.refresh(ticket)

    return ticket

# --------------------------------------------------------
# Get history for a ticket
# Employees can view history for their own tickets
# IT staff/admins can view history for any ticket
# GET /tickets/{ticket_id}/history
# --------------------------------------------------------
@router.get("/{ticket_id}/history", response_model=list[TicketHistoryResponse])
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find ticket ID
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # Return error if ticket does not exist 
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Security check
    if (
        current_user.role not in ["it_staff", "it_admin"]
        and ticket.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view this ticket history"
        )

    # Return history records for this ticket
    history = db.query(TicketHistory).filter(
        TicketHistory.ticket_id == ticket.id
    ).all()

    return history    