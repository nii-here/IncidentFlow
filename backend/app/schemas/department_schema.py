# app/schemas/department_schema.py

# Pydantic BaseModel impact
from pydantic import BaseModel

# ------------------------------------------
# Schema used when creating a department
# ------------------------------------------
class DepartmentCreate(BaseModel):

    # Department name
    # Example: IT, HR, Finance
    name: str

# -------------------------------------------
# Schema used when returning department data
# -------------------------------------------
class DepartmentResponse(BaseModel):

    # Department ID
    id: int

    # Department name
    name: str

    # Allows compatibility with SQLAlchemy models
    class Config:
        from_attributes = True