"""Migrate the persistence directory from schema 4 to 5.

Summary of changes from schema 4:

- Adds a new "protocol_kind" column to protocols table
"""

from pathlib import Path
from contextlib import ExitStack
import shutil
from typing import Any

import sqlalchemy

from ..database import sql_engine_ctx
from ..tables import schema_5
from .._folder_migrator import Migration

_DB_FILE = "robot_server.db"


class Migration4to5(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 4 to 5."""
        # Copy over all existing directories and files to new version
        for item in source_dir.iterdir():
            if item.is_dir():
                shutil.copytree(src=item, dst=dest_dir / item.name)
            else:
                shutil.copy(src=item, dst=dest_dir / item.name)
        dest_db_file = dest_dir / _DB_FILE

        # Append the new column to existing protocols in v4 database
        with ExitStack() as exit_stack:
            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))
            schema_5.metadata.create_all(dest_engine)

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
                schema_5.protocol_table.name,
                schema_5.protocol_table.c.protocol_kind,
            )
