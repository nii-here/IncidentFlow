# app/routes/auth.py

# FastAPI tools
from fastapi import APIRouter, Depends, HTTPException, status

# SQLAlchemy database session type
from sqlalchemy.orm import Session

# Password hashing tool
from passlib.context import CryptContext

# Database dependency
from app.database.db import get_db

# User model and schemas
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, UserAdminUpdate
from app.models.department import Department

# Login form, token expiration time and JWT creation tools
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import jwt


# --------------------------------------------------
# Create router for authentication routes
# All routes here will belong to auth
# --------------------------------------------------
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


# --------------------------------------------------
# Password hashing setup
# bcrypt is used to safely hash passwords
# --------------------------------------------------
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# --------------------------------------------------
# JWT settings
# SECRET_KEY is used to sign tokens
# In production, this should come from .env
# --------------------------------------------------
SECRET_KEY = "temporary-dev-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --------------------------------------------------
# OAuth2 token setup
# This tells FastAPI where users get their token from
# --------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --------------------------------------------------
# Helper function to hash plain text password
# --------------------------------------------------
def hash_password(password: str):
    return pwd_context.hash(password)

# --------------------------------------------------
# Verify a plain password against the saved hash
# --------------------------------------------------
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# --------------------------------------------------
# Create JWT access token
# This token proves the user is logged in
# --------------------------------------------------
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# --------------------------------------------------
# Register new user
# POST /auth/register
# --------------------------------------------------
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user object with hashed password
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="employee"
    )

    # Save user to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

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

# --------------------------------------------------
# Get current logged-in user from JWT token
# Used to protect routes like tickets
# --------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    # Error returned when token is missing or invalid
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate login credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Get email from token
        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

    except Exception:
        raise credentials_exception

    # Find user in database
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise credentials_exception

    return user

# --------------------------------------------------
# Require user to be IT staff or IT admin
# Used for routes that regular employees cannot access
# --------------------------------------------------
def require_it_staff_or_admin(
    current_user: User = Depends(get_current_user)
):

    # Only IT staff and IT admins can pass this check
    if current_user.role not in ["it_staff", "it_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )

    return current_user

# --------------------------------------------------
# Require user to be IT admin
# Used for admin-only actions like archiving tickets
# --------------------------------------------------
def require_it_admin(
    current_user: User = Depends(get_current_user)
):

    # Only IT admins can pass this check
    if current_user.role != "it_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only IT admins can perform this action"
        )

    return current_user

# --------------------------------------------------
# Admin update user role/department
# Only IT admins can update user roles and departments
# PATCH /auth/users/{user_id}/admin-update
# --------------------------------------------------
@router.patch("/users/{user_id}/admin-update", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    update_data: UserAdminUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin)
):

    # Find user by ID
    user = db.query(User).filter(User.id == user_id).first()

    # Return error if user does not exist
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Update role if provided
    if update_data.role is not None:
        allowed_roles = ["employee", "it_staff", "it_admin"]

        if update_data.role not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail="Invalid role"
            )

        user.role = update_data.role

    # Update department if provided
    if update_data.department_id is not None:
        department = db.query(Department).filter(
            Department.id == update_data.department_id
        ).first()

        if not department:
            raise HTTPException(
                status_code=404,
                detail="Department not found"
            )

        user.department_id = update_data.department_id

    # Save changes
    db.commit()
    db.refresh(user)

    return user