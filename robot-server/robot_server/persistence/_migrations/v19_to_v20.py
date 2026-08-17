"""Migrate the persistence directory from schema 19 to 20.

Summary of changes from schema 19:

- Adds a "result" column to the "analysis" table.
"""

from pathlib import Path

import sqlalchemy

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx
from ..file_and_directory_names import DB_FILE
from ..tables import schema_20
from ._util import add_column, copy_contents


class Migration19to20(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 19 to 20."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE

        with sql_engine_ctx(dest_db_file) as dest_engine:
            add_column(
                dest_engine,
                schema_20.analysis_table.name,
                schema_20.analysis_table.c.result,
            )
            with dest_engine.begin() as transaction:
                transaction.execute(
                    sqlalchemy.text(
                        """
                        UPDATE analysis
                        SET result = json_extract(completed_analysis, '$.result')
                        """
                    )
                )
