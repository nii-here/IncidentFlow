# app/models/department.py

# SQLAlchemy column and data type imports
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    func,
    true,
)

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Department database table
#
# Represents company departments such as:
# IT, Human Resources, Finance, Operations, and Sales.
# --------------------------------------------------
class Department(Base):

    # SQL table name
    __tablename__ = "departments"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    # Department ID
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Administrator-defined department name
    name = Column(
        String,
        unique=True,
        nullable=False,
    )

    # --------------------------------------------------
    # Lifecycle
    # --------------------------------------------------

    # Active departments can be assigned to users
    # and tickets.
    active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    # Archived departments are hidden from normal lists
    # but remain in the database for historical records.
    archived_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    # Date and time the department was created
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Date and time the department was last modified
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )