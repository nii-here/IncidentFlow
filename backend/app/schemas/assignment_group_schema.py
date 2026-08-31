# app/schemas/assignment_group_schema.py

# --------------------------------------------------
# Date/time values returned by the database
# --------------------------------------------------

from datetime import datetime

# --------------------------------------------------
# Pydantic
# --------------------------------------------------

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
)

# --------------------------------------------------
# Existing IncidentFlow role type
# --------------------------------------------------

from app.schemas.user_schema import UserRole


# ==================================================
# ASSIGNMENT GROUP CREATE
# ==================================================
#
# Data required when an administrator creates a new
# assignment group.
# ==================================================

class AssignmentGroupCreate(BaseModel):

    name: str

    description: str | None = None

    manager_id: int | None = None

    display_order: int = 0


# ==================================================
# ASSIGNMENT GROUP UPDATE
# ==================================================
#
# Every field is optional because an administrator
# may update only one part of a group.
# ==================================================

class AssignmentGroupUpdate(BaseModel):

    name: str | None = None

    description: str | None = None

    manager_id: int | None = None

    display_order: int | None = None

    active: bool | None = None


# ==================================================
# ASSIGNMENT GROUP RESPONSE
# ==================================================

class AssignmentGroupResponse(BaseModel):

    id: int

    name: str

    description: str | None

    manager_id: int | None

    active: bool

    archived_at: datetime | None

    display_order: int

    created_at: datetime

    updated_at: datetime

    # Allows Pydantic to read SQLAlchemy objects.
    model_config = ConfigDict(
        from_attributes=True
    )


# ==================================================
# ASSIGNMENT GROUP MEMBER CREATE
# ==================================================
#
# Used when an administrator adds an existing
# IncidentFlow user to an assignment group.
#
# Example:
#
# {
#     "user_id": 4
# }
#
# The API will verify that the selected user:
#
# - exists
# - is active
# - is not archived
# - is IT staff or an IT admin
# - is not already in the group
# ==================================================

class AssignmentGroupMemberCreate(
    BaseModel
):

    user_id: int


# ==================================================
# ASSIGNMENT GROUP MEMBER RESPONSE
# ==================================================
#
# Lightweight information about a technician who
# belongs to an assignment group.
#
# We intentionally do not return unnecessary account
# information such as phone number, login history,
# or any password-related information.
# ==================================================

class AssignmentGroupMemberResponse(
    BaseModel
):

    # Membership record ID
    id: int

    # Assignment group containing this member
    assignment_group_id: int

    # User account connected to this membership
    user_id: int

    # Useful user information for the frontend
    name: str

    email: EmailStr

    role: UserRole

    job_title: str | None = None

    # When the user was added to the group
    created_at: datetime