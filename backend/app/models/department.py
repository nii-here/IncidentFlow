# app/models/department.py

# SQLAlchemy column/data type imports
from sqlalchemy import Column, Integer, String

# Import shared Base class
from app.database.db import Base


# --------------------------------------------------
# Department database table
# Represents company departments like IT, HR, Finance
# --------------------------------------------------
class Department(Base):

    # SQL table name
    __tablename__ = "departments"

    # Department ID
    id = Column(Integer, primary_key=True, index=True)

    # Department name
    # Example: IT, HR, Finance
    name = Column(String, unique=True, nullable=False)