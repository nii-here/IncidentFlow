# app/routes/tickets.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

# --------------------------------------------------
# Python
# --------------------------------------------------

from datetime import datetime, timedelta, timezone

# --------------------------------------------------
# SQLAlchemy
# --------------------------------------------------

from sqlalchemy.orm import Session
from sqlalchemy import case

# --------------------------------------------------
# Database
# --------------------------------------------------

from app.database.db import get_db

# --------------------------------------------------
# Models
# --------------------------------------------------

from app.models.ticket import Ticket
from app.models.ticket_history import TicketHistory
from app.models.ticket_comment import TicketComment
from app.models.user import User
from app.models.person import Person
from app.models.category import Category
from app.models.assignment_group import AssignmentGroup
from app.models.department import Department
from app.models.ticket_attachment import TicketAttachment
from app.models.assignment_group_member import (
    AssignmentGroupMember,
)

# --------------------------------------------------
# Schemas
# --------------------------------------------------

from app.schemas.ticket_schema import (
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
    TicketAssignUpdate,
    TicketAssignmentGroupUpdate,
    TicketCommentCreate,
    TicketCommentResponse,
    TicketHistoryResponse,
    TicketDetailResponse,
    TicketPriorityUpdate,
)

# --------------------------------------------------
# Authentication
# --------------------------------------------------

from app.security.jwt import get_current_user

from app.security.permissions import (
    require_it_staff_or_admin,
    require_it_admin,
)

# --------------------------------------------------
# Ticket access service
# --------------------------------------------------

from app.services.ticket_access_service import (
    is_it_user,
    require_ticket_access,
)

from app.services.organization_setting_service import (
    get_or_create_organization_settings,
)

# --------------------------------------------------
# Attachment service
# --------------------------------------------------

from app.services.attachment_service import (
    delete_attachment_file,
    generate_storage_names,
    read_and_validate_upload,
    save_attachment_file,
)


# --------------------------------------------------
# Router
# --------------------------------------------------

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"],
)


# ==================================================
# TICKET RESPONSE HELPERS
# ==================================================
#
# Ticket.assigned_to stores an internal user ID.
#
# The frontend should receive enough information to display
# a technician's real name without making separate user lookups.
#
# These helpers keep TicketResponse consistent across:
#
# - ticket creation
# - ticket lists
# - status updates
# - priority updates
# - technician assignment
# - assignment group updates
# - archiving
#
# For ticket lists, assigned technicians are loaded in one
# query to avoid an N+1 query problem.
# ==================================================

def build_ticket_response(
    ticket: Ticket,
    technician: User | None = None,
) -> dict:

    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "priority": ticket.priority,
        "status": ticket.status,
        "requester_id": ticket.requester_id,
        "category_id": ticket.category_id,
        "assignment_group_id": ticket.assignment_group_id,
        "created_by": ticket.created_by,
        "assigned_to": ticket.assigned_to,

        "technician": (
            {
                "id": technician.id,
                "name": technician.name,
                "email": technician.email,
            }
            if technician
            else None
        ),

        "department_id": ticket.department_id,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "sla_due_at": ticket.sla_due_at,
        "sla_completed_at": ticket.sla_completed_at,
        "sla_breached_at": ticket.sla_breached_at,
    }


def get_ticket_technician(
    db: Session,
    ticket: Ticket,
) -> User | None:

    if ticket.assigned_to is None:
        return None

    return (
        db.query(User)
        .filter(
            User.id == ticket.assigned_to
        )
        .first()
    )


def build_single_ticket_response(
    db: Session,
    ticket: Ticket,
) -> dict:

    technician = get_ticket_technician(
        db=db,
        ticket=ticket,
    )

    return build_ticket_response(
        ticket=ticket,
        technician=technician,
    )


def build_ticket_list_responses(
    db: Session,
    tickets: list[Ticket],
) -> list[dict]:

    # --------------------------------------------------
    # Collect assigned technician IDs from this result set.
    # --------------------------------------------------

    assigned_user_ids = {
        ticket.assigned_to
        for ticket in tickets
        if ticket.assigned_to is not None
    }

    technicians_by_id: dict[int, User] = {}

    # --------------------------------------------------
    # Load all required technicians in one query.
    # --------------------------------------------------

    if assigned_user_ids:

        technicians = (
            db.query(User)
            .filter(
                User.id.in_(
                    assigned_user_ids
                )
            )
            .all()
        )

        technicians_by_id = {
            technician.id: technician
            for technician in technicians
        }

    # --------------------------------------------------
    # Build API-safe ticket responses.
    # --------------------------------------------------

    return [
        build_ticket_response(
            ticket=ticket,
            technician=(
                technicians_by_id.get(
                    ticket.assigned_to
                )
                if ticket.assigned_to is not None
                else None
            ),
        )
        for ticket in tickets
    ]


# ==================================================
# CREATE TICKET
# ==================================================

@router.post(
    "/",
    response_model=TicketResponse,
)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    # --------------------------------------------------
    # Determine requester
    # --------------------------------------------------

    requester = None

    if ticket_data.requester_id is not None:

        requester = (
            db.query(Person)
            .filter(
                Person.id
                == ticket_data.requester_id
            )
            .first()
        )

        if not requester:
            raise HTTPException(
                status_code=404,
                detail="Requester not found",
            )

        if requester.archived_at is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Archived people cannot be "
                    "selected as requesters"
                ),
            )

        if not requester.active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Inactive people cannot be "
                    "selected as requesters"
                ),
            )

    # --------------------------------------------------
    # Requester is required
    # --------------------------------------------------

    if requester is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "A requester is required to "
                "create a ticket"
            ),
        )

    # --------------------------------------------------
    # Validate category
    # --------------------------------------------------

    if ticket_data.category_id is not None:

        category = (
            db.query(Category)
            .filter(
                Category.id
                == ticket_data.category_id
            )
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found",
            )

        if category.archived_at is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Archived categories cannot "
                    "be used for new tickets"
                ),
            )

        if not category.active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Inactive categories cannot "
                    "be used for new tickets"
                ),
            )

    # --------------------------------------------------
    # Validate assignment group
    # --------------------------------------------------

    if ticket_data.assignment_group_id is not None:

        assignment_group = (
            db.query(AssignmentGroup)
            .filter(
                AssignmentGroup.id
                == ticket_data.assignment_group_id
            )
            .first()
        )

        if not assignment_group:
            raise HTTPException(
                status_code=404,
                detail="Assignment group not found",
            )

        if assignment_group.archived_at is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Archived assignment groups "
                    "cannot receive new tickets"
                ),
            )

        if not assignment_group.active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Inactive assignment groups "
                    "cannot receive new tickets"
                ),
            )

    # --------------------------------------------------
    # Calculate SLA deadline
    # --------------------------------------------------

    sla_due_at = None

    now = datetime.now(
        timezone.utc
    )

    if ticket_data.priority == "high":
        sla_due_at = (
            now
            + timedelta(hours=4)
        )

    elif ticket_data.priority == "medium":
        sla_due_at = (
            now
            + timedelta(hours=24)
        )

    elif ticket_data.priority == "low":
        sla_due_at = (
            now
            + timedelta(hours=72)
        )

    # --------------------------------------------------
    # Create ticket
    # --------------------------------------------------

    new_ticket = Ticket(
        title=ticket_data.title.strip(),

        description=(
            ticket_data.description.strip()
        ),

        priority=ticket_data.priority,

        requester_id=requester.id,

        category_id=(
            ticket_data.category_id
        ),

        assignment_group_id=(
            ticket_data.assignment_group_id
        ),

        created_by=current_user.id,

        department_id=(
            requester.department_id
        ),

        sla_due_at=sla_due_at,
    )

    db.add(new_ticket)

    db.commit()

    db.refresh(new_ticket)

    return build_single_ticket_response(
        db=db,
        ticket=new_ticket,
    )


# ==================================================
# GET MY CREATED TICKETS
# ==================================================

@router.get(
    "/my",
    response_model=list[TicketResponse],
)
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.created_by
            == current_user.id
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return build_ticket_list_responses(
        db=db,
        tickets=tickets,
    )


# ==================================================
# GET TICKET QUEUES
# ==================================================

@router.get(
    "/",
    response_model=list[TicketResponse],
)
def get_all_tickets(
    view: str = "all",
    department_id: int | None = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    allowed_views = [
        "all",
        "my_open",
        "my",
        "my_groups",
        "unassigned",
        "open",
        "in_progress",
        "resolved",
        "closed",
        "overdue",
        "archived",
    ]

    if view not in allowed_views:
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket view",
        )

    # --------------------------------------------------
    # Organization-wide views
    # --------------------------------------------------

    admin_only_views = [
        "all",
        "archived",
    ]

    if (
        current_user.role == "it_staff"
        and view in admin_only_views
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to access this ticket view"
            ),
        )

    query = db.query(Ticket)

    # ==================================================
    # CURRENT USER'S ASSIGNMENT GROUPS
    # ==================================================

    membership_rows = (
        db.query(
            AssignmentGroupMember
        )
        .filter(
            AssignmentGroupMember.user_id
            == current_user.id
        )
        .all()
    )

    current_user_group_ids = [
        membership.assignment_group_id
        for membership in membership_rows
    ]

    # ==================================================
    # BASE ROLE SECURITY
    # ==================================================

    if current_user.role == "it_staff":

        if current_user_group_ids:

            query = query.filter(
                (
                    Ticket.assigned_to
                    == current_user.id
                )
                |
                (
                    Ticket.assignment_group_id.in_(
                        current_user_group_ids
                    )
                )
            )

        else:

            query = query.filter(
                Ticket.assigned_to
                == current_user.id
            )

    # ==================================================
    # VIEW FILTERS
    # ==================================================

    if view == "all":
        pass

    elif view == "my_open":

        query = query.filter(
            Ticket.assigned_to
            == current_user.id,

            Ticket.status.in_(
                [
                    "open",
                    "in_progress",
                ]
            ),
        )

    elif view == "my":

        query = query.filter(
            Ticket.assigned_to
            == current_user.id
        )

        if current_user.role == "it_staff":
            query = query.filter(
                Ticket.status
                != "archived"
            )

    elif view == "my_groups":

        if not current_user_group_ids:

            query = query.filter(
                Ticket.id == -1
            )

        else:

            query = query.filter(
                Ticket.assignment_group_id.in_(
                    current_user_group_ids
                )
            )

        if current_user.role == "it_staff":
            query = query.filter(
                Ticket.status
                != "archived"
            )

    elif view == "unassigned":

        query = query.filter(
            Ticket.assigned_to.is_(None)
        )

        if current_user.role == "it_staff":

            if not current_user_group_ids:

                query = query.filter(
                    Ticket.id == -1
                )

            else:

                query = query.filter(
                    Ticket.assignment_group_id.in_(
                        current_user_group_ids
                    )
                )

            query = query.filter(
                Ticket.status
                != "archived"
            )

    elif view == "open":

        query = query.filter(
            Ticket.status == "open"
        )

    elif view == "in_progress":

        query = query.filter(
            Ticket.status
            == "in_progress"
        )

    elif view == "resolved":

        query = query.filter(
            Ticket.status
            == "resolved"
        )

    elif view == "closed":

        query = query.filter(
            Ticket.status
            == "closed"
        )

    elif view == "overdue":

        now = datetime.now(timezone.utc)

        query = query.filter(
            Ticket.sla_due_at.is_not(None),
            Ticket.sla_due_at < now,
            Ticket.status.notin_(
                [
                    "resolved",
                    "closed",
                    "archived",
                ]
            ),     
        )


    elif view == "archived":

        query = query.filter(
            Ticket.status
            == "archived"
        )

    # ==================================================
    # DEPARTMENT FILTER
    # ==================================================

    if department_id is not None:

        query = query.filter(
            Ticket.department_id
            == department_id
        )

    # ==================================================
    # SORTING
    # ==================================================

    allowed_sort_fields = [
        "created_at",
        "priority",
        "status",
    ]

    if sort_by not in allowed_sort_fields:
        raise HTTPException(
            status_code=400,
            detail="Invalid sort field",
        )

    if sort_order not in [
        "asc",
        "desc",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid sort order",
        )

    if sort_by == "priority":

        priority_order = case(
            (
                Ticket.priority == "high",
                1,
            ),
            (
                Ticket.priority == "medium",
                2,
            ),
            (
                Ticket.priority == "low",
                3,
            ),
            else_=4,
        )

        if sort_order == "desc":

            query = query.order_by(
                priority_order.desc()
            )

        else:

            query = query.order_by(
                priority_order.asc()
            )

    else:

        sort_column = getattr(
            Ticket,
            sort_by,
        )

        if sort_order == "desc":

            query = query.order_by(
                sort_column.desc()
            )

        else:

            query = query.order_by(
                sort_column.asc()
            )

    # ==================================================
    # PAGINATION
    # ==================================================

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Page must be greater "
                "than or equal to 1"
            ),
        )

    if (
        page_size < 1
        or page_size > 100
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Page size must be between "
                "1 and 100"
            ),
        )

    offset = (
        page - 1
    ) * page_size

    tickets = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return build_ticket_list_responses(
        db=db,
        tickets=tickets,
    )


# ==================================================
# DASHBOARD METRICS
# ==================================================

@router.get(
    "/metrics/summary"
)
def get_ticket_metrics(
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    total_tickets = (
        db.query(Ticket)
        .count()
    )

    open_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status == "open"
        )
        .count()
    )

    in_progress_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status
            == "in_progress"
        )
        .count()
    )

    resolved_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status
            == "resolved"
        )
        .count()
    )

    closed_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status
            == "closed"
        )
        .count()
    )

    archived_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status
            == "archived"
        )
        .count()
    )

    high_priority_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.priority == "high"
        )
        .count()
    )

    medium_priority_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.priority == "medium"
        )
        .count()
    )

    low_priority_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.priority == "low"
        )
        .count()
    )

    overdue_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.sla_due_at
            < datetime.now(
                timezone.utc
            ),

            Ticket.status.notin_(
                [
                    "resolved",
                    "closed",
                    "archived",
                ]
            ),
        )
        .count()
    )

    unassigned_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.assigned_to.is_(None),

            Ticket.status.notin_(
                [
                    "resolved",
                    "closed",
                    "archived",
                ]
            ),
        )
        .count()
    )

    return {
        "total_tickets":
            total_tickets,

        "open_tickets":
            open_tickets,

        "in_progress_tickets":
            in_progress_tickets,

        "resolved_tickets":
            resolved_tickets,

        "closed_tickets":
            closed_tickets,

        "archived_tickets":
            archived_tickets,

        "high_priority_tickets":
            high_priority_tickets,

        "medium_priority_tickets":
            medium_priority_tickets,

        "low_priority_tickets":
            low_priority_tickets,

        "overdue_tickets":
            overdue_tickets,

        "unassigned_tickets":
            unassigned_tickets,
    }


# ==================================================
# SINGLE TICKET
# ==================================================

@router.get(
    "/{ticket_id}",
    response_model=TicketDetailResponse,
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # --------------------------------------------------
    # Verify access to this specific ticket
    # --------------------------------------------------

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    requester = (
        db.query(Person)
        .filter(
            Person.id
            == ticket.requester_id
        )
        .first()
    )

    if not requester:
        raise HTTPException(
            status_code=404,
            detail=(
                "Ticket requester not found"
            ),
        )

    category = None

    if ticket.category_id is not None:

        category = (
            db.query(Category)
            .filter(
                Category.id
                == ticket.category_id
            )
            .first()
        )

    assignment_group = None

    if ticket.assignment_group_id is not None:

        assignment_group = (
            db.query(AssignmentGroup)
            .filter(
                AssignmentGroup.id
                == ticket.assignment_group_id
            )
            .first()
        )

    technician = None

    if ticket.assigned_to is not None:

        technician = (
            db.query(User)
            .filter(
                User.id
                == ticket.assigned_to
            )
            .first()
        )

    department = None

    if ticket.department_id is not None:

        department = (
            db.query(Department)
            .filter(
                Department.id
                == ticket.department_id
            )
            .first()
        )

    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "priority": ticket.priority,
        "status": ticket.status,
        "requester_id": ticket.requester_id,
        "category_id": ticket.category_id,
        "assignment_group_id":
            ticket.assignment_group_id,
        "created_by": ticket.created_by,
        "assigned_to": ticket.assigned_to,
        "department_id": ticket.department_id,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "sla_due_at": ticket.sla_due_at,
        "sla_completed_at":
            ticket.sla_completed_at,
        "sla_breached_at":
            ticket.sla_breached_at,

        "requester": {
            "id": requester.id,
            "name": requester.name,
            "email": requester.email,
            "department_id":
                requester.department_id,
        },

        "category": (
            {
                "id": category.id,
                "name": category.name,
            }
            if category
            else None
        ),

        "assignment_group": (
            {
                "id": assignment_group.id,
                "name": assignment_group.name,
            }
            if assignment_group
            else None
        ),

        "technician": (
            {
                "id": technician.id,
                "name": technician.name,
                "email": technician.email,
            }
            if technician
            else None
        ),

        "department": (
            {
                "id": department.id,
                "name": department.name,
            }
            if department
            else None
        ),
    }


# ==================================================
# UPDATE STATUS
# ==================================================

@router.patch(
    "/{ticket_id}/status",
    response_model=TicketResponse,
)
def update_ticket_status(
    ticket_id: int,
    status_update: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # --------------------------------------------------
    # Verify access
    # --------------------------------------------------

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be modified"
            ),
        )

    old_status = ticket.status

    new_status = (
        status_update.status
    )

    if old_status == new_status:

        return build_single_ticket_response(
            db=db,
            ticket=ticket,
        )

    now = datetime.now(
        timezone.utc
    )

    sla_history = None

    # ==================================================
    # SLA COMPLETION
    # ==================================================

    if new_status in [
        "resolved",
        "closed",
    ]:

        if ticket.sla_completed_at is None:

            ticket.sla_completed_at = now

            if ticket.sla_due_at is not None:

                if (
                    ticket.sla_completed_at
                    > ticket.sla_due_at
                ):

                    if (
                        ticket.sla_breached_at
                        is None
                    ):
                        ticket.sla_breached_at = (
                            ticket.sla_due_at
                        )

                    sla_history = TicketHistory(
                        ticket_id=ticket.id,
                        changed_by=current_user.id,
                        action="sla_breached",

                        old_value=(
                            ticket.sla_due_at
                            .isoformat()
                        ),

                        new_value=(
                            ticket.sla_completed_at
                            .isoformat()
                        ),
                    )

                else:

                    sla_history = TicketHistory(
                        ticket_id=ticket.id,
                        changed_by=current_user.id,
                        action="sla_met",

                        old_value=(
                            ticket.sla_due_at
                            .isoformat()
                        ),

                        new_value=(
                            ticket.sla_completed_at
                            .isoformat()
                        ),
                    )

    ticket.status = new_status

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="status_changed",
        old_value=old_status,
        new_value=new_status,
    )

    db.add(history)

    if sla_history is not None:
        db.add(sla_history)

    db.commit()

    db.refresh(ticket)

    return build_single_ticket_response(
        db=db,
        ticket=ticket,
    )


# ==================================================
# UPDATE PRIORITY
# ==================================================

@router.patch(
    "/{ticket_id}/priority",
    response_model=TicketResponse,
)
def update_ticket_priority(
    ticket_id: int,
    priority_update:
        TicketPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be modified"
            ),
        )

    old_priority = ticket.priority

    if (
        old_priority
        == priority_update.priority
    ):
        return build_single_ticket_response(
            db=db,
            ticket=ticket,
        )

    ticket.priority = (
        priority_update.priority
    )

    old_sla_due_at = (
        ticket.sla_due_at
    )

    sla_deadline_recalculated = False

    if ticket.sla_completed_at is None:

        now = datetime.now(
            timezone.utc
        )

        if (
            priority_update.priority
            == "high"
        ):
            ticket.sla_due_at = (
                now
                + timedelta(hours=4)
            )

        elif (
            priority_update.priority
            == "medium"
        ):
            ticket.sla_due_at = (
                now
                + timedelta(hours=24)
            )

        elif (
            priority_update.priority
            == "low"
        ):
            ticket.sla_due_at = (
                now
                + timedelta(hours=72)
            )

        sla_deadline_recalculated = True

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="priority_changed",
        old_value=old_priority,
        new_value=(
            priority_update.priority
        ),
    )

    db.add(history)

    if sla_deadline_recalculated:

        sla_history = TicketHistory(
            ticket_id=ticket.id,
            changed_by=current_user.id,

            action=(
                "sla_deadline_recalculated"
            ),

            old_value=(
                old_sla_due_at.isoformat()
                if old_sla_due_at
                else None
            ),

            new_value=(
                ticket.sla_due_at.isoformat()
                if ticket.sla_due_at
                else None
            ),
        )

        db.add(sla_history)

    db.commit()

    db.refresh(ticket)

    return build_single_ticket_response(
        db=db,
        ticket=ticket,
    )


