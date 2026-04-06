"""Migrate the persistence directory from schema 15 to 16.

Summary of changes from schema 15:

- Adds new access control keys to the boolean_setting_extended table's
  BooleanSettingKey enum. Since the column uses create_constraint=False,
  no actual table DDL changes are needed — the new enum values are just
  strings inserted into an existing TEXT column.

  However, SQLAlchemy computes the VARCHAR length from the longest enum value,
  so we recreate the table to keep metadata.create_all() and the migrated DB
  in sync.
"""

from pathlib import Path

import sqlalchemy

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx
from ..file_and_directory_names import DB_FILE
from ..tables import schema_15, schema_16
from ._util import copy_contents, copy_rows_unmodified


class Migration15to16(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 15 to 16."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE
        source_db_file = source_dir / DB_FILE

        with (
            sql_engine_ctx(dest_db_file) as dest_engine,
            sql_engine_ctx(source_db_file) as source_engine,
        ):
            with source_engine.begin() as source_conn, dest_engine.begin() as dest_conn:
                _migrate_boolean_setting_table(source_conn, dest_conn)


def _migrate_boolean_setting_table(
    source_conn: sqlalchemy.engine.Connection,
    dest_conn: sqlalchemy.engine.Connection,
) -> None:
    dest_conn.execute(sqlalchemy.text("DROP TABLE IF EXISTS boolean_setting_extended"))
    schema_16.boolean_setting_table.create(dest_conn)
    copy_rows_unmodified(
        source_table=schema_15.boolean_setting_table,
        dest_table=schema_16.boolean_setting_table,
        source_connection=source_conn,
        dest_connection=dest_conn,
        order_by_rowid=False,
    )
