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
    """Downgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("temporary_hashed_password")
        batch_op.alter_column(
            "hashed_password",
            existing_type=sa.String(),
            nullable=False,
        )