# ==================================================
# ASSIGN TECHNICIAN
# ==================================================

@router.patch(
    "/{ticket_id}/assign",
    response_model=TicketResponse,
)
def assign_ticket(
    ticket_id: int,
    assign_data: TicketAssignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_admin
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be modified"
            ),
        )

    old_assigned_to = (
        ticket.assigned_to
    )

    if assign_data.assigned_to is None:

        ticket.assigned_to = None

    else:

        assigned_user = (
            db.query(User)
            .filter(
                User.id
                == assign_data.assigned_to
            )
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Assigned user not found"
                ),
            )

        if assigned_user.role not in [
            "it_staff",
            "it_admin",
        ]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tickets can only be "
                    "assigned to IT staff "
                    "or IT admins"
                ),
            )

        ticket.assigned_to = (
            assigned_user.id
        )

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="assigned",

        old_value=(
            str(old_assigned_to)
            if old_assigned_to is not None
            else None
        ),

        new_value=(
            str(ticket.assigned_to)
            if ticket.assigned_to is not None
            else None
        ),
    )

    db.add(history)

    db.commit()

    db.refresh(ticket)

    return build_single_ticket_response(
        db=db,
        ticket=ticket,
    )


# ==================================================
# CLAIM TICKET
# ==================================================

@router.patch(
    "/{ticket_id}/claim",
    response_model=TicketResponse,
)
def claim_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    # --------------------------------------------------
    # Only regular IT staff use self-claim.
    # --------------------------------------------------

    if current_user.role != "it_staff":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only IT staff can use "
                "the technician claim workflow"
            ),
        )

    # --------------------------------------------------
    # Organization settings
    # --------------------------------------------------

    settings = (
        get_or_create_organization_settings(
            db=db
        )
    )

    if not (
        settings
        .allow_technician_self_assignment
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Technician self-assignment "
                "is disabled"
            ),
        )

    # --------------------------------------------------
    # Find ticket
    # --------------------------------------------------

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be claimed"
            ),
        )

    # --------------------------------------------------
    # Ticket must still be unassigned
    # --------------------------------------------------

    if ticket.assigned_to is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Ticket is already assigned"
            ),
        )

    # --------------------------------------------------
    # Ticket must have a group
    # --------------------------------------------------

    if ticket.assignment_group_id is None:
        raise HTTPException(
            status_code=403,
            detail=(
                "Ticket must belong to one of "
                "your assignment groups before "
                "you can claim it"
            ),
        )

    # --------------------------------------------------
    # Verify group membership
    # --------------------------------------------------

    membership = (
        db.query(
            AssignmentGroupMember
        )
        .filter(
            AssignmentGroupMember.user_id
            == current_user.id,

            AssignmentGroupMember.assignment_group_id
            == ticket.assignment_group_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=403,
            detail=(
                "You cannot claim tickets "
                "outside your assignment groups"
            ),
        )

    old_assigned_to = (
        ticket.assigned_to
    )

    ticket.assigned_to = (
        current_user.id
    )

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="claimed",

        old_value=(
            str(old_assigned_to)
            if old_assigned_to is not None
            else None
        ),

        new_value=str(
            current_user.id
        ),
    )

    db.add(history)

    db.commit()

    db.refresh(ticket)

    return build_single_ticket_response(
        db=db,
        ticket=ticket,
    )


# ==================================================
# CHANGE ASSIGNMENT GROUP
# ==================================================

@router.patch(
    "/{ticket_id}/assignment-group",
    response_model=TicketResponse,
)
def update_ticket_assignment_group(
    ticket_id: int,

    assignment_data:
        TicketAssignmentGroupUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be modified"
            ),
        )

    old_assignment_group_id = (
        ticket.assignment_group_id
    )

    if (
        assignment_data
        .assignment_group_id
        is None
    ):

        ticket.assignment_group_id = None

    else:

        assignment_group = (
            db.query(AssignmentGroup)
            .filter(
                AssignmentGroup.id
                == assignment_data
                .assignment_group_id
            )
            .first()
        )

        if not assignment_group:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Assignment group "
                    "not found"
                ),
            )

        if (
            assignment_group.archived_at
            is not None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Archived assignment "
                    "groups cannot receive "
                    "tickets"
                ),
            )

        if not assignment_group.active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Inactive assignment "
                    "groups cannot receive "
                    "tickets"
                ),
            )

        ticket.assignment_group_id = (
            assignment_group.id
        )

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,

        action=(
            "assignment_group_changed"
        ),

        old_value=(
            str(
                old_assignment_group_id
            )
            if old_assignment_group_id
            is not None
            else None
        ),

        new_value=(
            str(
                ticket.assignment_group_id
            )
            if ticket.assignment_group_id
            is not None
            else None
        ),
    )

    db.add(history)

    db.commit()

    db.refresh(ticket)

    return build_single_ticket_response(
        db=db,
        ticket=ticket,
    )


# ==================================================
# TICKET CONVERSATION HELPERS
# ==================================================

