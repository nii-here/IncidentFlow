# app/models/assignment_group_member.py

# --------------------------------------------------
# SQLAlchemy imports
# --------------------------------------------------

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
    func,
)

# --------------------------------------------------
# Shared database Base
# --------------------------------------------------

from app.database.db import Base


# ==================================================
# ASSIGNMENT GROUP MEMBER
# ==================================================
#
# Connects IncidentFlow IT users to assignment groups.
#
# Example:
#
# Desktop Support
# - Clement
# - Sarah
#
# Applications
# - Clement
# - James
#
# A technician can belong to more than one group.
#
# The unique constraint prevents the same user from
# being added to the same group more than once.
# ==================================================

class AssignmentGroupMember(Base):

    # SQL table name
    __tablename__ = "assignment_group_members"


    # --------------------------------------------------
    # Database constraints
    # --------------------------------------------------

    __table_args__ = (
        UniqueConstraint(
            "assignment_group_id",
            "user_id",
            name=(
                "uq_assignment_group_member"
            ),
        ),
    )


    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    # --------------------------------------------------
    # Assignment group
    # --------------------------------------------------

    assignment_group_id = Column(
        Integer,
        ForeignKey(
            "assignment_groups.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )


    # --------------------------------------------------
    # Member
    #
    # Only IT staff/admin users should be allowed to
    # become group members. The API will enforce that.
    # --------------------------------------------------

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )


    # --------------------------------------------------
    # Audit timestamp
    # --------------------------------------------------

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )