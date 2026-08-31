"""add requester to tickets

Revision ID: aec89f42d547
Revises: 88118ee441ce
Create Date: 2026-08-10 11:43:20.238189
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# --------------------------------------------------
# Alembic revision identifiers
# --------------------------------------------------

revision: str = "aec89f42d547"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "88118ee441ce"

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
# --------------------------------------------------
def upgrade() -> None:
    # --------------------------------------------------
    # Step 1:
    # Add requester_id as nullable first.
    #
    # Existing tickets do not have this value yet,
    # so making it required immediately would fail.
    # --------------------------------------------------
    op.add_column(
        "tickets",
        sa.Column(
            "requester_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # --------------------------------------------------
    # Step 2:
    # Existing tickets were originally created under
    # the assumption that the creator was also the
    # requester.
    #
    # Preserve that behavior by copying created_by
    # into requester_id.
    # --------------------------------------------------
    op.execute(
        """
        UPDATE tickets
        SET requester_id = created_by
        WHERE requester_id IS NULL
        """
    )

    # --------------------------------------------------
    # Step 3:
    # Every ticket must now have a requester.
    # --------------------------------------------------
    op.alter_column(
        "tickets",
        "requester_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # --------------------------------------------------
    # Step 4:
    # Add index for requester lookups.
    # --------------------------------------------------
    op.create_index(
        "ix_tickets_requester_id",
        "tickets",
        ["requester_id"],
        unique=False,
    )

    # --------------------------------------------------
    # Step 5:
    # requester_id must reference a real user.
    #
    # Giving the constraint a name makes the
    # downgrade predictable.
    # --------------------------------------------------
    op.create_foreign_key(
        "fk_tickets_requester_id_users",
        "tickets",
        "users",
        ["requester_id"],
        ["id"],
    )


# --------------------------------------------------
# Downgrade
# --------------------------------------------------
def downgrade() -> None:
    op.drop_constraint(
        "fk_tickets_requester_id_users",
        "tickets",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_tickets_requester_id",
        table_name="tickets",
    )

    op.drop_column(
        "tickets",
        "requester_id",
    )