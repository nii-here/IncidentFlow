# app/routes/auth.py

# --------------------------------------------------
# FastAPI tools
# --------------------------------------------------

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

# --------------------------------------------------
# Login form
# --------------------------------------------------

from fastapi.security import (
    OAuth2PasswordRequestForm,
)

# --------------------------------------------------
# SQLAlchemy database session type
# --------------------------------------------------

from sqlalchemy.orm import Session

# --------------------------------------------------
# Password hashing tools
# --------------------------------------------------

from app.security.passwords import (
    verify_password,
)

# --------------------------------------------------
# JWT tools
#
# create_access_token:
# - creates the login token
#
# get_current_user:
# - reads the bearer token
# - validates it
# - returns the logged-in User
# --------------------------------------------------

from app.security.jwt import (
    create_access_token,
    get_current_user,
)

# --------------------------------------------------
# Database dependency
# --------------------------------------------------

from app.database.db import get_db

# --------------------------------------------------
# User model
# --------------------------------------------------

from app.models.user import User

# --------------------------------------------------
# User schemas
# --------------------------------------------------

from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
)

# --------------------------------------------------
# Shared administration helper
# --------------------------------------------------

from app.services.admin_entity_service import (
    commit_and_refresh,
)

# --------------------------------------------------
# User service helpers
# --------------------------------------------------

from app.services.user_service import (
    build_user,
    ensure_unique_email,
)


# ==================================================
# AUTH ROUTER
# ==================================================

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


# ==================================================
# REGISTER
# ==================================================
#
# Register a new employee account.
#
# Public registration always creates an employee.
#
# POST /auth/register
# ==================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------
    # Prevent duplicate email addresses
    # --------------------------------------------------

    ensure_unique_email(
        db=db,
        email=user_data.email,
    )


    # --------------------------------------------------
    # Public registration always creates an employee
    # --------------------------------------------------

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


# ==================================================
# LOGIN
# ==================================================
#
# OAuth2 uses a field named "username".
#
# IncidentFlow treats that field as the user's email.
#
# POST /auth/login
# ==================================================

@router.post(
    "/login"
)
def login_user(
    form_data:
        OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------
    # Find user by email
    # --------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email
            == form_data.username
        )
        .first()
    )


    # --------------------------------------------------
    # Account does not exist
    # --------------------------------------------------

    if not user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )


    # --------------------------------------------------
    # Archived accounts cannot log in
    # --------------------------------------------------

    if user.archived_at is not None:
        raise HTTPException(
            status_code=403,
            detail=(
                "This account has been archived"
            ),
        )


    # --------------------------------------------------
    # Inactive accounts cannot log in
    # --------------------------------------------------

    if not user.active:
        raise HTTPException(
            status_code=403,
            detail=(
                "This account is inactive"
            ),
        )


    # --------------------------------------------------
    # Verify password
    # --------------------------------------------------

    if not verify_password(
        form_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )


    # --------------------------------------------------
    # Create access token
    #
    # We include basic authorization information in
    # the token.
    #
    # The frontend should still use /auth/me to get
    # the current user instead of treating JWT claims
    # as its main user profile.
    # --------------------------------------------------

    access_token = create_access_token(
        data={
            "sub":
                user.email,

            "user_id":
                user.id,

            "role":
                user.role,
        }
    )


    return {
        "access_token":
            access_token,

        "token_type":
            "bearer",
    }


# ==================================================
# CURRENT USER
# ==================================================
#
# Returns the currently authenticated IncidentFlow
# user.
#
# The frontend can call this:
#
# - immediately after login
# - when the browser refreshes
# - whenever it needs reliable current-user details
#
# This allows the frontend to know things such as:
#
# - user ID
# - name
# - email
# - role
# - department
#
# GET /auth/me
# ==================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_logged_in_user(
    current_user: User = Depends(
        get_current_user
    ),
):

    return current_user