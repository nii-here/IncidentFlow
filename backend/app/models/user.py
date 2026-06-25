# app/models/user.py

# SQLAlchemy column/data type imports
from sqlalchemy import Column, Integer, String

# Import the shared Base class from db.py
from app.database.db import Base

# SQLAlchemy foreign key import
from sqlalchemy import ForeignKey


# --------------------------------------------------
# User database table
# This represents users in the system
# --------------------------------------------------
class User(Base):

    # Name of the SQL table
    __tablename__ = "users"


    # --------------------------------------------------
    # Table Columns
    # --------------------------------------------------

    # Primary key ID
    id = Column(Integer, primary_key=True, index=True)

    # User full name
    name = Column(String, nullable=False)

    # User email
    # unique=True prevents duplicate emails
    email = Column(String, unique=True, nullable=False)

    # Hashed password storage
    # Never store plain text passwords
    password_hash = Column(String, nullable=False)

    # User role
    # Examples:
    # "user"
    # "admin"
    role = Column(String, default="user")

    # Department this user belongs to
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )