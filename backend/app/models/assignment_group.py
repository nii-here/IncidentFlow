# app/models/assignment_group.py

# SQLAlchemy imports
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
    true,
)

# Shared Base class
from app.database.db import Base


# --------------------------------------------------
# Assignment Group database table
#
# Assignment groups are teams that tickets can be
# routed to.
#
# Examples:
# Help Desk
# Desktop Support
# Applications
# Security
# Facilities
# Human Resources
# --------------------------------------------------
class AssignmentGroup(Base):

    # SQL table name
    __tablename__ = "assignment_groups"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    # Assignment group ID
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Administrator-defined group name
    name = Column(
        String,
        unique=True,
        nullable=False,
    )

    # Optional description
    description = Column(
        String,
        nullable=True,
    )

    # --------------------------------------------------
    # Group management
    # --------------------------------------------------

    # Optional user responsible for managing the group
    manager_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # Controls display order in dropdowns
    display_order = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # --------------------------------------------------
    # Lifecycle
    # --------------------------------------------------

    # Active groups can receive new tickets.
    # Inactive groups remain available for history.
    active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    # Archived groups are hidden from normal lists,
    # but remain available for historical records.
    archived_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    # Date and time the group was created
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Date and time the group was last modified
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )