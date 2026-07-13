# app/schemas/category_schema.py

from pydantic import BaseModel
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    display_order: int = 0

class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    display_order: int | None = None
    active: bool | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    icon: str | None
    color: str | None
    active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True