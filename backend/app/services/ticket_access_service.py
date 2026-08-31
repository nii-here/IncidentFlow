# app/services/ticket_access_service.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------

from fastapi import HTTPException


# --------------------------------------------------
# SQLAlchemy
# --------------------------------------------------

from sqlalchemy.orm import Session


# --------------------------------------------------
# Models
# --------------------------------------------------

from app.models.ticket import Ticket
from app.models.user import User
from app.models.assignment_group_member import (
    AssignmentGroupMember,
)


# ==================================================
# IT USER CHECK
# ==================================================

def is_it_user(
    user: User,
) -> bool:

    return user.role in [
        "it_staff",
        "it_admin",
    ]


# ==================================================
# REQUESTER CHECK
# ==================================================
#
# requester_id points to a Person record.
#
# A normal employee can access a ticket only when
# their User account is connected to that Person.
# ==================================================

def is_ticket_requester(
    user: User,
    ticket: Ticket,
) -> bool:

    return (
        user.person_id is not None
        and ticket.requester_id is not None
        and user.person_id
        == ticket.requester_id
    )


# ==================================================
# IT STAFF GROUP ACCESS
# ==================================================
#
# Determines whether an IT staff member belongs to
# the assignment group responsible for the ticket.
#
# Example:
#
# Ticket
# -> Desktop Support
#
# Technician
# -> Member of Desktop Support
#
# Result
# -> Technician may access the ticket.
# ==================================================

def technician_belongs_to_ticket_group(
    db: Session,
    user: User,
    ticket: Ticket,
) -> bool:

    # --------------------------------------------------
    # Ticket has no assignment group.
    # --------------------------------------------------

    if ticket.assignment_group_id is None:
        return False


    membership = (
        db.query(
            AssignmentGroupMember
        )
        .filter(
            AssignmentGroupMember.user_id
            == user.id,

            AssignmentGroupMember.assignment_group_id
            == ticket.assignment_group_id,
        )
        .first()
    )


    return membership is not None


# ==================================================
# TICKET ACCESS
# ==================================================
#
# Access rules:
#
# IT Admin
# -> can access every ticket
#
# IT Staff
# -> ticket assigned directly to them
# OR
# -> ticket belongs to one of their assignment groups
#
# Employee
# -> can access their own requester ticket
#
# Everyone else
# -> denied
# ==================================================

def user_can_access_ticket(
    db: Session,
    user: User,
    ticket: Ticket,
) -> bool:

    # --------------------------------------------------
    # IT ADMIN
    #
    # Administrators have organization-wide visibility.
    # --------------------------------------------------

    if user.role == "it_admin":
        return True


    # --------------------------------------------------
    # IT STAFF
    # --------------------------------------------------

    if user.role == "it_staff":

        # ------------------------------------------------
        # Personally assigned ticket
        # ------------------------------------------------

        if ticket.assigned_to == user.id:
            return True


        # ------------------------------------------------
        # Ticket belongs to technician's group
        # ------------------------------------------------

        if technician_belongs_to_ticket_group(
            db=db,
            user=user,
            ticket=ticket,
        ):
            return True


        return False


    # --------------------------------------------------
    # EMPLOYEE / REQUESTER
    # --------------------------------------------------

    if is_ticket_requester(
        user=user,
        ticket=ticket,
    ):
        return True


    return False


# ==================================================
# REQUIRE TICKET ACCESS
# ==================================================
#
# Routes call this helper whenever an existing ticket
# must be viewed or modified.
# ==================================================

def require_ticket_access(
    db: Session,
    user: User,
    ticket: Ticket,
) -> None:

    if not user_can_access_ticket(
        db=db,
        user=user,
        ticket=ticket,
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to access this ticket"
            ),
        )


# ==================================================
# REQUIRE IT ACCESS
# ==================================================

def require_ticket_it_access(
    user: User,
) -> None:

    if not is_it_user(
        user
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Only IT staff can perform "
                "this action"
            ),
        )