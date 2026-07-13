# app/models/category.py

# SQLAlchemy imports for table columns and data types
from sqlalchemy import Column, Integer, String, Boolean, DateTime

# Used for automatic timestamps
from datetime import datetime

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
#
# Admins will eventually manage these from the frontend.
# --------------------------------------------------
class Category(Base):

    # Database table name
    __tablename__ = "categories"

    # Category ID
    id = Column(Integer, primary_key=True, index=True)

    # Category name
    name = Column(String, unique=True, nullable=False)

    # Optional description of what this category is used for
    description = Column(String, nullable=True)

    # Optional icon name for frontend display
    icon = Column(String, nullable=True)

    # Optional color for frontend badges
    color = Column(String, nullable=True)

    # Active lets admins temporarily hide a category
    # without removing its history.
    active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # Archived categories stay in the database,
    # but are removed from normal category lists.
    #
    # None means the category is not archived.
    archived_at = Column(
        DateTime,
        nullable=True
    )

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