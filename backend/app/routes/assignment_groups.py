# app/routes/assignment_groups.py

# --------------------------------------------------
# FastAPI tools
# --------------------------------------------------

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
)

# --------------------------------------------------
# Database session
# --------------------------------------------------

from sqlalchemy.orm import Session

# --------------------------------------------------
# Database dependency
# --------------------------------------------------

from app.database.db import get_db

# --------------------------------------------------
# Models
# --------------------------------------------------

from app.models.assignment_group import (
    AssignmentGroup,
)

from app.models.assignment_group_member import (
    AssignmentGroupMember,
)

from app.models.user import User

# --------------------------------------------------
# Schemas
# --------------------------------------------------

from app.schemas.assignment_group_schema import (
    AssignmentGroupCreate,
    AssignmentGroupResponse,
    AssignmentGroupUpdate,
    AssignmentGroupMemberCreate,
    AssignmentGroupMemberResponse,
)

# --------------------------------------------------
# Authentication and authorization
# --------------------------------------------------

from app.security.jwt import get_current_user

from app.security.permissions import (
    require_it_admin,
    require_it_staff_or_admin,
)

# --------------------------------------------------
# Shared administration service helpers
# --------------------------------------------------

from app.services.admin_entity_service import (
    apply_schema_updates,
    archive_record,
    commit_and_refresh,
    ensure_unique_name,
    get_record_or_404,
    restore_record,
    set_record_status,
)


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/assignment-groups",
    tags=["Assignment Groups"],
)


# ==================================================
# GET NORMAL ASSIGNMENT GROUPS
# ==================================================
#
# Archived groups are excluded.
#
# Any logged-in user can view this list because
# assignment groups may be needed in ticket forms.
#
# GET /assignment-groups/
# ==================================================

@router.get(
    "/",
    response_model=list[
        AssignmentGroupResponse
    ],
)
def get_assignment_groups(
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        get_current_user
    ),
):

    groups = (
        db.query(AssignmentGroup)
        .filter(
            AssignmentGroup
            .archived_at
            .is_(None)
        )
        .order_by(
            AssignmentGroup
            .display_order
            .asc()
        )
        .all()
    )

    return groups


# ==================================================
# GET ARCHIVED ASSIGNMENT GROUPS
# ==================================================
#
# GET /assignment-groups/archived
# ==================================================

@router.get(
    "/archived",
    response_model=list[
        AssignmentGroupResponse
    ],
)
def get_archived_assignment_groups(
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        get_current_user
    ),
):

    groups = (
        db.query(AssignmentGroup)
        .filter(
            AssignmentGroup
            .archived_at
            .is_not(None)
        )
        .order_by(
            AssignmentGroup
            .name
            .asc()
        )
        .all()
    )

    return groups


# ==================================================
# CREATE ASSIGNMENT GROUP
# ==================================================
#
# Only IT admins can create assignment groups.
#
# POST /assignment-groups/
# ==================================================

@router.post(
    "/",
    response_model=AssignmentGroupResponse,
)
def create_assignment_group(
    group_data: AssignmentGroupCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    # --------------------------------------------------
    # Prevent duplicate names
    #
    # This also protects against capitalization
    # differences such as:
    #
    # Help Desk
    # help desk
    # --------------------------------------------------

    ensure_unique_name(
        db=db,
        model=AssignmentGroup,
        name=group_data.name,
        error_detail=(
            "Assignment group already exists"
        ),
    )


    # --------------------------------------------------
    # Validate optional manager
    # --------------------------------------------------

    if group_data.manager_id is not None:

        manager = (
            db.query(User)
            .filter(
                User.id
                == group_data.manager_id
            )
            .first()
        )


        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager not found",
            )


        if (
            manager.archived_at
            is not None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "An archived user cannot "
                    "manage an assignment group"
                ),
            )


        if not manager.active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "An inactive user cannot "
                    "manage an assignment group"
                ),
            )


    # --------------------------------------------------
    # Create group
    # --------------------------------------------------

    new_group = AssignmentGroup(
        name=group_data.name.strip(),
        description=(
            group_data.description
        ),
        manager_id=(
            group_data.manager_id
        ),
        display_order=(
            group_data.display_order
        ),
    )

    db.add(new_group)


    return commit_and_refresh(
        db=db,
        record=new_group,
    )


# ==================================================
# GET ASSIGNMENT GROUP MEMBERS
# ==================================================
#
# Returns the IT users who belong to a group.
#
# IT staff and IT admins can view membership.
#
# Regular employees do not need visibility into the
# internal structure of IT support teams.
#
# GET /assignment-groups/{group_id}/members
# ==================================================

@router.get(
    "/{group_id}/members",
    response_model=list[
        AssignmentGroupMemberResponse
    ],
)
def get_assignment_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    # --------------------------------------------------
    # Make sure the group exists
    # --------------------------------------------------

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    # --------------------------------------------------
    # Load membership records and their users
    #
    # We join User because the frontend needs useful
    # display information instead of only user IDs.
    # --------------------------------------------------

    rows = (
        db.query(
            AssignmentGroupMember,
            User,
        )
        .join(
            User,
            User.id
            == AssignmentGroupMember.user_id,
        )
        .filter(
            AssignmentGroupMember
            .assignment_group_id
            == group.id
        )
        .order_by(
            User.name.asc()
        )
        .all()
    )


    # --------------------------------------------------
    # Build safe flattened response
    # --------------------------------------------------

    response = []


    for membership, user in rows:

        response.append(
            {
                "id":
                    membership.id,

                "assignment_group_id":
                    membership
                    .assignment_group_id,

                "user_id":
                    user.id,

                "name":
                    user.name,

                "email":
                    user.email,

                "role":
                    user.role,

                "job_title":
                    user.job_title,

                "created_at":
                    membership.created_at,
            }
        )


    return response


# ==================================================
# ADD ASSIGNMENT GROUP MEMBER
# ==================================================
#
# Only IT admins can modify group membership.
#
# Members must:
#
# - exist
# - be active
# - not be archived
# - have role it_staff or it_admin
# - not already belong to this group
#
# POST /assignment-groups/{group_id}/members
# ==================================================

@router.post(
    "/{group_id}/members",
    response_model=(
        AssignmentGroupMemberResponse
    ),
    status_code=201,
)
def add_assignment_group_member(
    group_id: int,
    member_data:
        AssignmentGroupMemberCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    # --------------------------------------------------
    # Make sure assignment group exists
    # --------------------------------------------------

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    # --------------------------------------------------
    # Do not add members to archived groups
    # --------------------------------------------------

    if group.archived_at is not None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Members cannot be added to "
                "an archived assignment group"
            ),
        )


    # --------------------------------------------------
    # Do not add members to inactive groups
    # --------------------------------------------------

    if not group.active:
        raise HTTPException(
            status_code=400,
            detail=(
                "Members cannot be added to "
                "an inactive assignment group"
            ),
        )


    # --------------------------------------------------
    # Find selected user
    # --------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id
            == member_data.user_id
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    # --------------------------------------------------
    # Archived users cannot be members
    # --------------------------------------------------

    if user.archived_at is not None:
        raise HTTPException(
            status_code=400,
            detail=(
                "An archived user cannot be "
                "added to an assignment group"
            ),
        )


    # --------------------------------------------------
    # Inactive users cannot be members
    # --------------------------------------------------

    if not user.active:
        raise HTTPException(
            status_code=400,
            detail=(
                "An inactive user cannot be "
                "added to an assignment group"
            ),
        )


    # --------------------------------------------------
    # Only IT users belong to IT assignment groups
    #
    # Regular employees should never accidentally
    # receive support-ticket assignments.
    # --------------------------------------------------

    if user.role not in [
        "it_staff",
        "it_admin",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only IT staff or IT admins "
                "can belong to assignment groups"
            ),
        )


    # --------------------------------------------------
    # Prevent duplicate membership
    # --------------------------------------------------

    existing_membership = (
        db.query(
            AssignmentGroupMember
        )
        .filter(
            AssignmentGroupMember
            .assignment_group_id
            == group.id,

            AssignmentGroupMember
            .user_id
            == user.id,
        )
        .first()
    )


    if existing_membership:
        raise HTTPException(
            status_code=409,
            detail=(
                "User is already a member "
                "of this assignment group"
            ),
        )


    # --------------------------------------------------
    # Create membership
    # --------------------------------------------------

    membership = (
        AssignmentGroupMember(
            assignment_group_id=(
                group.id
            ),
            user_id=user.id,
        )
    )

    db.add(membership)

    db.commit()

    db.refresh(membership)


    # --------------------------------------------------
    # Return useful member information
    # --------------------------------------------------

    return {
        "id":
            membership.id,

        "assignment_group_id":
            membership
            .assignment_group_id,

        "user_id":
            user.id,

        "name":
            user.name,

        "email":
            user.email,

        "role":
            user.role,

        "job_title":
            user.job_title,

        "created_at":
            membership.created_at,
    }


