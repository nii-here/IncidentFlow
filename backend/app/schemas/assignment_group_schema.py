# app/schemas/assignment_group_schema.py

from pydantic import BaseModel
from datetime import datetime


class AssignmentGroupCreate(BaseModel):
    name: str
    description: str | None = None
    manager_id: int | None = None
    display_order: int = 0


class AssignmentGroupResponse(BaseModel):
    id: int
    name: str
    description: str | None
    manager_id: int | None
    active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True