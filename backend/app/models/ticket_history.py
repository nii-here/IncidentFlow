# app/models/ticket_history.py

# SQLAlchemy column/data type imports
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime

# Used for automatic timestamps
from datetime import datetime

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Ticket history database table
# Stores audit trail events for ticket changes
# --------------------------------------------------
class TicketHistory(Base):

    # SQL table name
    __tablename__ = "ticket_history"

    # History record ID
    id = Column(Integer, primary_key=True, index=True)

    # Ticket this history event belongs to
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)

    # User who performed the action
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Type of action performed
    # Examples: status_changed, assigned, archived, comment_added
    action = Column(String, nullable=False)

    # Previous value before the change
    old_value = Column(Text, nullable=True)

    # New value after the change
    new_value = Column(Text, nullable=True)

    # Timestamp when history event happened
    created_at = Column(DateTime, default=datetime.utcnow)