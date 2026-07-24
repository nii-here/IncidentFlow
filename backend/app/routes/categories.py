# app/routes/categories.py

# FastAPI tools
from fastapi import APIRouter, Depends

# Database session
from sqlalchemy.orm import Session

# Database dependency
from app.database.db import get_db

# Category model and schemas
from app.models.category import Category
from app.schemas.category_schema import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)

# Authentication helpers
from app.security.jwt import get_current_user

from app.security.permissions import require_it_admin

# Shared administration service helpers
from app.services.admin_entity_service import (
    apply_schema_updates,
    archive_record,
    commit_and_refresh,
    ensure_unique_name,
    get_record_or_404,
    restore_record,
    set_record_status,
)

# User model
from app.models.user import User


# --------------------------------------------------
# Category router
# --------------------------------------------------
router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


# --------------------------------------------------
# Create a category
#
# Only IT admins can create categories.
# --------------------------------------------------
@router.post("/", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    # Prevent duplicate names, including differences
    # in capitalization such as "Hardware" and "hardware".
    ensure_unique_name(
        db=db,
        model=Category,
        name=category_data.name,
        error_detail="Category already exists",
    )

    # Create the new category record
    new_category = Category(
        name=category_data.name.strip(),
        description=category_data.description,
        icon=category_data.icon,
        color=category_data.color,
        display_order=category_data.display_order,
    )

    db.add(new_category)

    return commit_and_refresh(
        db=db,
        record=new_category,
    )


# --------------------------------------------------
# Get normal categories
#
# Archived categories are excluded.
# Any logged-in user can view this list.
# --------------------------------------------------
@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    categories = (
        db.query(Category)
        .filter(Category.archived_at.is_(None))
        .order_by(Category.display_order.asc())
        .all()
    )

    return categories


# --------------------------------------------------
# Get archived categories
# --------------------------------------------------
@router.get(
    "/archived",
    response_model=list[CategoryResponse],
)
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


# --------------------------------------------------
# Update a category
#
# Only IT admins can update categories.
# --------------------------------------------------
@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = get_record_or_404(
        db=db,
        model=Category,
        record_id=category_id,
        error_detail="Category not found.",
    )

    # Only check for a duplicate when the request
    # includes a new category name.
    if category_data.name is not None:
        ensure_unique_name(
            db=db,
            model=Category,
            name=category_data.name,
            exclude_id=category.id,
            error_detail="Category already exists",
        )

    apply_schema_updates(
        record=category,
        update_schema=category_data,
    )

    return commit_and_refresh(
        db=db,
        record=category,
    )


# --------------------------------------------------
# Activate or deactivate a category
#
# PATCH /categories/{category_id}/status?active=true
# --------------------------------------------------
@router.patch(
    "/{category_id}/status",
    response_model=CategoryResponse,
)
def update_category_status(
    category_id: int,
    active: bool,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = get_record_or_404(
        db=db,
        model=Category,
        record_id=category_id,
        error_detail="Category not found",
    )

    return set_record_status(
        db=db,
        record=category,
        active=active,
    )


# --------------------------------------------------
# Archive a category
#
# The category remains in the database so older
# tickets can continue referencing it.
# --------------------------------------------------
@router.patch(
    "/{category_id}/archive",
    response_model=CategoryResponse,
)
def archive_category(
    category_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = get_record_or_404(
        db=db,
        model=Category,
        record_id=category_id,
        error_detail="Category not found.",
    )

    return archive_record(
        db=db,
        record=category,
    )


# --------------------------------------------------
# Restore an archived category
# --------------------------------------------------
@router.patch(
    "/{category_id}/restore",
    response_model=CategoryResponse,
)
def restore_category(
    category_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_it_admin),
):
    category = get_record_or_404(
        db=db,
        model=Category,
        record_id=category_id,
        error_detail="Category not found.",
    )

    return restore_record(
        db=db,
        record=category,
    )