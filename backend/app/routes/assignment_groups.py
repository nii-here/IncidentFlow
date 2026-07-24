# app/routes/assignment_groups.py

# FastAPI tools
from fastapi import APIRouter, Depends, HTTPException

# Database session
from sqlalchemy.orm import Session

# Database dependency
from app.database.db import get_db

# Models
from app.models.assignment_group import AssignmentGroup
from app.models.user import User

# Schemas
from app.schemas.assignment_group_schema import (
    AssignmentGroupCreate,
    AssignmentGroupResponse,
    AssignmentGroupUpdate,
)

# Authentication and authorization
from app.security.jwt import get_current_user

from app.security.permissions import require_it_admin

# Shared administration service helpers
from app.services.admin_entity_service import (
    apply_schema_updates,
    archive_record,
    commit_and_refresh,
    ensure_unique_name,
    get_record_or_404,
    restore_record,
    set_record_status,
)


# --------------------------------------------------
# Assignment Group router
# --------------------------------------------------
router = APIRouter(
    prefix="/assignment-groups",
    tags=["Assignment Groups"],
)


# --------------------------------------------------
# Get normal assignment groups
#
# Archived groups are excluded.
# Any logged-in user can view this list.
# --------------------------------------------------
@router.get(
    "/",
    response_model=list[AssignmentGroupResponse],
)
def get_assignment_groups(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    groups = (
        db.query(AssignmentGroup)
        .filter(AssignmentGroup.archived_at.is_(None))
        .order_by(AssignmentGroup.display_order.asc())
        .all()
    )

    return groups


# --------------------------------------------------
# Get archived assignment groups
# --------------------------------------------------
@router.get(
    "/archived",
    response_model=list[AssignmentGroupResponse],
)
def get_archived_assignment_groups(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    groups = (
        db.query(AssignmentGroup)
        .filter(AssignmentGroup.archived_at.is_not(None))
        .order_by(AssignmentGroup.name.asc())
        .all()
    )

    return groups


# --------------------------------------------------
# Create an assignment group
#
# Only IT admins can create assignment groups.
# --------------------------------------------------
@router.post(
    "/",
    response_model=AssignmentGroupResponse,
)
def create_assignment_group(
    group_data: AssignmentGroupCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    # Prevent duplicate names, including capitalization
    # differences such as "Help Desk" and "help desk".
    ensure_unique_name(
        db=db,
        model=AssignmentGroup,
        name=group_data.name,
        error_detail="Assignment group already exists",
    )

    # Validate the optional manager before saving.
    if group_data.manager_id is not None:
        manager = db.query(User).filter(
            User.id == group_data.manager_id
        ).first()

        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager not found",
            )

        if manager.archived_at is not None:
            raise HTTPException(
                status_code=400,
                detail="An archived user cannot manage an assignment group",
            )

        if not manager.active:
            raise HTTPException(
                status_code=400,
                detail="An inactive user cannot manage an assignment group",
            )

    new_group = AssignmentGroup(
        name=group_data.name.strip(),
        description=group_data.description,
        manager_id=group_data.manager_id,
        display_order=group_data.display_order,
    )

    db.add(new_group)

    return commit_and_refresh(
        db=db,
        record=new_group,
    )


# --------------------------------------------------
# Update an assignment group
#
# Only IT admins can update assignment groups.
# --------------------------------------------------
@router.put(
    "/{group_id}",
    response_model=AssignmentGroupResponse,
)
def update_assignment_group(
    group_id: int,
    group_data: AssignmentGroupUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail="Assignment group not found",
    )

    # Prevent renaming this group to another group's name.
    if group_data.name is not None:
        ensure_unique_name(
            db=db,
            model=AssignmentGroup,
            name=group_data.name,
            exclude_id=group.id,
            error_detail="Assignment group already exists",
        )

    # Validate manager changes when manager_id was included
    # in the request and is not being cleared.
    update_data = group_data.model_dump(exclude_unset=True)

    if (
        "manager_id" in update_data
        and update_data["manager_id"] is not None
    ):
        manager = db.query(User).filter(
            User.id == update_data["manager_id"]
        ).first()

        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager not found",
            )

        if manager.archived_at is not None:
            raise HTTPException(
                status_code=400,
                detail="An archived user cannot manage an assignment group",
            )

        if not manager.active:
            raise HTTPException(
                status_code=400,
                detail="An inactive user cannot manage an assignment group",
            )

    apply_schema_updates(
        record=group,
        update_schema=group_data,
    )

    return commit_and_refresh(
        db=db,
        record=group,
    )


# --------------------------------------------------
# Activate or deactivate an assignment group
#
# PATCH /assignment-groups/{group_id}/status?active=true
# --------------------------------------------------
@router.patch(
    "/{group_id}/status",
    response_model=AssignmentGroupResponse,
)
def update_assignment_group_status(
    group_id: int,
    active: bool,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail="Assignment group not found",
    )

    return set_record_status(
        db=db,
        record=group,
        active=active,
    )


# --------------------------------------------------
# Archive an assignment group
#
# The group remains available to historical tickets.
# --------------------------------------------------
@router.patch(
    "/{group_id}/archive",
    response_model=AssignmentGroupResponse,
)
def archive_assignment_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail="Assignment group not found",
    )

    return archive_record(
        db=db,
        record=group,
    )


# --------------------------------------------------
# Restore an archived assignment group
# --------------------------------------------------
@router.patch(
    "/{group_id}/restore",
    response_model=AssignmentGroupResponse,
)
def restore_assignment_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail="Assignment group not found",
    )

    return restore_record(
        db=db,
        record=group,
    )