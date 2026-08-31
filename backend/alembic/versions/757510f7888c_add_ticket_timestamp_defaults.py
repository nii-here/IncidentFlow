"""add ticket timestamp defaults

Revision ID: 757510f7888c
Revises: ccc1f7c1a256
Create Date: 2026-08-11 09:48:26.822120
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# --------------------------------------------------
# Alembic revision identifiers
# --------------------------------------------------

revision: str = "757510f7888c"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "ccc1f7c1a256"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


# --------------------------------------------------
# Upgrade
#
# Add PostgreSQL defaults for ticket timestamps.
# This keeps the database in sync with the
# SQLAlchemy Ticket model.
# --------------------------------------------------
def upgrade() -> None:
    op.alter_column(
        "tickets",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=sa.text("now()"),
    )

    op.alter_column(
        "tickets",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=sa.text("now()"),
    )


# --------------------------------------------------
# Downgrade
#
# Remove the timestamp defaults if this migration
# ever needs to be reversed.
# --------------------------------------------------
def downgrade() -> None:
    op.alter_column(
        "tickets",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=None,
    )

    op.alter_column(
        "tickets",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=None,
    )