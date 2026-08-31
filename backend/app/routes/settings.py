# app/routes/settings.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------

from fastapi import (
    APIRouter,
    Depends,
)

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

from app.models.user import User

# --------------------------------------------------
# Schemas
# --------------------------------------------------

from app.schemas.organization_setting_schema import (
    OrganizationSettingResponse,
    OrganizationSettingUpdate,
)

# --------------------------------------------------
# Authentication / authorization
# --------------------------------------------------

from app.security.permissions import (
    require_it_staff_or_admin,
    require_it_admin,
)

# --------------------------------------------------
# Settings service
# --------------------------------------------------

from app.services.organization_setting_service import (
    get_or_create_organization_settings,
)


# ==================================================
# SETTINGS ROUTER
# ==================================================

router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)


# ==================================================
# GET ORGANIZATION SETTINGS
# ==================================================
#
# IT staff and IT admins may read organization-wide
# settings that affect how their ticket workflows behave.
#
# Example:
#
# GET /settings
# ==================================================

@router.get(
    "/",
    response_model=OrganizationSettingResponse,
)
def get_settings(
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_staff_or_admin
    ),
):

    settings = (
        get_or_create_organization_settings(
            db=db
        )
    )

    return settings


# ==================================================
# UPDATE ORGANIZATION SETTINGS
# ==================================================
#
# Only IT admins may change organization-wide policy.
#
# Example:
#
# PATCH /settings
#
# {
#     "allow_technician_self_assignment": true
# }
# ==================================================

@router.patch(
    "/",
    response_model=OrganizationSettingResponse,
)
def update_settings(
    settings_update: OrganizationSettingUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(
        require_it_admin
    ),
):

    settings = (
        get_or_create_organization_settings(
            db=db
        )
    )


    # --------------------------------------------------
    # Apply only fields that were actually included
    # in the request.
    # --------------------------------------------------

    update_data = (
        settings_update.model_dump(
            exclude_unset=True
        )
    )


    for field, value in update_data.items():
        setattr(
            settings,
            field,
            value,
        )


    db.commit()

    db.refresh(
        settings
    )


    return settings