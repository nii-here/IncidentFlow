# app/routes/auth.py

# FastAPI tools
from fastapi import APIRouter, Depends, HTTPException

# SQLAlchemy database session type
from sqlalchemy.orm import Session

# Password hashing tools
from app.security.passwords import (
    verify_password,
)

# JWT token creation
from app.security.jwt import create_access_token

# Database dependency
from app.database.db import get_db

# User model and schemas
from app.models.user import User
from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
)

# Login form
from fastapi.security import OAuth2PasswordRequestForm

from app.services.admin_entity_service import commit_and_refresh

from app.services.user_service import (
    build_user,
    ensure_unique_email,
)

# --------------------------------------------------
# Create router for authentication routes
# All routes here will belong to auth
# --------------------------------------------------
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# --------------------------------------------------
# Register a new employee account
# POST /auth/register
# --------------------------------------------------
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    # Prevent duplicate email addresses.
    ensure_unique_email(
        db=db,
        email=user_data.email,
    )

    # Public registration always creates an employee.
    new_user = build_user(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password,
        role="employee",
        department_id=None,
        job_title=None,
        phone=None,
    )

    db.add(new_user)

    return commit_and_refresh(
        db=db,
        record=new_user,
    )

# --------------------------------------------------
# Login user
# POST /auth/login
# --------------------------------------------------
@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Find user by email
    # OAuth2 form uses "username", but we treat it as email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check password
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create token with user info
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

