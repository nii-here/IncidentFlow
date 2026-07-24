# app/schemas/user_schema.py

# Date and time values returned by the database
from datetime import datetime

# Restricts role values to the roles currently supported
from typing import Literal

# Pydantic tools
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --------------------------------------------------
# Roles currently supported by IncidentFlow
#
# Later, this can be replaced by database-driven roles
# and permissions.
# --------------------------------------------------
UserRole = Literal[
    "employee",
    "it_staff",
    "it_admin",
]


# --------------------------------------------------
# Schema used for public account registration
#
# This remains compatible with the existing
# POST /auth/register endpoint.
# --------------------------------------------------
class UserCreate(BaseModel):

    # User's full name
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    # Email used for login
    email: EmailStr

    # Plain password received from the request
    #
    # It will be hashed before being stored.
    password: str = Field(
        min_length=8,
        max_length=128,
    )


# --------------------------------------------------
# Schema used when an IT admin creates a user
#
# The admin can provide organization and access
# information during account creation.
# --------------------------------------------------
class UserAdminCreate(BaseModel):

    # User's full name
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    # Email used for login
    email: EmailStr

    # Temporary password for the first version
    #
    # A proper email invitation and password setup
    # workflow can replace this later.
    password: str = Field(
        min_length=8,
        max_length=128,
    )

    # Optional organization information
    job_title: str | None = Field(
        default=None,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    department_id: int | None = None

    # New admin-created users default to employees
    role: UserRole = "employee"


# --------------------------------------------------
# Schema used to update an existing user
#
# Every field is optional because an administrator
# may update only one part of the account.
# --------------------------------------------------
class UserUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None

    job_title: str | None = Field(
        default=None,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    # Sending null intentionally removes the user
    # from their current department.
    department_id: int | None = None

    role: UserRole | None = None


# --------------------------------------------------
# Schema used to activate or deactivate an account
# --------------------------------------------------
class UserStatusUpdate(BaseModel):

    active: bool


# --------------------------------------------------
# Schema used when returning safe user information
#
# Password hashes are intentionally excluded.
# --------------------------------------------------
class UserResponse(BaseModel):

    id: int
    name: str
    email: EmailStr

    job_title: str | None
    phone: str | None
    department_id: int | None

    role: UserRole
    active: bool

    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None

    # Allows Pydantic to read SQLAlchemy model objects
    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------
# Existing admin update schema
#
# This remains temporarily available so the existing
# /auth/users/{user_id}/admin-update endpoint does
# not break while we build the dedicated Users router.
# --------------------------------------------------
class UserAdminUpdate(BaseModel):

    role: UserRole | None = None

    # Null can mean no department, but the existing
    # auth route currently does not support clearing it.
    department_id: int | None = None