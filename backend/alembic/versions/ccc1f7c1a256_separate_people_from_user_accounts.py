"""separate people from user accounts

Revision ID: ccc1f7c1a256
Revises: aec89f42d547
Create Date: 2026-08-10 14:12:52.865762
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# --------------------------------------------------
# Alembic revision identifiers
# --------------------------------------------------

revision: str = "ccc1f7c1a256"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "aec89f42d547"

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
    # Create the new people table.
    #
    # A Person represents someone who can have tickets,
    # even if they do not have an IncidentFlow account.
    # --------------------------------------------------
    op.create_table(
        "people",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "email",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "department_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),

        sa.Column(
            "archived_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["department_id"],
            ["departments.id"],
        ),

        sa.PrimaryKeyConstraint("id"),
    )


    # --------------------------------------------------
    # Step 2:
    # Add indexes for common Person lookups.
    # --------------------------------------------------
    op.create_index(
        "ix_people_department_id",
        "people",
        ["department_id"],
        unique=False,
    )

    op.create_index(
        "ix_people_email",
        "people",
        ["email"],
        unique=True,
    )

    op.create_index(
        "ix_people_id",
        "people",
        ["id"],
        unique=False,
    )


    # --------------------------------------------------
    # Step 3:
    # Add person_id to existing User accounts.
    #
    # It stays nullable because a Person does not need
    # a User account, and we may support account linking
    # separately in the future.
    # --------------------------------------------------
    op.add_column(
        "users",
        sa.Column(
            "person_id",
            sa.Integer(),
            nullable=True,
        ),
    )


    # --------------------------------------------------
    # Step 4:
    # Copy every existing User into People.
    #
    # IMPORTANT:
    # We intentionally preserve the User ID as the
    # Person ID.
    #
    # Example:
    #
    # User #4 -> Person #4
    #
    # This means existing tickets already containing
    # requester_id = 4 continue pointing at the correct
    # person after we change the foreign key.
    # --------------------------------------------------
    op.execute(
        """
        INSERT INTO people (
            id,
            name,
            email,
            department_id,
            active,
            archived_at,
            created_at,
            updated_at
        )
        SELECT
            id,
            name,
            email,
            department_id,
            active,
            archived_at,
            created_at,
            updated_at
        FROM users
        """
    )


    # --------------------------------------------------
    # Step 5:
    # Link every existing login account to its newly
    # created Person record.
    # --------------------------------------------------
    op.execute(
        """
        UPDATE users
        SET person_id = id
        """
    )


    # --------------------------------------------------
    # Step 6:
    # Because we inserted explicit Person IDs, move the
    # PostgreSQL sequence forward so the next manually
    # created Person receives a new unused ID.
    # --------------------------------------------------
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('people', 'id'),
            COALESCE(
                (SELECT MAX(id) FROM people),
                1
            ),
            EXISTS (
                SELECT 1
                FROM people
            )
        )
        """
    )


    # --------------------------------------------------
    # Step 7:
    # Add the User -> Person relationship.
    #
    # unique=True means one login account can be linked
    # to one Person record.
    # --------------------------------------------------
    op.create_index(
        "ix_users_person_id",
        "users",
        ["person_id"],
        unique=True,
    )

    op.create_foreign_key(
        "fk_users_person_id_people",
        "users",
        "people",
        ["person_id"],
        ["id"],
    )


    # --------------------------------------------------
    # Step 8:
    # Remove the old Ticket requester relationship.
    #
    # requester_id currently references users.id.
    # --------------------------------------------------
    op.drop_constraint(
        "fk_tickets_requester_id_users",
        "tickets",
        type_="foreignkey",
    )


    # --------------------------------------------------
    # Step 9:
    # Make requester_id reference people.id instead.
    #
    # Because Person IDs were copied directly from User
    # IDs, existing requester values remain valid.
    # --------------------------------------------------
    op.create_foreign_key(
        "fk_tickets_requester_id_people",
        "tickets",
        "people",
        ["requester_id"],
        ["id"],
    )


# --------------------------------------------------
# Downgrade
# --------------------------------------------------
def downgrade() -> None:

    # --------------------------------------------------
    # Before reverting, translate requester Person IDs
    # back to their linked User IDs.
    #
    # This protects tickets if User and Person IDs no
    # longer happen to match.
    # --------------------------------------------------
    op.execute(
        """
        UPDATE tickets AS ticket
        SET requester_id = account.id
        FROM users AS account
        WHERE account.person_id = ticket.requester_id
        """
    )


    # --------------------------------------------------
    # A Person created without a login account cannot be
    # converted back into the old User-only architecture.
    #
    # Fail safely instead of silently corrupting tickets.
    # --------------------------------------------------
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM tickets AS ticket
                LEFT JOIN users AS account
                    ON account.id = ticket.requester_id
                WHERE account.id IS NULL
            ) THEN
                RAISE EXCEPTION
                    'Cannot downgrade: one or more ticket requesters do not have User accounts.';
            END IF;
        END
        $$;
        """
    )


    # --------------------------------------------------
    # Restore Ticket -> User requester relationship.
    # --------------------------------------------------
    op.drop_constraint(
        "fk_tickets_requester_id_people",
        "tickets",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_tickets_requester_id_users",
        "tickets",
        "users",
        ["requester_id"],
        ["id"],
    )


    # --------------------------------------------------
    # Remove User -> Person relationship.
    # --------------------------------------------------
    op.drop_constraint(
        "fk_users_person_id_people",
        "users",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_users_person_id",
        table_name="users",
    )

    op.drop_column(
        "users",
        "person_id",
    )


    # --------------------------------------------------
    # Remove People table and indexes.
    # --------------------------------------------------
    op.drop_index(
        "ix_people_id",
        table_name="people",
    )

    op.drop_index(
        "ix_people_email",
        table_name="people",
    )

    op.drop_index(
        "ix_people_department_id",
        table_name="people",
    )

    op.drop_table(
        "people",
    )