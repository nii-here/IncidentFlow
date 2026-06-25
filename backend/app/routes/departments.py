# app/routes/departments.py

# FastAPI tools
from fastapi import APIRouter, Depends, HTTPException

# SQLAlchemy database session type
from sqlalchemy.orm import Session

# Database dependency
from app.database.db import get_db

# Department model and schemas
from app.models.department import Department
from app.schemas.department_schema import DepartmentCreate, DepartmentResponse

# Admin-only permission helper
from app.routes.auth import require_it_admin

# User model for type hinting
from app.models.user import User


# --------------------------------------------------
# Create router for department routes
# --------------------------------------------------
router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


# --------------------------------------------------
# Create department
# Only IT admins can create departments
# POST /departments
# --------------------------------------------------
@router.post("/", response_model=DepartmentResponse)
def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin)
):

    # Check if department already exists
    existing_department = db.query(Department).filter(
        Department.name == department_data.name
    ).first()

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail="Department already exists"
        )

    # Create new department
    new_department = Department(
        name=department_data.name
    )

    # Save department to database
    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    return new_department


# --------------------------------------------------
# Get all departments
# Logged-in/admin users can view department list later
# For now, IT admin protected
# GET /departments
# --------------------------------------------------
@router.get("/", response_model=list[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin)
):

    # Return all departments
    departments = db.query(Department).all()

    return departments