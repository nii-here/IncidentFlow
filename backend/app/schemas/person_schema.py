# app/schemas/person_schema.py

from datetime import datetime

from pydantic import BaseModel, EmailStr


# --------------------------------------------------
# Create a person/requester
#
# Used when IT adds an employee who does not yet
# have an IncidentFlow login account.
# --------------------------------------------------
class PersonCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: int | None = None


# --------------------------------------------------
# Person returned by the API
# --------------------------------------------------
class PersonResponse(BaseModel):
    id: int

    name: str
    email: EmailStr

    department_id: int | None

    active: bool
    archived_at: datetime | None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --------------------------------------------------
# Lightweight requester result
#
# Used by the New Ticket requester search.
# --------------------------------------------------
class PersonRequesterResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    department_id: int | None

    class Config:
        from_attributes = True