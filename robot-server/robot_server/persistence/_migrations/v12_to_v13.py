"""Migrate the persistence directory from schema 12 to 13.

Summary of changes from schema 13:

This compatability change adds additional camera related fields to the BooleanSettingKey table.
"""

from pathlib import Path

from ._util import copy_contents
from .._folder_migrator import Migration
import sqlalchemy
from ..database import sql_engine_ctx

from robot_server.persistence.tables import schema_11, schema_13
from robot_server.persistence.file_and_directory_names import DB_FILE


class Migration12to13(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 12 to 13."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        with sql_engine_ctx(
            dest_dir / DB_FILE
        ) as engine, engine.begin() as transaction:
            assert (
                schema_11.boolean_setting_table.name
                != schema_13.boolean_setting_table.name
            )
            _migrate_boolean_settings_table(transaction)


def _migrate_boolean_settings_table(connection: sqlalchemy.engine.Connection) -> None:
    """Migrate the exist `boolean_settings` table to the new schema."""
    old_boolean_settings = connection.execute(
        sqlalchemy.select(schema_11.boolean_setting_table)
    )
    # create a new boolean settings table to account for new constraints
    schema_13.boolean_setting_table.create(connection)

    # up-migrate all the old elements and new elements to the new table
    for table_row in old_boolean_settings:
        connection.execute(
            sqlalchemy.insert(schema_13.boolean_setting_table).values(
                key=table_row.key, value=table_row.value
            )
        )
    new_rows = [
        {"key": str(schema_13.BooleanSettingKey.ENABLE_CAMERA.value), "value": False},
        {
            "key": str(schema_13.BooleanSettingKey.ENABLE_LIVE_STREAM.value),
            "value": False,
        },
        {
            "key": str(schema_13.BooleanSettingKey.ENABLE_ERROR_RECOVERY_CAMERA.value),
            "value": False,
        },
    ]
    connection.execute(sqlalchemy.insert(schema_13.boolean_setting_table), new_rows)

    # drop the old boolean settings table
    schema_11.boolean_setting_table.drop(connection)
