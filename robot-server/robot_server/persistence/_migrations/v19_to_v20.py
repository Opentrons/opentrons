"""Migrate the persistence directory from schema 19 to 20.

Summary of changes from schema 19:

- Adds a "result" column to the "analysis" table and populates it with
  existing result data from "completed_analysis" column, if any.
"""

import json
from contextlib import ExitStack
from pathlib import Path

import sqlalchemy

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx, sqlite_rowid
from ..file_and_directory_names import DB_FILE
from ..tables import schema_20
from ._util import add_column, copy_contents


class Migration19to20(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 19 to 20."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE

        with ExitStack() as exit_stack:
            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))
            add_column(
                dest_engine,
                schema_20.analysis_table.name,
                schema_20.analysis_table.c.result,
            )

            conn = exit_stack.enter_context(dest_engine.begin())
            _update_result_column(conn)


def _update_result_column(
    conn: sqlalchemy.engine.Connection,
) -> None:
    """Add a new 'result' column to analysis table."""
    select_analyses = sqlalchemy.select(schema_20.analysis_table).order_by(sqlite_rowid)
    for analysis_row in conn.execute(select_analyses).all():
        result_data = sqlalchemy.func.json_extract(
            analysis_row.completed_analysis, "$.result"
        )

        update_row = (
            sqlalchemy.update(schema_20.analysis_table)
            .where(schema_20.analysis_table.c.id == analysis_row.id)
            .values(result=result_data)
        )
        conn.execute(update_row)
