"""add temporary_hashed_password column; allow null hashed_password.

Revision ID: c3a91d4e2b70
Revises: b8c4e2f1a903
Create Date: 2026-09-23 10:45:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3a91d4e2b70"
down_revision: Union[str, Sequence[str], None] = "b8c4e2f1a903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "temporary_hashed_password",
                sa.String(),
                nullable=True,
            )
        )
        batch_op.alter_column(
            "hashed_password",
            existing_type=sa.String(),
            nullable=True,
        )


def downgrade() -> None:
    """Downgrade schema.

    Before restoring NOT NULL on ``hashed_password``, copy any temporary hash
    into ``hashed_password`` for accounts that never set a permanent password.
    Remaining NULL ``hashed_password`` rows will make the alter fail — those
    accounts are invalid under the pre-migration schema.
    """
    op.execute(
        sa.text(
            """
            UPDATE user
            SET hashed_password = temporary_hashed_password
            WHERE hashed_password IS NULL
              AND temporary_hashed_password IS NOT NULL
            """
        )
    )
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("temporary_hashed_password")
        batch_op.alter_column(
            "hashed_password",
            existing_type=sa.String(),
            nullable=False,
        )
