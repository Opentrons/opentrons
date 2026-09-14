"""add password_set_at.

Revision ID: 754f68036d12
Revises: f37b867e27cf
Create Date: 2026-07-08 17:13:26.028547
"""

from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

import server_utils.sql_utils

# revision identifiers, used by Alembic.
revision: str = "754f68036d12"
down_revision: Union[str, Sequence[str], None] = "f37b867e27cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add the new column. Allow it to be nullable at first so SQLite can add it
    # to a preexisting table.
    op.add_column(
        "user",
        sa.Column(
            "password_set_at",
            server_utils.sql_utils.UTCDateTime(),
            nullable=True,
        ),
    )

    # Populate the new column with actual values.
    # We declare our own mini schema of the user table here to avoid depending
    # on production ORM models, which might change in the future.
    connection = op.get_bind()
    now = datetime.now(timezone.utc)
    user = sa.table(
        "user",
        sa.column("password_set_at", server_utils.sql_utils.UTCDateTime()),
    )
    connection.execute(user.update().values(password_set_at=now))

    # Now that every row of the new column is populated with a value, make it non-nullable.
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.alter_column("password_set_at", nullable=False)
