"""extend user accounts for administration

Revision ID: dc78e879ee57
Revises: 70dbaec93300
Create Date: 2026-07-21 13:31:47.171528

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc78e879ee57'
down_revision: Union[str, Sequence[str], None] = '70dbaec93300'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add account administration fields to existing users."""

    # Optional organization information
    op.add_column(
        "users",
        sa.Column("job_title", sa.String(), nullable=True),
    )

    op.add_column(
        "users",
        sa.Column("phone", sa.String(), nullable=True),
    )

    # The server default ensures all existing users become active
    # when this non-nullable column is added.
    op.add_column(
        "users",
        sa.Column(
            "active",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )

    # Archiving and account activity timestamps
    op.add_column(
        "users",
        sa.Column(
            "archived_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "last_login_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Protect the migration in case an older user record has
    # a null role before making the column required.
    op.execute(
        """
        UPDATE users
        SET role = 'employee'
        WHERE role IS NULL
        """
    )

    op.alter_column(
        "users",
        "role",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )


def downgrade() -> None:
    """Remove account administration fields from users."""

    op.alter_column(
        "users",
        "role",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.drop_column("users", "last_login_at")
    op.drop_column("users", "updated_at")
    op.drop_column("users", "created_at")
    op.drop_column("users", "archived_at")
    op.drop_column("users", "active")
    op.drop_column("users", "phone")
    op.drop_column("users", "job_title")
    # ### end Alembic commands ###