def build_comment_author(
    db: Session,
    comment: TicketComment,
) -> dict:

    if comment.user_id is not None:

        author_user = (
            db.query(User)
            .filter(
                User.id
                == comment.user_id
            )
            .first()
        )

        return {
            "id": (
                author_user.id
                if author_user
                else comment.user_id
            ),

            "name": (
                author_user.name
                if author_user
                else "Unknown User"
            ),

            "type": "user",
        }

    if comment.person_id is not None:

        author_person = (
            db.query(Person)
            .filter(
                Person.id
                == comment.person_id
            )
            .first()
        )

        return {
            "id": (
                author_person.id
                if author_person
                else comment.person_id
            ),

            "name": (
                author_person.name
                if author_person
                else "Unknown Requester"
            ),

            "type": "person",
        }

    return {
        "id": None,
        "name": "IncidentFlow",
        "type": "system",
    }


def build_comment_attachment_uploader(
    db: Session,
    attachment: TicketAttachment,
) -> dict:

    if attachment.uploaded_by is not None:

        user = (
            db.query(User)
            .filter(
                User.id
                == attachment.uploaded_by
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

    if attachment.person_id is not None:

        person = (
            db.query(Person)
            .filter(
                Person.id
                == attachment.person_id
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

    return {
        "id": None,
        "name": "IncidentFlow",
        "type": "system",
    }


def build_comment_attachment_response(
    db: Session,
    attachment: TicketAttachment,
) -> dict:

    return {
        "id":
            attachment.id,

        "ticket_id":
            attachment.ticket_id,

        "comment_id":
            attachment.comment_id,

        "original_filename":
            attachment.original_filename,

        "content_type":
            attachment.content_type,

        "file_size":
            attachment.file_size,

        "uploader":
            build_comment_attachment_uploader(
                db=db,
                attachment=attachment,
            ),

        "created_at":
            attachment.created_at,
    }


def build_comment_response(
    db: Session,
    comment: TicketComment,
) -> dict:

    attachments = (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.comment_id
            == comment.id
        )
        .order_by(
            TicketAttachment
            .created_at
            .asc(),

            TicketAttachment
            .id
            .asc(),
        )
        .all()
    )

    return {
        "id":
            comment.id,

        "ticket_id":
            comment.ticket_id,

        "user_id":
            comment.user_id,

        "person_id":
            comment.person_id,

        "comment":
            comment.comment,

        "visibility":
            comment.visibility,

        "source":
            comment.source,

        "author":
            build_comment_author(
                db=db,
                comment=comment,
            ),

        "attachments": [
            build_comment_attachment_response(
                db=db,
                attachment=attachment,
            )
            for attachment in attachments
        ],

        "created_at":
            comment.created_at,
    }


# ==================================================
# CREATE CONVERSATION ENTRY + ATTACHMENTS
# ==================================================

@router.post(
    "/{ticket_id}/conversation",
    response_model=TicketCommentResponse,
    status_code=201,
)
async def create_ticket_conversation_entry(
    ticket_id: int,

    comment: str = Form(...),

    files: list[UploadFile] = File(
        ...,
        description=(
            "Files attached to this "
            "conversation entry"
        ),
    ),

    visibility: str = Form(
        "internal"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be modified"
            ),
        )

    if visibility not in [
        "internal",
        "public",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Visibility must be "
                "'internal' or 'public'"
            ),
        )

    current_user_is_it = (
        is_it_user(
            current_user
        )
    )

    if (
        not current_user_is_it
        and visibility == "internal"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only IT staff can create "
                "internal notes"
            ),
        )

    cleaned_comment = (
        comment.strip()
    )

    if not cleaned_comment:
        raise HTTPException(
            status_code=400,
            detail=(
                "Comment cannot be empty"
            ),
        )

    if len(cleaned_comment) > 10000:
        raise HTTPException(
            status_code=400,
            detail=(
                "Comment cannot exceed "
                "10,000 characters"
            ),
        )

    uploaded_files = files

    MAX_ATTACHMENTS_PER_MESSAGE = 10

    if (
        len(uploaded_files)
        > MAX_ATTACHMENTS_PER_MESSAGE
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A conversation entry can "
                "have a maximum of 10 "
                "attachments"
            ),
        )

    validated_files = []

    for upload in uploaded_files:

        (
            file_data,
            original_filename,
            content_type,
        ) = await read_and_validate_upload(
            upload
        )

        validated_files.append(
            {
                "file_data":
                    file_data,

                "original_filename":
                    original_filename,

                "content_type":
                    content_type,

                "file_size":
                    len(file_data),
            }
        )

    saved_storage_keys = []

    try:

        new_comment = TicketComment(
            ticket_id=ticket.id,
            user_id=current_user.id,
            person_id=None,
            comment=cleaned_comment,
            visibility=visibility,
            source="portal",
        )

        db.add(new_comment)

        db.flush()

        comment_history = TicketHistory(
            ticket_id=ticket.id,
            changed_by=current_user.id,
            action="comment_added",
            old_value=None,
            new_value=str(
                new_comment.id
            ),
        )

        db.add(
            comment_history
        )

        for validated_file in validated_files:

            (
                stored_filename,
                storage_key,
            ) = generate_storage_names(
                ticket_id=ticket.id,

                original_filename=(
                    validated_file[
                        "original_filename"
                    ]
                ),
            )

            save_attachment_file(
                file_data=(
                    validated_file[
                        "file_data"
                    ]
                ),
                storage_key=storage_key,
            )

            saved_storage_keys.append(
                storage_key
            )

            attachment = TicketAttachment(
                ticket_id=ticket.id,
                comment_id=new_comment.id,
                uploaded_by=current_user.id,
                person_id=None,

                original_filename=(
                    validated_file[
                        "original_filename"
                    ]
                ),

                stored_filename=(
                    stored_filename
                ),

                content_type=(
                    validated_file[
                        "content_type"
                    ]
                ),

                file_size=(
                    validated_file[
                        "file_size"
                    ]
                ),

                storage_key=storage_key,
            )

            db.add(attachment)

            db.flush()

            attachment_history = (
                TicketHistory(
                    ticket_id=ticket.id,
                    changed_by=current_user.id,
                    action="attachment_added",
                    old_value=None,
                    new_value=str(
                        attachment.id
                    ),
                )
            )

            db.add(
                attachment_history
            )

        db.commit()

        db.refresh(
            new_comment
        )

    except Exception:

        db.rollback()

        for storage_key in saved_storage_keys:

            delete_attachment_file(
                storage_key=storage_key,
            )

        raise

    return build_comment_response(
        db=db,
        comment=new_comment,
    )


