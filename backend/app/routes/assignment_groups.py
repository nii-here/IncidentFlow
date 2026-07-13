# app/routes/assignment_groups.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.assignment_group import AssignmentGroup
from app.models.user import User
from app.schemas.assignment_group_schema import (
    AssignmentGroupCreate,
    AssignmentGroupResponse
)
from app.routes.auth import require_it_admin, get_current_user


router = APIRouter(
    prefix="/assignment-groups",
    tags=["Assignment Groups"]
)


@router.post("/", response_model=AssignmentGroupResponse)
def create_assignment_group(
    group_data: AssignmentGroupCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin)
):
    existing_group = db.query(AssignmentGroup).filter(
        AssignmentGroup.name == group_data.name
    ).first()

    if existing_group:
        raise HTTPException(
            status_code=400,
            detail="Assignment group already exists"
        )

    new_group = AssignmentGroup(
        name=group_data.name,
        description=group_data.description,
        manager_id=group_data.manager_id,
        display_order=group_data.display_order
    )

    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    return new_group


@router.get("/", response_model=list[AssignmentGroupResponse])
def get_assignment_groups(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    groups = db.query(AssignmentGroup).filter(
        AssignmentGroup.active == True
    ).order_by(AssignmentGroup.display_order.asc()).all()

    return groups