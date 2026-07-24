# app/services/admin_entity_service.py

# Used for creating timezone-aware archive timestamps
from datetime import datetime, timezone

# Generic typing allows these helpers to work with
# Categories, Assignment Groups, Users, and future models
from typing import Any, Type, TypeVar

# FastAPI error response
from fastapi import HTTPException

# SQLAlchemy tools
from sqlalchemy import func
from sqlalchemy.orm import Session


# Represents any SQLAlchemy model type
ModelType = TypeVar("ModelType")


# --------------------------------------------------
# Find one database record or return a 404 error
# --------------------------------------------------
def get_record_or_404(
    db: Session,
    model: Type[ModelType],
    record_id: int,
    error_detail: str,
) -> ModelType:
    record = (
        db.query(model)
        .filter(model.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail=error_detail,
        )

    return record


# --------------------------------------------------
# Check whether another record already uses a name
#
# The comparison is case-insensitive so names such as
# "IT Support" and "it support" are treated as duplicates.
#
# exclude_id is used during updates so a record does not
# conflict with its own existing name.
# --------------------------------------------------
def ensure_unique_name(
    db: Session,
    model: Type[ModelType],
    name: str,
    error_detail: str,
    exclude_id: int | None = None,
) -> None:
    cleaned_name = name.strip()

    query = db.query(model).filter(
        func.lower(model.name) == cleaned_name.lower()
    )

    if exclude_id is not None:
        query = query.filter(model.id != exclude_id)

    existing_record = query.first()

    if existing_record:
        raise HTTPException(
            status_code=400,
            detail=error_detail,
        )


# --------------------------------------------------
# Apply fields from a Pydantic update schema
# --------------------------------------------------
def apply_schema_updates(
    record: ModelType,
    update_schema: Any,
) -> ModelType:
    update_data = update_schema.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        # Clean string values before saving them
        if isinstance(value, str):
            value = value.strip()

        setattr(record, field, value)

    return record


# --------------------------------------------------
# Commit changes and reload the saved record
#
# Rolling back on failure keeps the database session
# usable if PostgreSQL rejects an operation.
# --------------------------------------------------
def commit_and_refresh(
    db: Session,
    record: ModelType,
) -> ModelType:
    try:
        db.commit()
        db.refresh(record)

        return record

    except Exception:
        db.rollback()
        raise


# --------------------------------------------------
# Activate or deactivate a record
# --------------------------------------------------
def set_record_status(
    db: Session,
    record: ModelType,
    active: bool,
) -> ModelType:
    record.active = active

    return commit_and_refresh(
        db=db,
        record=record,
    )


# --------------------------------------------------
# Archive a record without deleting it
# --------------------------------------------------
def archive_record(
    db: Session,
    record: ModelType,
) -> ModelType:
    record.archived_at = datetime.now(timezone.utc)

    return commit_and_refresh(
        db=db,
        record=record,
    )


# --------------------------------------------------
# Restore an archived record
# --------------------------------------------------
def restore_record(
    db: Session,
    record: ModelType,
) -> ModelType:
    record.archived_at = None

    return commit_and_refresh(
        db=db,
        record=record,
    )