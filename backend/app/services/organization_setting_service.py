# app/services/organization_setting_service.py

# --------------------------------------------------
# SQLAlchemy
# --------------------------------------------------

from sqlalchemy.orm import Session


# --------------------------------------------------
# Models
# --------------------------------------------------

from app.models.organization_setting import (
    OrganizationSetting,
)


# ==================================================
# GET ORGANIZATION SETTINGS
# ==================================================
#
# IncidentFlow currently uses one organization-wide
# settings record.
#
# If the database is new and the row does not exist yet,
# this helper automatically creates the default record.
#
# That keeps fresh installations from requiring a manual
# seed step just to use the application.
# ==================================================

def get_or_create_organization_settings(
    db: Session,
) -> OrganizationSetting:

    settings = (
        db.query(
            OrganizationSetting
        )
        .order_by(
            OrganizationSetting.id.asc()
        )
        .first()
    )


    # --------------------------------------------------
    # Existing settings
    # --------------------------------------------------

    if settings:
        return settings


    # --------------------------------------------------
    # Create default settings
    #
    # Technician self-assignment begins disabled.
    # --------------------------------------------------

    settings = OrganizationSetting(
        allow_technician_self_assignment=False,
    )


    db.add(
        settings
    )

    db.commit()

    db.refresh(
        settings
    )


    return settings