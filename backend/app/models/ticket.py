# app/models/ticket.py

# SQLAlchemy column/data type imports
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime

# Used for automatic timestamps
from datetime import datetime

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Ticket database table
# Represents IT support tickets
# --------------------------------------------------
class Ticket(Base):

    # SQL table name
    __tablename__ = "tickets"


    # --------------------------------------------------
    # Table Columns
    # --------------------------------------------------

    # Ticket ID
    id = Column(Integer, primary_key=True, index=True)

    # Ticket title
    title = Column(String, nullable=False)

    # Detailed issue description
    description = Column(Text, nullable=False)

    # Ticket priority
    # Example:
    # low, medium, high
    priority = Column(String, default="medium")

    # Ticket category
    # Example: 
    # Equipment, Applications, Onboarding, Offboarding, General Request etc
    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True
    )

    # Assignment group responsible for the ticket
    # Example:
    # Help Desk, Clinical Application, etc
    assignment_group_id = Column(
        Integer,
        ForeignKey("assignment_groups.id"),
        nullable=True
    )

    # Ticket status
    # Example:
    # open, in_progress, resolved
    status = Column(String, default="open")

    # User who created the ticket
    created_by = Column(Integer, ForeignKey("users.id"))

    # User assigned to handle the ticket
    assigned_to = Column(Integer, nullable=True)

    # Timestamp when ticket was created
    created_at = Column(DateTime, default=datetime.utcnow)

    # SLA deadline for resolving the ticket
    sla_due_at = Column(DateTime, nullable=True)

    # Timestamp when ticket was last updated
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Department this ticket belongs to
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )