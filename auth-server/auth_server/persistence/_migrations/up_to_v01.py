"""Initial schema migration – creates the auth-server database from scratch."""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ._util import alembic_upgrade
from auth_server.persistence.file_and_directory_names import DB_FILE


class MigrationUpTo1(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        dest_db_file = dest_dir / DB_FILE
        alembic_upgrade(dest_db_file, "b8c4e2f1a903")
