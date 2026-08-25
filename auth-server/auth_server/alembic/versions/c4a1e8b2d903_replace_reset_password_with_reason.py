"""replace reset_password flag with reset_password_reason.

Revision ID: c4a1e8b2d903
Revises: b8c4e2f1a903
Create Date: 2026-08-25 18:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4a1e8b2d903"
down_revision: Union[str, Sequence[str], None] = "b8c4e2f1a903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("reset_password_reason", sa.String(), nullable=True)
        )

    op.execute(
        "UPDATE user SET reset_password_reason = 'ADMIN_FORCED' WHERE reset_password = 1"
    )

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("reset_password")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "reset_password",
                sa.Boolean(),
                server_default=sa.false(),
                nullable=False,
            )
        )

    op.execute(
        "UPDATE user SET reset_password = 1 WHERE reset_password_reason IS NOT NULL"
    )

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("reset_password_reason")
