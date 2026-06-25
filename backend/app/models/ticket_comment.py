# app/models/ticket_comment.py

# SQLAlchemy column/data type imports
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime

# Used for automatic timestamps
from datetime import datetime

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Ticket comment database table
# Stores notes/comments added to tickets
# --------------------------------------------------
class TicketComment(Base):

    # SQL table name
    __tablename__ = "ticket_comments"

    # Comment ID
    id = Column(Integer, primary_key=True, index=True)

    # Ticket this comment belongs to
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)

    # User who wrote the comment
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Comment/note text
    comment = Column(Text, nullable=False)

    # Timestamp when comment was created
    created_at = Column(DateTime, default=datetime.utcnow)