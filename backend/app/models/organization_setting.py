# app/models/organization_setting.py

# --------------------------------------------------
# SQLAlchemy imports
# --------------------------------------------------

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    func,
    false,
)

# --------------------------------------------------
# Shared database Base
# --------------------------------------------------

from app.database.db import Base


# ==================================================
# ORGANIZATION SETTINGS
# ==================================================
#
# Stores global IncidentFlow settings for the
# organization.
#
# For version one, this table will contain a single
# settings row.
#
# Later, more organization-wide settings can be added
# here without creating separate tables for every
# configuration option.
#
# Examples:
#
# - technician self-assignment
# - ticket defaults
# - SLA behavior
# - notification defaults
# - automation controls
# ==================================================

class OrganizationSetting(Base):

    # --------------------------------------------------
    # SQL table name
    # --------------------------------------------------

    __tablename__ = "organization_settings"


    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    # --------------------------------------------------
    # Technician self-assignment
    #
    # False:
    # - technicians cannot claim unassigned tickets
    # - an admin must assign the ticket
    #
    # True:
    # - eligible technicians can claim tickets that
    #   belong to one of their assignment groups
    # --------------------------------------------------

    allow_technician_self_assignment = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )


    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )