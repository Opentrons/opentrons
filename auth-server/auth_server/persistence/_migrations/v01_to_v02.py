"""Migrate the persistence directory from schema v01 to v02.

Copies the existing database so users and CRS settings are preserved, then
runs Alembic to add temporary_hashed_password and make hashed_password
nullable.
"""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ._util import alembic_upgrade, copy_contents
from auth_server.persistence.file_and_directory_names import DB_FILE


class Migration1to2(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Copy the v01 database and upgrade it to Alembic c3a91d4e2b70."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)
        alembic_upgrade(dest_dir / DB_FILE, "c3a91d4e2b70")
