# app/schemas/assignment_group_schema.py

from datetime import datetime

from pydantic import BaseModel


# --------------------------------------------------
# Data required to create an assignment group
# --------------------------------------------------
class AssignmentGroupCreate(BaseModel):
    name: str
    description: str | None = None
    manager_id: int | None = None
    display_order: int = 0


# --------------------------------------------------
# Data allowed when editing an assignment group
# --------------------------------------------------
class AssignmentGroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    manager_id: int | None = None
    display_order: int | None = None
    active: bool | None = None


# --------------------------------------------------
# Assignment group data returned by the API
# --------------------------------------------------
class AssignmentGroupResponse(BaseModel):
    id: int
    name: str
    description: str | None
    manager_id: int | None
    active: bool
    archived_at: datetime | None
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True