# ==================================================
# LEGACY JSON COMMENT ENDPOINT
# ==================================================

@router.post(
    "/{ticket_id}/comments",
    response_model=TicketCommentResponse,
    status_code=201,
)
def add_ticket_comment(
    ticket_id: int,
    comment_data: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    if ticket.status == "archived":
        raise HTTPException(
            status_code=400,
            detail=(
                "Archived tickets cannot "
                "be modified"
            ),
        )

    if (
        not is_it_user(
            current_user
        )
        and comment_data.visibility
        == "internal"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only IT staff can create "
                "internal notes"
            ),
        )

    cleaned_comment = (
        comment_data.comment.strip()
    )

    if not cleaned_comment:
        raise HTTPException(
            status_code=400,
            detail=(
                "Comment cannot be empty"
            ),
        )

    new_comment = TicketComment(
        ticket_id=ticket.id,
        user_id=current_user.id,
        person_id=None,
        comment=cleaned_comment,

        visibility=(
            comment_data.visibility
        ),

        source="portal",
    )

    db.add(new_comment)

    db.flush()

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="comment_added",
        old_value=None,
        new_value=str(
            new_comment.id
        ),
    )

    db.add(history)

    db.commit()

    db.refresh(
        new_comment
    )

    return build_comment_response(
        db=db,
        comment=new_comment,
    )


# ==================================================
# GET TICKET CONVERSATION
# ==================================================

@router.get(
    "/{ticket_id}/comments",
    response_model=list[
        TicketCommentResponse
    ],
)
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    query = (
        db.query(TicketComment)
        .filter(
            TicketComment.ticket_id
            == ticket.id
        )
    )

    if not is_it_user(
        current_user
    ):
        query = query.filter(
            TicketComment.visibility
            == "public"
        )

    comments = (
        query
        .order_by(
            TicketComment
            .created_at
            .asc(),

            TicketComment
            .id
            .asc(),
        )
        .all()
    )

    return [
        build_comment_response(
            db=db,
            comment=comment,
        )
        for comment in comments
    ]


# ==================================================
# ARCHIVE TICKET
# ==================================================

@router.patch(
    "/{ticket_id}/archive",
    response_model=TicketResponse,
)
def archive_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_it_admin
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    old_status = ticket.status

    ticket.status = "archived"

    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        action="archived",
        old_value=old_status,
        new_value="archived",
    )

    db.add(history)

    db.commit()

    db.refresh(ticket)

    return build_single_ticket_response(
        db=db,
        ticket=ticket,
    )


# ==================================================
# TICKET HISTORY HELPERS
# ==================================================

def format_history_value(
    value: str | None,
) -> str | None:

    if value is None:
        return None

    return (
        value
        .replace("_", " ")
        .title()
    )


# --------------------------------------------------
# Resolve a User ID stored in ticket history
# --------------------------------------------------

def get_user_name_from_history_value(
    db: Session,
    value: str | None,
) -> str:

    if value is None:
        return "Unassigned"

    try:
        user_id = int(value)

    except ValueError:
        return "Unknown User"

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        return "Unknown User"

    return user.name


# --------------------------------------------------
# Resolve assignment group ID
# --------------------------------------------------

def get_assignment_group_name_from_history_value(
    db: Session,
    value: str | None,
) -> str:

    if value is None:
        return "Unassigned"

    try:
        group_id = int(value)

    except ValueError:
        return "Unknown Group"

    group = (
        db.query(AssignmentGroup)
        .filter(
            AssignmentGroup.id
            == group_id
        )
        .first()
    )

    if not group:
        return "Unknown Group"

    return group.name


# --------------------------------------------------
# Resolve attachment name
# --------------------------------------------------

def get_attachment_name_from_history_value(
    db: Session,
    value: str | None,
) -> str:

    if value is None:
        return "Attachment added"

    try:
        attachment_id = int(value)

    except ValueError:
        return "Attachment added"

    attachment = (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.id
            == attachment_id
        )
        .first()
    )

    if not attachment:
        return "Attachment added"

    return attachment.original_filename


# --------------------------------------------------
# Format ISO datetime stored in history
# --------------------------------------------------

