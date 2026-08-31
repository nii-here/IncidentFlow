# app/models/person.py

# --------------------------------------------------
# SQLAlchemy imports
# --------------------------------------------------
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

# Shared database Base
from app.database.db import Base


# --------------------------------------------------
# Person database table
#
# Represents a person who can be associated with
# support tickets.
#
# A Person does NOT need an IncidentFlow login account.
#
# Examples:
# - Employee with a portal account
# - Employee without a portal account
# - Person added manually by IT
# - Person imported from Microsoft Entra ID later
# --------------------------------------------------
class Person(Base):

    __tablename__ = "people"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Person's full name
    name = Column(
        String,
        nullable=False,
    )

    # Primary email used for ticket communication
    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------
    # Organization
    # --------------------------------------------------

    # Department this person belongs to
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------
    # Directory state
    # --------------------------------------------------

    # Allows IT to deactivate a person without
    # deleting their ticket history.
    active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    # Used when a person should be hidden from
    # normal requester searches.
    archived_at = Column(
        DateTime(timezone=True),
        nullable=True,
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