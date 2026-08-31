# app/routes/people.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------
from fastapi import APIRouter, Depends, HTTPException

# --------------------------------------------------
# SQLAlchemy
# --------------------------------------------------
from sqlalchemy import func
from sqlalchemy.orm import Session

# --------------------------------------------------
# Database
# --------------------------------------------------
from app.database.db import get_db

# --------------------------------------------------
# Models
# --------------------------------------------------
from app.models.department import Department
from app.models.person import Person
from app.models.user import User

# --------------------------------------------------
# Schemas
# --------------------------------------------------
from app.schemas.person_schema import (
    PersonCreate,
    PersonRequesterResponse,
    PersonResponse,
)

# --------------------------------------------------
# Permissions
# --------------------------------------------------
from app.security.permissions import require_it_staff_or_admin

# --------------------------------------------------
# Shared helpers
# --------------------------------------------------
from app.services.admin_entity_service import commit_and_refresh


router = APIRouter(
    prefix="/people",
    tags=["People"],
)


# --------------------------------------------------
# Get available requesters
#
# Used by IT staff/admins when creating tickets.
# Only active, non-archived people are returned.
# --------------------------------------------------
@router.get(
    "/requesters",
    response_model=list[PersonRequesterResponse],
)
def get_requesters(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_staff_or_admin),
):
    people = (
        db.query(Person)
        .filter(
            Person.active.is_(True),
            Person.archived_at.is_(None),
        )
        .order_by(Person.name.asc())
        .all()
    )

    return people


# --------------------------------------------------
# Add a person
#
# This does NOT create a login account.
#
# IT can use this when creating a ticket for someone
# who does not yet have an IncidentFlow account.
# --------------------------------------------------
@router.post(
    "/",
    response_model=PersonResponse,
    status_code=201,
)
def create_person(
    person_data: PersonCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_staff_or_admin),
):
    cleaned_name = person_data.name.strip()
    cleaned_email = str(person_data.email).strip().lower()

    # Name cannot be blank after trimming spaces.
    if not cleaned_name:
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    # Prevent duplicate people with the same email.
    existing_person = (
        db.query(Person)
        .filter(
            func.lower(Person.email)
            == cleaned_email
        )
        .first()
    )

    if existing_person:
        raise HTTPException(
            status_code=400,
            detail="A person with this email already exists.",
        )

    # Validate department if one was selected.
    if person_data.department_id is not None:
        department = (
            db.query(Department)
            .filter(
                Department.id
                == person_data.department_id
            )
            .first()
        )

        if not department:
            raise HTTPException(
                status_code=404,
                detail="Department not found.",
            )

        if department.archived_at is not None:
            raise HTTPException(
                status_code=400,
                detail="Archived departments cannot be assigned.",
            )

        if not department.active:
            raise HTTPException(
                status_code=400,
                detail="Inactive departments cannot be assigned.",
            )

    new_person = Person(
        name=cleaned_name,
        email=cleaned_email,
        department_id=person_data.department_id,
    )

    db.add(new_person)

    return commit_and_refresh(
        db=db,
        record=new_person,
    )