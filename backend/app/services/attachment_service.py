# app/services/attachment_service.py

# --------------------------------------------------
# Attachment Storage Service
#
# Handles low-level file validation and storage.
#
# IMPORTANT:
# This version uses private local storage for
# development.
#
# Later, this service can be replaced with:
# - Amazon S3
# - Azure Blob Storage
# - another private object storage provider
#
# without changing ticket business logic.
# --------------------------------------------------

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile


# --------------------------------------------------
# Storage configuration
# --------------------------------------------------

# Project-level private storage directory.
#
# Uploaded files should NEVER be placed inside the
# frontend's public/static directory.
STORAGE_ROOT = Path(
    "storage/attachments"
)

STORAGE_ROOT.mkdir(
    parents=True,
    exist_ok=True,
)


# --------------------------------------------------
# Upload limits
# --------------------------------------------------

# Maximum individual attachment size.
#
# 10 MB is a reasonable starting point.
MAX_FILE_SIZE = 10 * 1024 * 1024


# --------------------------------------------------
# Allowed file types
#
# Keep the first version conservative.
# More can be added later if needed.
# --------------------------------------------------

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
    "text/plain",
}


# --------------------------------------------------
# Allowed extensions
#
# Content type alone should not be our only check.
# --------------------------------------------------

ALLOWED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".pdf",
    ".txt",
}


# --------------------------------------------------
# Validate original filename
# --------------------------------------------------

def validate_filename(
    filename: str | None,
) -> str:

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a filename",
        )

    # Remove any directory information.
    #
    # Example:
    #
    # ../../secret.txt
    #
    # becomes:
    #
    # secret.txt
    safe_filename = Path(filename).name

    if not safe_filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename",
        )

    extension = (
        Path(safe_filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "This file type is not allowed"
            ),
        )

    return safe_filename


# --------------------------------------------------
# Validate content type
# --------------------------------------------------

def validate_content_type(
    content_type: str | None,
) -> str:

    if not content_type:
        raise HTTPException(
            status_code=400,
            detail="File content type is missing",
        )

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "This file content type is not allowed"
            ),
        )

    return content_type


# --------------------------------------------------
# Read and validate upload
#
# We read the file so we can enforce the maximum size
# before permanently saving anything.
# --------------------------------------------------

async def read_and_validate_upload(
    file: UploadFile,
) -> tuple[
    bytes,
    str,
    str,
]:
    original_filename = validate_filename(
        file.filename
    )

    content_type = validate_content_type(
        file.content_type
    )

    file_data = await file.read()

    file_size = len(file_data)

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                "Attachment exceeds the "
                "10 MB file size limit"
            ),
        )

    return (
        file_data,
        original_filename,
        content_type,
    )


# --------------------------------------------------
# Generate private storage information
# --------------------------------------------------

def generate_storage_names(
    ticket_id: int,
    original_filename: str,
) -> tuple[
    str,
    str,
]:

    extension = (
        Path(original_filename)
        .suffix
        .lower()
    )

    # Never use the user's filename as the physical
    # storage filename.
    stored_filename = (
        f"{uuid4()}{extension}"
    )

    # Logical storage key saved in PostgreSQL.
    storage_key = (
        f"tickets/"
        f"{ticket_id}/"
        f"attachments/"
        f"{stored_filename}"
    )

    return (
        stored_filename,
        storage_key,
    )


# --------------------------------------------------
# Save file
# --------------------------------------------------

def save_attachment_file(
    file_data: bytes,
    storage_key: str,
) -> Path:

    file_path = (
        STORAGE_ROOT /
        storage_key
    )

    file_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path.write_bytes(
        file_data
    )

    return file_path


# --------------------------------------------------
# Resolve stored attachment
# --------------------------------------------------

def get_attachment_path(
    storage_key: str,
) -> Path:

    file_path = (
        STORAGE_ROOT /
        storage_key
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Attachment file not found",
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Attachment file not found",
        )

    return file_path


# --------------------------------------------------
# Delete stored attachment
#
# Used when database saving fails after the physical
# file has already been written.
# --------------------------------------------------

def delete_attachment_file(
    storage_key: str,
) -> None:

    file_path = (
        STORAGE_ROOT /
        storage_key
    )

    if file_path.exists():
        file_path.unlink()