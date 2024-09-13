"""Migrate the persistence directory from schema 6 to 7.

Summary of changes from schema 6:

- Adds a new command_intent to store the commands intent in the commands table
"""

import json
from pathlib import Path
from contextlib import ExitStack
import shutil
from typing import Any

import sqlalchemy

from ..database import sql_engine_ctx, sqlite_rowid
from ..tables import schema_7
from .._folder_migrator import Migration

from ..file_and_directory_names import (
    DB_FILE,
)


class Migration6to7(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 6 to 7."""
        # Copy over all existing directories and files to new version
        for item in source_dir.iterdir():
            if item.is_dir():
                shutil.copytree(src=item, dst=dest_dir / item.name)
            else:
                shutil.copy(src=item, dst=dest_dir / item.name)

        dest_db_file = dest_dir / DB_FILE

        # Append the new column to existing protocols in v4 database
        with ExitStack() as exit_stack:
            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))

            schema_7.metadata.create_all(dest_engine)

            dest_transaction = exit_stack.enter_context(dest_engine.begin())

            def add_column(
                engine: sqlalchemy.engine.Engine,
                table_name: str,
                column: Any,
            ) -> None:
                column_type = column.type.compile(engine.dialect)
                engine.execute(
                    f"ALTER TABLE {table_name} ADD COLUMN {column.key} {column_type}"
                )

            add_column(
                dest_engine,
                schema_7.run_command_table.name,
                schema_7.run_command_table.c.command_intent,
            )

            _migrate_command_table_with_new_command_intent_col(
                dest_transaction=dest_transaction
            )


def _migrate_command_table_with_new_command_intent_col(
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Add a new 'command_intent' column to run_command_table table."""
    select_commands = sqlalchemy.select(schema_7.run_command_table).order_by(
        sqlite_rowid
    )
    for row in dest_transaction.execute(select_commands).all():
        data = json.loads(row.command)
        new_command_intent = (
            # Account for old_row.command["intent"] being NULL.
            "protocol"
            if "intent" not in row.command or data["intent"] == None  # noqa: E711
            else data["intent"]
        )

        dest_transaction.execute(
            f"UPDATE run_command SET command_intent='{new_command_intent}' WHERE row_id={row.row_id}"
        )
