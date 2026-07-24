# app/services/user_service.py

# --------------------------------------------------
# FastAPI
# --------------------------------------------------
from fastapi import HTTPException

# --------------------------------------------------
# SQLAlchemy
# --------------------------------------------------
from sqlalchemy.orm import Session

# --------------------------------------------------
# Models
# --------------------------------------------------
from app.models.department import Department
from app.models.user import User

# --------------------------------------------------
# Security
# --------------------------------------------------
from app.security.passwords import hash_password


# --------------------------------------------------
# Make sure an email address is not already in use
#
# exclude_id allows a user to keep their existing
# email address when their account is updated.
# --------------------------------------------------
def ensure_unique_email(
    db: Session,
    email: str,
    exclude_id: int | None = None,
) -> None:
    cleaned_email = email.strip().lower()

    query = db.query(User).filter(
        User.email.ilike(cleaned_email)
    )

    if exclude_id is not None:
        query = query.filter(User.id != exclude_id)

    existing_user = query.first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email address already exists.",
        )


# --------------------------------------------------
# Validate a department ID
#
# A null department is allowed. When an ID is given,
# the department must exist in the database.
# --------------------------------------------------
def validate_department(
    db: Session,
    department_id: int | None,
) -> None:
    if department_id is None:
        return

    department = (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )

    if department is None:
        raise HTTPException(
            status_code=404,
            detail="Department not found.",
        )


# --------------------------------------------------
# Create a new User model
#
# Password hashing happens here so the route does not
# need to know how passwords are secured.
# --------------------------------------------------
def build_user(
    *,
    name: str,
    email: str,
    password: str,
    role: str,
    department_id: int | None,
    job_title: str | None,
    phone: str | None,
) -> User:
    return User(
        name=name.strip(),
        email=email.strip().lower(),
        password_hash=hash_password(password),
        role=role,
        department_id=department_id,
        job_title=job_title.strip() if job_title else None,
        phone=phone.strip() if phone else None,
    )