def format_history_datetime_value(
    value: str | None,
) -> str | None:

    if value is None:
        return None

    try:

        parsed_value = (
            datetime.fromisoformat(
                value
            )
        )

    except ValueError:
        return value

    if parsed_value.tzinfo is None:

        parsed_value = (
            parsed_value.replace(
                tzinfo=timezone.utc
            )
        )

    return parsed_value.strftime(
        "%b %d, %Y %I:%M %p %Z"
    )


# ==================================================
# GET TICKET HISTORY
# ==================================================

@router.get(
    "/{ticket_id}/history",
    response_model=list[
        TicketHistoryResponse
    ],
)
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    require_ticket_access(
        db=db,
        user=current_user,
        ticket=ticket,
    )

    history_records = (
        db.query(TicketHistory)
        .filter(
            TicketHistory.ticket_id
            == ticket.id
        )
        .order_by(
            TicketHistory
            .created_at
            .asc(),

            TicketHistory
            .id
            .asc(),
        )
        .all()
    )

    response = []

    for history in history_records:

        actor_user = (
            db.query(User)
            .filter(
                User.id
                == history.changed_by
            )
            .first()
        )

        actor = {
            "id":
                history.changed_by,

            "name": (
                actor_user.name
                if actor_user
                else "Unknown User"
            ),
        }

        old_display_value = (
            history.old_value
        )

        new_display_value = (
            history.new_value
        )

        # ==================================================
        # STATUS
        # ==================================================

        if (
            history.action
            == "status_changed"
        ):

            old_display_value = (
                format_history_value(
                    history.old_value
                )
            )

            new_display_value = (
                format_history_value(
                    history.new_value
                )
            )

        # ==================================================
        # PRIORITY
        # ==================================================
        #
        # This was previously checking assigned/claimed,
        # which prevented technician IDs from being
        # resolved below.
        # ==================================================

        elif (
            history.action
            == "priority_changed"
        ):

            old_display_value = (
                format_history_value(
                    history.old_value
                )
            )

            new_display_value = (
                format_history_value(
                    history.new_value
                )
            )

        # ==================================================
        # TECHNICIAN
        # ==================================================
        #
        # Assignment history stores User IDs.
        #
        # Example:
        #
        # None -> "2"
        #
        # The API converts that into:
        #
        # Unassigned -> Test Technician
        #
        # while preserving the original raw audit values.
        # ==================================================

        elif history.action in [
            "assigned",
            "claimed",
        ]:

            old_display_value = (
                get_user_name_from_history_value(
                    db=db,
                    value=history.old_value,
                )
            )

            new_display_value = (
                get_user_name_from_history_value(
                    db=db,
                    value=history.new_value,
                )
            )

        # ==================================================
        # ASSIGNMENT GROUP
        # ==================================================

        elif (
            history.action
            == "assignment_group_changed"
        ):

            old_display_value = (
                get_assignment_group_name_from_history_value(
                    db=db,
                    value=history.old_value,
                )
            )

            new_display_value = (
                get_assignment_group_name_from_history_value(
                    db=db,
                    value=history.new_value,
                )
            )

        # ==================================================
        # ARCHIVE
        # ==================================================

        elif (
            history.action
            == "archived"
        ):

            old_display_value = (
                format_history_value(
                    history.old_value
                )
            )

            new_display_value = (
                "Archived"
            )

        # ==================================================
        # COMMENT
        # ==================================================

        elif (
            history.action
            == "comment_added"
        ):

            old_display_value = None

            new_display_value = (
                "Conversation entry added"
            )

        # ==================================================
        # ATTACHMENT
        # ==================================================

        elif (
            history.action
            == "attachment_added"
        ):

            old_display_value = None

            new_display_value = (
                get_attachment_name_from_history_value(
                    db=db,
                    value=history.new_value,
                )
            )

        # ==================================================
        # SLA DEADLINE RECALCULATED
        # ==================================================

        elif (
            history.action
            == "sla_deadline_recalculated"
        ):

            old_display_value = (
                format_history_datetime_value(
                    history.old_value
                )
            )

            new_display_value = (
                format_history_datetime_value(
                    history.new_value
                )
            )

        # ==================================================
        # SLA MET
        # ==================================================

        elif (
            history.action
            == "sla_met"
        ):

            old_display_value = (
                format_history_datetime_value(
                    history.old_value
                )
            )

            new_display_value = (
                format_history_datetime_value(
                    history.new_value
                )
            )

        # ==================================================
        # SLA BREACHED
        # ==================================================

        elif (
            history.action
            == "sla_breached"
        ):

            old_display_value = (
                format_history_datetime_value(
                    history.old_value
                )
            )

            new_display_value = (
                format_history_datetime_value(
                    history.new_value
                )
            )

        # ==================================================
        # RESPONSE
        # ==================================================

        response.append(
            {
                "id":
                    history.id,

                "ticket_id":
                    history.ticket_id,

                "changed_by":
                    history.changed_by,

                "actor":
                    actor,

                "action":
                    history.action,

                # ------------------------------------------
                # Keep the raw values for audit purposes.
                # ------------------------------------------

                "old_value":
                    history.old_value,

                "new_value":
                    history.new_value,

                # ------------------------------------------
                # Frontend-friendly values.
                # ------------------------------------------

                "old_display_value":
                    old_display_value,

                "new_display_value":
                    new_display_value,

                "created_at":
                    history.created_at,
            }
        )

    return response