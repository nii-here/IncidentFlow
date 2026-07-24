# app/routes/users.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# --------------------------------------------------
# Database
# --------------------------------------------------
from app.database.db import get_db

# --------------------------------------------------
# Models
# --------------------------------------------------
from app.models.user import User

# --------------------------------------------------
# Schemas
# --------------------------------------------------
from app.schemas.user_schema import (
    UserAdminCreate,
    UserResponse,
    UserUpdate,
)

# --------------------------------------------------
# Authentication
# --------------------------------------------------
from app.security.jwt import get_current_user

from app.security.permissions import require_it_admin

# --------------------------------------------------
# Shared administration helpers
# --------------------------------------------------
from app.services.admin_entity_service import (
    apply_schema_updates,
    archive_record,
    commit_and_refresh,
    get_record_or_404,
    restore_record,
    set_record_status,
)

# --------------------------------------------------
# User-specific services
# --------------------------------------------------
from app.services.user_service import (
    build_user,
    ensure_unique_email,
    validate_department,
)


# --------------------------------------------------
# Router
# --------------------------------------------------
router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# --------------------------------------------------
# Create a user
#
# Only IT admins can create user accounts.
# --------------------------------------------------
@router.post(
    "/",
    response_model=UserResponse,
    status_code=201,
)
def create_user(
    user_data: UserAdminCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    # Prevent two accounts from using the same email.
    ensure_unique_email(
        db=db,
        email=user_data.email,
    )

    # Confirm that the selected department exists.
    validate_department(
        db=db,
        department_id=user_data.department_id,
    )

    # Build the SQLAlchemy user object.
    # Password hashing happens inside build_user().
    new_user = build_user(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role,
        department_id=user_data.department_id,
        job_title=user_data.job_title,
        phone=user_data.phone,
    )

    db.add(new_user)

    return commit_and_refresh(
        db=db,
        record=new_user,
    )


# --------------------------------------------------
# Get all non-archived users
#
# Any authenticated user can view the user list.
# --------------------------------------------------
@router.get(
    "/",
    response_model=list[UserResponse],
)
def get_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    users = (
        db.query(User)
        .filter(User.archived_at.is_(None))
        .order_by(User.name.asc())
        .all()
    )

    return users


# --------------------------------------------------
# Get archived users
#
# This route must appear before /{user_id} so that
# FastAPI does not treat "archived" as a user ID.
# --------------------------------------------------
@router.get(
    "/archived",
    response_model=list[UserResponse],
)
def get_archived_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    users = (
        db.query(User)
        .filter(User.archived_at.is_not(None))
        .order_by(User.name.asc())
        .all()
    )

    return users


# --------------------------------------------------
# Get one user by ID
# --------------------------------------------------
@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return get_record_or_404(
        db=db,
        model=User,
        record_id=user_id,
        error_detail="User not found.",
    )


# --------------------------------------------------
# Update a user
#
# Only IT admins can edit user accounts.
# --------------------------------------------------
@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    # Find the user or return a 404 response.
    user = get_record_or_404(
        db=db,
        model=User,
        record_id=user_id,
        error_detail="User not found.",
    )

    # Read only the fields that were actually included.
    update_data = user_data.model_dump(exclude_unset=True)

    # Validate and normalize the email only when it
    # was included in the request.
    if "email" in update_data and update_data["email"] is not None:
        normalized_email = str(update_data["email"]).strip().lower()

        ensure_unique_email(
            db=db,
            email=normalized_email,
            exclude_id=user.id,
        )

        # Store the normalized value in the schema so
        # apply_schema_updates() saves it.
        user_data.email = normalized_email

    # Validate the department only when the field was
    # included and is not being cleared with null.
    if (
        "department_id" in update_data
        and update_data["department_id"] is not None
    ):
        validate_department(
            db=db,
            department_id=update_data["department_id"],
        )

    # Apply only the submitted fields.
    apply_schema_updates(
        record=user,
        update_schema=user_data,
    )

    return commit_and_refresh(
        db=db,
        record=user,
    )


# --------------------------------------------------
# Activate or deactivate a user
#
# Example:
# PATCH /users/2/status?active=false
# --------------------------------------------------
@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
def update_user_status(
    user_id: int,
    active: bool,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    user = get_record_or_404(
        db=db,
        model=User,
        record_id=user_id,
        error_detail="User not found.",
    )

    return set_record_status(
        db=db,
        record=user,
        active=active,
    )


# --------------------------------------------------
# Archive a user
#
# The user remains in the database for historical
# tickets, audit records, and relationships.
# --------------------------------------------------
@router.patch(
    "/{user_id}/archive",
    response_model=UserResponse,
)
def archive_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    user = get_record_or_404(
        db=db,
        model=User,
        record_id=user_id,
        error_detail="User not found.",
    )

    return archive_record(
        db=db,
        record=user,
    )


# --------------------------------------------------
# Restore an archived user
# --------------------------------------------------
@router.patch(
    "/{user_id}/restore",
    response_model=UserResponse,
)
def restore_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    user = get_record_or_404(
        db=db,
        model=User,
        record_id=user_id,
        error_detail="User not found.",
    )

    return restore_record(
        db=db,
        record=user,
    )