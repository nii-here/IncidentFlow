# app/schemas/organization_setting_schema.py

# --------------------------------------------------
# Python
# --------------------------------------------------

from datetime import datetime


# --------------------------------------------------
# Pydantic
# --------------------------------------------------

from pydantic import (
    BaseModel,
    ConfigDict,
)


# ==================================================
# ORGANIZATION SETTINGS RESPONSE
# ==================================================
#
# Returned whenever IncidentFlow loads organization-wide
# configuration.
#
# For version one, this contains the technician
# self-assignment policy.
#
# More organization settings can be added here later.
# ==================================================

class OrganizationSettingResponse(
    BaseModel
):

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    id: int


    # --------------------------------------------------
    # Ticket assignment policy
    # --------------------------------------------------

    allow_technician_self_assignment: bool


    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    created_at: datetime

    updated_at: datetime


    # --------------------------------------------------
    # Allows Pydantic to read SQLAlchemy model objects
    # --------------------------------------------------

    model_config = ConfigDict(
        from_attributes=True
    )


# ==================================================
# ORGANIZATION SETTINGS UPDATE
# ==================================================
#
# Used when an administrator changes organization-wide
# settings.
#
# Every field is optional because an administrator may
# update only one setting at a time.
#
# Example:
#
# PATCH /settings
#
# {
#     "allow_technician_self_assignment": true
# }
# ==================================================

class OrganizationSettingUpdate(
    BaseModel
):

    # --------------------------------------------------
    # Allow IT technicians to claim eligible tickets
    # for themselves.
    #
    # False:
    # - technicians cannot self-assign
    #
    # True:
    # - technicians may claim tickets when the ticket
    #   access rules also allow them to do so
    # --------------------------------------------------

    allow_technician_self_assignment: bool | None = None