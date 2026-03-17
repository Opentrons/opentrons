"""Migrate the persistence directory from schema 14 to 15.

Summary of changes from schema 14:

- Adds a new table to store command annotations
- Adds a new table to store mapping of commands to command annotations
"""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx
from ..file_and_directory_names import DB_FILE
from ..tables import schema_15
from ._util import copy_contents


class Migration14to15(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 13 to 14."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE

        with sql_engine_ctx(dest_db_file) as engine:
            with engine.begin() as connection:
                # Create the new annotations tables
                schema_15.command_annotation_table.create(connection)
                schema_15.command_to_annotation_table.create(connection)
