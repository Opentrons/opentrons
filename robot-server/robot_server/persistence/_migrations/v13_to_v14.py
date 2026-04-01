"""Migrate the persistence directory from schema 13 to 14.

Summary of changes from schema 13:

This schema version adds the camera_capture_image_settings_table which contains the global camera settings.
"""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ..database import sql_engine_ctx
from ..file_and_directory_names import DB_FILE
from ..tables import schema_14
from ._util import copy_contents


class Migration13to14(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 13 to 14."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        dest_db_file = dest_dir / DB_FILE

        with sql_engine_ctx(dest_db_file) as engine:
            with engine.begin() as connection:
                # Create the new capture image settings table
                schema_14.camera_capture_image_settings_table.create(connection)
