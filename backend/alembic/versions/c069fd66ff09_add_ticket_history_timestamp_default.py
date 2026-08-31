"""add ticket history timestamp default

Revision ID: c069fd66ff09
Revises: 757510f7888c
Create Date: 2026-08-12 10:42:07.720883
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# --------------------------------------------------
# Alembic revision identifiers
# --------------------------------------------------

revision: str = "c069fd66ff09"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "757510f7888c"

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
# Add a PostgreSQL default for ticket history
# timestamps so new history records automatically
# receive the current date and time.
# --------------------------------------------------
def upgrade() -> None:
    op.alter_column(
        "ticket_history",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=sa.text("now()"),
    )


# --------------------------------------------------
# Downgrade
#
# Remove the database default if this migration
# is ever reversed.
# --------------------------------------------------
def downgrade() -> None:
    op.alter_column(
        "ticket_history",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=None,
    )