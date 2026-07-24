# app/models/category.py

# SQLAlchemy imports for table columns and data types
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    func,
    true,
)

# Shared Base class for all database models
from app.database.db import Base


# --------------------------------------------------
# Category database table
#
# Categories classify what type of ticket this is.
#
# Examples:
# Equipment, Application, Network, Security,
# Onboarding, Offboarding, Other
# --------------------------------------------------
class Category(Base):

    # Database table name
    __tablename__ = "categories"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    # Category ID
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Category name
    name = Column(
        String,
        unique=True,
        nullable=False,
    )

    # Optional description of what this category is used for
    description = Column(
        String,
        nullable=True,
    )

    # --------------------------------------------------
    # Frontend display settings
    # --------------------------------------------------

    # Optional icon name for frontend display
    icon = Column(
        String,
        nullable=True,
    )

    # Optional color for frontend badges
    color = Column(
        String,
        nullable=True,
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

    # Active lets admins temporarily hide a category
    # without removing its history.
    active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    # Archived categories stay in the database,
    # but are removed from normal category lists.
    archived_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # --------------------------------------------------
    # Audit timestamps
    # --------------------------------------------------

    # Created timestamp
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Updated timestamp
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )