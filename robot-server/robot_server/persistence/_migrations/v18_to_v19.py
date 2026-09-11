"""Migrate the persistence directory from schema 18 to 19.

Summary of changes from schema 18:

- Adds a "log_period_id" column to the "run" table.
"""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx
from ..file_and_directory_names import DB_FILE
from ..tables import schema_19
from ._util import add_column, copy_contents


class Migration18to19(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 18 to 19."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE

        with sql_engine_ctx(dest_db_file) as dest_engine:
            add_column(
                dest_engine,
                schema_19.run_table.name,
                schema_19.run_table.c.log_period_id,
            )