# ==================================================
# REMOVE ASSIGNMENT GROUP MEMBER
# ==================================================
#
# Only IT admins can modify membership.
#
# DELETE
# /assignment-groups/{group_id}/members/{user_id}
# ==================================================

@router.delete(
    "/{group_id}/members/{user_id}",
    status_code=204,
)
def remove_assignment_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    # --------------------------------------------------
    # Verify assignment group exists
    # --------------------------------------------------

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    # --------------------------------------------------
    # Find membership
    # --------------------------------------------------

    membership = (
        db.query(
            AssignmentGroupMember
        )
        .filter(
            AssignmentGroupMember
            .assignment_group_id
            == group.id,

            AssignmentGroupMember
            .user_id
            == user_id,
        )
        .first()
    )


    if not membership:
        raise HTTPException(
            status_code=404,
            detail=(
                "User is not a member "
                "of this assignment group"
            ),
        )


    # --------------------------------------------------
    # Delete membership
    #
    # This does NOT delete the User account.
    # It only removes the relationship between
    # the user and this assignment group.
    # --------------------------------------------------

    db.delete(membership)

    db.commit()


    return Response(
        status_code=204
    )


# ==================================================
# UPDATE ASSIGNMENT GROUP
# ==================================================
#
# Only IT admins can update assignment groups.
#
# PUT /assignment-groups/{group_id}
# ==================================================

@router.put(
    "/{group_id}",
    response_model=AssignmentGroupResponse,
)
def update_assignment_group(
    group_id: int,
    group_data:
        AssignmentGroupUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    # --------------------------------------------------
    # Prevent renaming group to another group's name
    # --------------------------------------------------

    if group_data.name is not None:

        ensure_unique_name(
            db=db,
            model=AssignmentGroup,
            name=group_data.name,
            exclude_id=group.id,
            error_detail=(
                "Assignment group already exists"
            ),
        )


    # --------------------------------------------------
    # Validate manager change
    # --------------------------------------------------

    update_data = (
        group_data.model_dump(
            exclude_unset=True
        )
    )


    if (
        "manager_id" in update_data
        and update_data["manager_id"]
        is not None
    ):

        manager = (
            db.query(User)
            .filter(
                User.id
                == update_data[
                    "manager_id"
                ]
            )
            .first()
        )


        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager not found",
            )


        if (
            manager.archived_at
            is not None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "An archived user cannot "
                    "manage an assignment group"
                ),
            )


        if not manager.active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "An inactive user cannot "
                    "manage an assignment group"
                ),
            )


    # --------------------------------------------------
    # Apply updates
    # --------------------------------------------------

    apply_schema_updates(
        record=group,
        update_schema=group_data,
    )


    return commit_and_refresh(
        db=db,
        record=group,
    )


# ==================================================
# ACTIVATE / DEACTIVATE ASSIGNMENT GROUP
# ==================================================
#
# PATCH
# /assignment-groups/{group_id}/status?active=true
# ==================================================

@router.patch(
    "/{group_id}/status",
    response_model=AssignmentGroupResponse,
)
def update_assignment_group_status(
    group_id: int,
    active: bool,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    return set_record_status(
        db=db,
        record=group,
        active=active,
    )


# ==================================================
# ARCHIVE ASSIGNMENT GROUP
# ==================================================
#
# The group remains available to historical tickets.
#
# PATCH /assignment-groups/{group_id}/archive
# ==================================================

@router.patch(
    "/{group_id}/archive",
    response_model=AssignmentGroupResponse,
)
def archive_assignment_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    return archive_record(
        db=db,
        record=group,
    )


# ==================================================
# RESTORE ASSIGNMENT GROUP
# ==================================================
#
# PATCH /assignment-groups/{group_id}/restore
# ==================================================

@router.patch(
    "/{group_id}/restore",
    response_model=AssignmentGroupResponse,
)
def restore_assignment_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    group = get_record_or_404(
        db=db,
        model=AssignmentGroup,
        record_id=group_id,
        error_detail=(
            "Assignment group not found"
        ),
    )


    return restore_record(
        db=db,
        record=group,
    )