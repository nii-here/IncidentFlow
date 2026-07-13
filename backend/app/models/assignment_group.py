# app/models/assignment_group.py

# SQLAlchemy imports
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey

# Used for automatic timestamps
from datetime import datetime

# Shared Base class
from app.database.db import Base


# --------------------------------------------------
# Assignment Group database table
#
# Assignment groups are teams that tickets can be routed to.
#
# Examples:
# Help Desk, Desktop Support, Applications, Security
# --------------------------------------------------
class AssignmentGroup(Base):

    # SQL table name
    __tablename__ = "assignment_groups"

    # Assignment group ID
    id = Column(Integer, primary_key=True, index=True)

    # Group name
    name = Column(String, unique=True, nullable=False)

    # Optional description
    description = Column(String, nullable=True)

    # Optional manager user ID
    manager_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    # Active lets admins hide old groups without deleting them
    active = Column(Boolean, default=True)

    # Controls display order in dropdowns
    display_order = Column(Integer, default=0)

    # Created timestamp
    created_at = Column(DateTime, default=datetime.utcnow)

    # Updated timestamp
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )