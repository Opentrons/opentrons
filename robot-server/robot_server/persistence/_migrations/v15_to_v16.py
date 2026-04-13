"""Migrate the persistence directory from schema 15 to 16.

Summary of changes from schema 15:

- Adds new access control keys to the boolean_setting_extended table's
  BooleanSettingKey enum. SQLAlchemy computes the VARCHAR length from the
  longest enum value, so we recreate the table to keep metadata.create_all()
  and the migrated DB in sync.
"""

from pathlib import Path

import sqlalchemy

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx
from ..file_and_directory_names import DB_FILE
from ..tables import schema_16
from ._util import copy_contents


class Migration15to16(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 15 to 16."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE

        with sql_engine_ctx(dest_db_file) as dest_engine:
            with dest_engine.begin() as conn:
                _migrate_boolean_setting_table(conn)


def _migrate_boolean_setting_table(conn: sqlalchemy.engine.Connection) -> None:
    # Read existing rows as raw strings to avoid SQLAlchemy enum validation
    # across different BooleanSettingKey classes (schema_15 vs schema_16).
    existing_rows = conn.execute(
        sqlalchemy.text('SELECT "key", value FROM boolean_setting_extended')
    ).fetchall()

    conn.execute(sqlalchemy.text("DROP TABLE boolean_setting_extended"))
    schema_16.boolean_setting_table.create(conn)

    for key, value in existing_rows:
        conn.execute(
            sqlalchemy.text(
                'INSERT INTO boolean_setting_extended ("key", value) VALUES (:key, :value)'
            ),
            {"key": key, "value": value},
        )
