# app/schemas/user_schema.py

# Pydantic BaseModel import
from pydantic import BaseModel, EmailStr


# --------------------------------------------------
# Schema used when creating a new user
# Example:
# register account
# --------------------------------------------------
class UserCreate(BaseModel):

    # User full name
    name: str

    # User email address
    email: EmailStr

    # Plain password from request
    password: str


# --------------------------------------------------
# Schema used when returning user data
# This prevents password hashes from being exposed
# --------------------------------------------------
class UserResponse(BaseModel):

    # User ID
    id: int

    # User name
    name: str

    # User email
    email: EmailStr

    # User role
    role: str

    # Department ID this user belongs to 
    department_id: int | None


    # --------------------------------------------------
    # Allows compatibility with SQLAlchemy models
    # --------------------------------------------------
    class Config:
        from_attributes = True

# --------------------------------------------------
# Schema used by IT admin to update a user's role/department
# --------------------------------------------------
class UserAdminUpdate(BaseModel):

    # User role
    # Allowed examples:
    # employee, it_staff, it_admin
    role: str | None = None

    # Department ID the user belongs to
    department_id: int | None = None