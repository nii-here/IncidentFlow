# app/models/user.py

# SQLAlchemy column and data type imports
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

# Import the shared Base class from db.py
from app.database.db import Base


# --------------------------------------------------
# User database table
#
# Represents every person who can access IncidentFlow.
# This includes employees, IT staff, and IT admins.
# --------------------------------------------------
class User(Base):

    # Name of the SQL table
    __tablename__ = "users"

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    # Primary key
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # User's full name
    #
    # We are keeping one name field for now because the
    # existing registration and login system already uses it.
    name = Column(
        String,
        nullable=False,
    )

    # Email address used for login
    #
    # unique=True prevents two accounts from using
    # the same email address.
    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    # Securely hashed password
    #
    # Plain-text passwords must never be stored.
    password_hash = Column(
        String,
        nullable=False,
    )

    # --------------------------------------------------
    # Organization information
    # --------------------------------------------------

    # Optional job title
    #
    # Examples:
    # Clinical Application Support Specialist
    # Help Desk Technician
    # IT Manager
    job_title = Column(
        String,
        nullable=True,
    )

    # Optional phone number
    phone = Column(
        String,
        nullable=True,
    )

    # Department this user belongs to
    #
    # This can remain empty until the user is assigned
    # to a department.
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True,
    )

    # --------------------------------------------------
    # Access and authorization
    # --------------------------------------------------

    # Current version-one role
    #
    # Supported roles:
    # employee
    # it_staff
    # it_admin
    #
    # A full roles-and-permissions system can replace
    # this field later.
    role = Column(
        String,
        nullable=False,
        default="employee",
    )

    # Determines whether the user can access the platform
    #
    # Deactivating a user should prevent future logins
    # without removing their historical records.
    active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    # --------------------------------------------------
    # Account history
    # --------------------------------------------------

    # Records when the user was archived
    #
    # Null means the user is not archived.
    archived_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Date and time the account was created
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Date and time the account was last modified
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Most recent successful login
    #
    # This remains null until the user logs in.
    last_login_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )