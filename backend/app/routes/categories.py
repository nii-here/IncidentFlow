# app/routes/categories.py

# FastAPI tools
from fastapi import APIRouter, Depends, HTTPException

# Database session
from sqlalchemy.orm import Session

# Database dependency
from app.database.db import get_db

# Category model and schemas
from app.models.category import Category
from app.schemas.category_schema import CategoryCreate, CategoryResponse, CategoryUpdate

# Auth helpers
from app.routes.auth import require_it_admin, get_current_user

# User model
from app.models.user import User


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post("/", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin)
):
    # Check if category name already exists
    existing_category = db.query(Category).filter(
        Category.name == category_data.name
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    # Create category
    new_category = Category(
        name=category_data.name,
        description=category_data.description,
        icon=category_data.icon,
        color=category_data.color,
        display_order=category_data.display_order
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    # Return only active categories
    categories = (
        db.query(Category)
        .filter(Category.archived_at.is_(None))
        .order_by(Category.display_order.asc())
        .all()
    )
    return categories

@router.get("/archived", response_model=list[CategoryResponse])
def get_archived_categories(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    categories = (
        db.query(Category)
        .filter(Category.archived_at.is_not(None))
        .order_by(Category.name.asc())
        .all()
    )

    return categories

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    update_data = category_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)

    return category

# --------------------------------------------------
# Activate or deactivate a category
# Only IT admins can change category status
# PATCH /categories/{category_id}/status
# --------------------------------------------------
@router.patch("/{category_id}/status", response_model=CategoryResponse)
def update_category_status(
    category_id: int,
    active: bool,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    # Find the category
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    # Return an error if it does not exist
    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Update active status
    category.active = active

    # Save changes
    db.commit()
    db.refresh(category)

    return category

# --------------------------------------------------
# Archive a category
#
# Archived categories are hidden from normal lists,
# but remain in the database for historical records.
# --------------------------------------------------
from datetime import datetime


@router.patch("/{category_id}/archive", response_model=CategoryResponse)
def archive_category(
    category_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found."
        )

    category.archived_at = datetime.utcnow()

    db.commit()
    db.refresh(category)

    return category

@router.patch("/{category_id}/restore", response_model=CategoryResponse)
def restore_category(
    category_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    category.archived_at = None

    db.commit()
    db.refresh(category)

    return category