"""upgrade ticket conversation model

Revision ID: 6b6c3692cdd7
Revises: c069fd66ff09
Create Date: 2026-08-23 06:51:21.731735
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# --------------------------------------------------
# Alembic revision identifiers
# --------------------------------------------------

revision: str = "6b6c3692cdd7"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "c069fd66ff09"

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
# Expands ticket_comments into a real conversation
# model that can support:
#
# - IT user comments
# - Requester/person replies
# - Internal notes
# - Public replies
# - Portal messages
# - Future email replies
# - Future system-generated entries
# --------------------------------------------------

def upgrade() -> None:

    # --------------------------------------------------
    # Add requester/person author support
    # --------------------------------------------------

    op.add_column(
        "ticket_comments",
        sa.Column(
            "person_id",
            sa.Integer(),
            nullable=True,
        ),
    )


    # --------------------------------------------------
    # Add comment visibility
    #
    # internal = IT-only note
    # public   = requester-visible reply
    # --------------------------------------------------

    op.add_column(
        "ticket_comments",
        sa.Column(
            "visibility",
            sa.String(),
            nullable=False,
            server_default="internal",
        ),
    )


    # --------------------------------------------------
    # Add comment source
    #
    # portal = written inside IncidentFlow
    # email  = future inbound email reply
    # system = future system-generated entry
    # --------------------------------------------------

    op.add_column(
        "ticket_comments",
        sa.Column(
            "source",
            sa.String(),
            nullable=False,
            server_default="portal",
        ),
    )


    # --------------------------------------------------
    # Allow comments without a User account
    #
    # Requesters may exist only as Person records,
    # so user_id can no longer be required.
    # --------------------------------------------------

    op.alter_column(
        "ticket_comments",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


    # --------------------------------------------------
    # Fix created_at database default
    #
    # The column is NOT NULL, so PostgreSQL should
    # automatically create the timestamp.
    # --------------------------------------------------

    op.alter_column(
        "ticket_comments",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=sa.text("now()"),
    )


    # --------------------------------------------------
    # Person lookup index
    # --------------------------------------------------

    op.create_index(
        op.f("ix_ticket_comments_person_id"),
        "ticket_comments",
        ["person_id"],
        unique=False,
    )


    # --------------------------------------------------
    # Person foreign key
    # --------------------------------------------------

    op.create_foreign_key(
        "fk_ticket_comments_person_id_people",
        "ticket_comments",
        "people",
        ["person_id"],
        ["id"],
    )


    # --------------------------------------------------
    # Database validation
    #
    # These rules protect the data even if a bug
    # accidentally bypasses application validation.
    # --------------------------------------------------

    op.create_check_constraint(
        "ck_ticket_comments_visibility",
        "ticket_comments",
        "visibility IN ('internal', 'public')",
    )

    op.create_check_constraint(
        "ck_ticket_comments_source",
        "ticket_comments",
        "source IN ('portal', 'email', 'system')",
    )

    op.create_check_constraint(
        "ck_ticket_comments_single_author",
        "ticket_comments",
        "NOT (user_id IS NOT NULL AND person_id IS NOT NULL)",
    )


# --------------------------------------------------
# Downgrade
#
# Returns ticket_comments to the previous structure.
# --------------------------------------------------

def downgrade() -> None:

    # Remove validation rules first.
    op.drop_constraint(
        "ck_ticket_comments_single_author",
        "ticket_comments",
        type_="check",
    )

    op.drop_constraint(
        "ck_ticket_comments_source",
        "ticket_comments",
        type_="check",
    )

    op.drop_constraint(
        "ck_ticket_comments_visibility",
        "ticket_comments",
        type_="check",
    )


    # Remove person relationship.
    op.drop_constraint(
        "fk_ticket_comments_person_id_people",
        "ticket_comments",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_ticket_comments_person_id"),
        table_name="ticket_comments",
    )


    # Remove the automatic timestamp default.
    op.alter_column(
        "ticket_comments",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
        server_default=None,
    )


    # Restore user_id to its original requirement.
    op.alter_column(
        "ticket_comments",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


    # Remove new conversation fields.
    op.drop_column(
        "ticket_comments",
        "source",
    )

    op.drop_column(
        "ticket_comments",
        "visibility",
    )

    op.drop_column(
        "ticket_comments",
        "person_id",
    )